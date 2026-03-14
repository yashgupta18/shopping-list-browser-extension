// Content script for Ajio.com
(function () {
  "use strict";

  function extractAjioItems() {
    const items = [];

    // Check if we're on wishlist page
    if (
      window.location.href.includes("/wishlist") ||
      window.location.href.includes("/my-wish-list")
    ) {
      const wishlistItems = document.querySelectorAll(
        '.item, .product, [class*="wishlist"] [class*="item"]',
      );

      wishlistItems.forEach((item) => {
        const itemData = extractItemData(item, "wishlist");
        if (itemData) items.push(itemData);
      });
    }

    // Check if we're on bag/cart page
    if (
      window.location.href.includes("/bag") ||
      window.location.href.includes("/cart")
    ) {
      const cartItems = document.querySelectorAll(
        '.bag-item, .cart-item, [class*="bag"] [class*="item"]',
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
        '[class*="name"], [class*="title"], h2, h3, .prod-name',
      );
      const priceEl = element.querySelector(
        '[class*="price"], .price-value, .product-price',
      );
      const imageEl = element.querySelector("img");
      const linkEl = element.querySelector('a[href*="/p/"]');

      const name = nameEl?.textContent?.trim() || "";
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9.]/g, "");
      const image = imageEl?.src || "";
      const url = linkEl?.href || window.location.href;

      // Try to extract size and color
      const sizeEl = element.querySelector('[class*="size"], .size-value');
      const colorEl = element.querySelector('[class*="color"], .color-value');

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
          site: "Ajio",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Ajio item:", error);
    }
    return null;
  }

  // Extract items and send to background script
  function scanAndSave() {
    const items = extractAjioItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "ajio",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Ajio`);
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
