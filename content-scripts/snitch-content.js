// Content script for Snitch.com
(function () {
  "use strict";

  function extractSnitchItems() {
    const items = [];

    // Try multiple selectors for Snitch's structure
    const selectors = [
      "div.flex.flex-row.my-2",
      '[class*="flex"][class*="flex-row"]',
      ".product-card",
      ".wishlist-item",
      ".cart-item",
    ];

    let foundElements = [];

    // Check if we're on wishlist page
    if (window.location.href.includes("/wishlist")) {
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements = Array.from(elements);
          break;
        }
      }

      foundElements.forEach((item) => {
        const itemData = extractItemData(item, "wishlist");
        if (itemData) items.push(itemData);
      });
    }

    // Check if we're on cart page
    if (window.location.href.includes("/cart")) {
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          foundElements = Array.from(elements);
          break;
        }
      }

      foundElements.forEach((item) => {
        const itemData = extractItemData(item, "cart");
        if (itemData) items.push(itemData);
      });
    }

    return items;
  }

  function extractItemData(element, type) {
    try {
      // Snitch specific selectors based on their Tailwind CSS structure
      const nameEl = element.querySelector(
        'h1.pt-2.text-black, h1[class*="text-black"], [class*="product-title"]',
      );
      const priceEl = element.querySelector(
        'p[style*="font-size: 13px"], .price, [class*="price"]',
      );
      const imageEl = element.querySelector("img");
      const linkEl = element.querySelector('a[href*="/"]');

      const name = nameEl?.textContent?.trim() || "";
      const priceText = priceEl?.textContent?.trim() || "";
      // Remove currency symbols and commas
      let price = priceText.replace(/[^\d.]/g, "");
      price = price.replace(/^\.+/, "");
      const image = imageEl?.src || imageEl?.dataset?.src || "";
      const url = linkEl?.href
        ? new URL(linkEl.href, window.location.origin).href
        : window.location.href;

      // Extract color from the flex text-black div
      const colorEl = element.querySelector(
        'div.flex.text-black span, [class*="color"]',
      );
      const color = colorEl?.textContent?.trim() || "";

      // For size, look for common size patterns
      const sizeEl = element.querySelector('[class*="size"], .variant-size');
      const size = sizeEl?.textContent?.trim() || "";

      if (name && price) {
        return {
          name,
          price: `₹${price}`,
          image,
          url,
          size,
          color,
          type,
          site: "Snitch",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Snitch item:", error);
    }
    return null;
  }

  function scanAndSave() {
    const items = extractSnitchItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "snitch",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Snitch`);
          }
        },
      );
    }
  }

  // Run on page load with delays for dynamic content
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(scanAndSave, 2000);
    });
  } else {
    setTimeout(scanAndSave, 2000);
  }

  // Try again after longer delay for slow loading
  setTimeout(scanAndSave, 5000);

  // Setup URL change detection
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(scanAndSave, 3000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
