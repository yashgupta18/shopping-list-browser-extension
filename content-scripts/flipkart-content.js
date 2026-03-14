// Content script for Flipkart.com
(function () {
  "use strict";

  function extractFlipkartItems() {
    const items = [];

    // Check if we're on wishlist page
    if (window.location.href.includes("/wishlist")) {
      const wishlistItems = document.querySelectorAll(
        '[class*="wishlist"] ._1NKmdb, ._3O0U0u, ._2f8vY5',
      );

      wishlistItems.forEach((item) => {
        const itemData = extractItemData(item, "wishlist");
        if (itemData) items.push(itemData);
      });
    }

    // Check if we're on cart page
    if (
      window.location.href.includes("/cart") ||
      window.location.href.includes("/viewcart")
    ) {
      const cartItems = document.querySelectorAll(
        '._1NKmdb, ._3O0U0u, ._2f8vY5, [class*="cartItem"]',
      );

      cartItems.forEach((item) => {
        const itemData = extractItemData(item, "cart");
        if (itemData) items.push(itemData);
      });
    }

    return items;
  }

  function extractItemData(element, type) {
    try {
      const nameEl = element.querySelector(
        '._2B_pmu, .s1Q9rs, ._4rR01T, a[class*="title"]',
      );
      const priceEl = element.querySelector(
        '._30jeq3, ._1LlfP8, ._3I9_wc, [class*="price"]',
      );
      const imageEl = element.querySelector("img");
      const linkEl = element.querySelector('a[href*="/p/"], a[href*="pid="]');

      const name =
        nameEl?.textContent?.trim() || nameEl?.getAttribute("title") || "";
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9.]/g, "");
      const image = imageEl?.src || imageEl?.getAttribute("data-src") || "";
      const url = linkEl?.href || window.location.href;

      // Try to extract size and color
      const sizeEl = element.querySelector('[class*="size"], .sizeSelect');
      const colorEl = element.querySelector(
        '[class*="color"], [class*="Color"]',
      );

      const size = sizeEl?.textContent?.trim() || "";
      const color = colorEl?.textContent?.trim() || "";

      if (name && price) {
        return {
          name,
          price: `₹${price}`,
          image,
          url,
          size,
          color,
          type,
          site: "Flipkart",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Flipkart item:", error);
    }
    return null;
  }

  // Extract items and send to background script
  function scanAndSave() {
    const items = extractFlipkartItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "flipkart",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Flipkart`);
          }
        },
      );
    }
  }

  // Run on page load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scanAndSave);
  } else {
    scanAndSave();
  }

  // Also run when URL changes (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(scanAndSave, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
