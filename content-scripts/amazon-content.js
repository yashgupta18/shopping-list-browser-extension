// Content script for Amazon.in
(function () {
  "use strict";

  function extractAmazonItems() {
    const items = [];

    // Check if we're on wishlist page
    if (
      window.location.href.includes("/wishlist") ||
      window.location.href.includes("/hz/wishlist")
    ) {
      const wishlistItems = document.querySelectorAll(
        '[data-itemid], .g-item-sortable, [id^="item_"]',
      );

      wishlistItems.forEach((item) => {
        const itemData = extractItemData(item, "wishlist");
        if (itemData) items.push(itemData);
      });
    }

    // Check if we're on cart page
    if (
      window.location.href.includes("/cart") ||
      window.location.href.includes("/gp/cart")
    ) {
      const cartItems = document.querySelectorAll(
        '[data-name="Active Items"] .sc-list-item, .sc-list-item-content',
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
        '.a-link-normal[title], #sc-active-cart .sc-product-title, h2 a, h5 a, [id*="item-name"]',
      );
      const priceEl = element.querySelector(
        '.a-price .a-offscreen, .sc-product-price, .a-price-whole, [id*="item-price"]',
      );
      const imageEl = element.querySelector('img[src*="images-amazon"]');
      const linkEl = element.querySelector(
        'a[href*="/dp/"], a[href*="/gp/product/"]',
      );

      const name =
        nameEl?.textContent?.trim() || nameEl?.getAttribute("title") || "";
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9.]/g, "");
      const image = imageEl?.src || imageEl?.getAttribute("data-src") || "";
      const url = linkEl?.href || window.location.href;

      // Try to extract size and color
      const sizeEl = element.querySelector('.sc-product-size, [class*="size"]');
      const colorEl = element.querySelector(
        '.sc-product-color, [class*="color"]',
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
          site: "Amazon",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Amazon item:", error);
    }
    return null;
  }

  // Extract items and send to background script
  function scanAndSave() {
    const items = extractAmazonItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "amazon",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Amazon`);
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
