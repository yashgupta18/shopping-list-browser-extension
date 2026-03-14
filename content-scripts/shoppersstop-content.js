// Content script for Shoppers Stop
(function () {
  "use strict";

  function extractShoppersStopItems() {
    const items = [];

    // Check if we're on wishlist page
    if (window.location.href.includes("/wishlist")) {
      // Find the wishlist grid container first to avoid "you may also like" items
      const wishlistGrid = document.querySelector(
        '.grid.grid-cols-2, div[class*="grid grid-cols-2"]',
      );

      if (wishlistGrid) {
        // Only look for items within the wishlist grid
        const wishlistItems = wishlistGrid.querySelectorAll(
          'img[alt="product card"]',
        );

        wishlistItems.forEach((img) => {
          // Get the parent container
          const container = img.closest(
            '.pr-0.min-h-full, div[class*="min-h-full"]',
          );
          if (container) {
            const itemData = extractWishlistItemData(container, "wishlist");
            if (itemData) items.push(itemData);
          }
        });
      }
    }

    // Check if we're on cart page
    if (
      window.location.href.includes("/cart") ||
      window.location.href.includes("/bag")
    ) {
      const cartItems = document.querySelectorAll(
        '[data-item-type="CartProductCard"]',
      );

      cartItems.forEach((item) => {
        const itemData = extractCartItemData(item, "cart");
        if (itemData) items.push(itemData);
      });
    }

    return items;
  }

  function extractWishlistItemData(element, type) {
    try {
      // Image
      const imageEl = element.querySelector('img[alt="product card"]');
      const image = imageEl?.src || "";

      // Brand - font-satoshi-medium span
      const brandEl = element.querySelector(".font-satoshi-medium");
      const brand = brandEl?.textContent?.trim() || "";

      // Product name - text-gray2-500 span
      const nameEl = element.querySelector(".text-gray2-500");
      const productName = nameEl?.textContent?.trim() || "";

      // Combine brand and product name
      const name =
        brand && productName ? `${brand} ${productName}` : productName || brand;

      // Price - text-gray2-900
      const priceEl = element.querySelector(".text-gray2-900");
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9]/g, "");

      // URL - from link
      const linkEl = element.querySelector('a[href*="/colorChange/"]');
      const url = linkEl?.href || window.location.href;

      const size = "";
      const color = "";

      if (name && price) {
        return {
          name,
          price: `₹${price}`,
          image,
          url,
          size,
          color,
          type,
          site: "Shoppers Stop",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Shoppers Stop wishlist item:", error);
    }
    return null;
  }

  function extractCartItemData(element, type) {
    try {
      // Image
      const imageEl = element.querySelector('img[alt="product_img"]');
      const image = imageEl?.src || "";

      // Name - the entire text content in the main div
      const nameContainer = element.querySelector(".line-clamp-2.font-satoshi");
      const fullText = nameContainer?.textContent?.trim() || "";

      // Split by the brand (first word) and rest
      const name = fullText;

      // Price - text-gray2-900 with font-medium
      const priceEl = element.querySelector(
        ".font-satoshi.text-sm.font-medium.text-gray2-900, .font-satoshi.text-base.font-medium.text-gray2-900",
      );
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9]/g, "");

      // URL - from parent link or current page
      const url = window.location.href;

      // Color - "NoColour" or color text
      const colorEl = element.querySelector(".whitespace-nowrap.font-satoshi");
      const color = colorEl?.textContent?.trim() || "";

      // Size - not readily available
      const size = "";

      if (name && price) {
        return {
          name,
          price: `₹${price}`,
          image,
          url,
          size,
          color,
          type,
          site: "Shoppers Stop",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Shoppers Stop cart item:", error);
    }
    return null;
  }

  function scanAndSave() {
    const items = extractShoppersStopItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "shoppersstop",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Shoppers Stop`);
          }
        },
      );
    }
  }

  // Wait for dynamic content to load (React app)
  setTimeout(() => {
    scanAndSave();
  }, 2000);

  // Setup URL change detection
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(scanAndSave, 2000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
