// Content script for Lifestyle Stores
(function () {
  "use strict";

  function extractLifestyleItems() {
    const items = [];
    const processedItems = new Set(); // Track processed items to avoid duplicates

    // Check if we're on wishlist page
    if (window.location.href.includes("/wishlist")) {
      // Target the jss633 containers which are the actual item cards
      const wishlistItems = document.querySelectorAll("div.jss633");

      wishlistItems.forEach((container) => {
        // Verify this container has both image and remove button
        const hasImage = container.querySelector("img.jss636[alt]");
        const hasButton = container.querySelector(
          'button[id="removeItemFromFavourites"]',
        );

        if (hasImage && hasButton) {
          const itemKey = hasImage.getAttribute("alt");
          if (itemKey && !processedItems.has(itemKey)) {
            processedItems.add(itemKey);
            const itemData = extractItemData(container, "wishlist");
            if (itemData) items.push(itemData);
          }
        }
      });
    }

    // Check if we're on cart/basket page
    if (
      window.location.href.includes("/cart") ||
      window.location.href.includes("/basket")
    ) {
      const cartItems = document.querySelectorAll('div[id="basketItem"]');

      cartItems.forEach((item) => {
        const itemData = extractCartItemData(item, "cart");
        if (itemData) items.push(itemData);
      });
    }

    return items;
  }

  function extractItemData(element, type) {
    try {
      // Image - has alt attribute with product name
      const imageEl = element.querySelector("img[alt]");

      // Name - either from image alt or from specific div
      const nameFromDiv = element.querySelector('div[class^="jss646"]');
      const name =
        nameFromDiv?.textContent?.trim() || imageEl?.getAttribute("alt") || "";

      // Price - look for sale price (jss643) first, then regular price (jss642)
      const salePriceEl = element.querySelector('div[class^="jss643"]');
      const regularPriceEl = element.querySelector('div[class^="jss642"]');
      const priceEl = salePriceEl || regularPriceEl;

      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9]/g, "");

      const image = imageEl?.src || "";
      const url = window.location.href;

      // Size - from MuiSelect
      const sizeEl = element.querySelector(
        '[id="select-size"], .MuiSelect-select',
      );
      const size = sizeEl?.textContent?.trim().replace("Size", "").trim() || "";

      // Color - might be in product name or variant info
      const colorEl = element.querySelector(
        '[class*="color"], [class*="colour"]',
      );
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
          site: "Lifestyle",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Lifestyle item:", error);
    }
    return null;
  }

  function extractCartItemData(element, type) {
    try {
      // Image
      const imageEl = element.querySelector("img[alt]");
      const image = imageEl?.src || "";

      // Name - from link with href containing "/SHOP-"
      const nameEl = element.querySelector('a[href*="/SHOP-"], a[href*="/p/"]');
      const name =
        nameEl?.textContent?.trim() || imageEl?.getAttribute("alt") || "";

      // Price - look for sale price (itemOfferPrice) first, then regular price
      const salePriceEl = element.querySelector(
        ".itemOfferPrice, span.itemOfferPrice",
      );
      const regularPriceEl = element.querySelector('span[class*="jss708"]');
      const priceEl = salePriceEl || regularPriceEl;

      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9]/g, "");

      // URL - from the product link
      const url = nameEl?.href || window.location.href;

      // Color - look for div after "Colour:" text
      const colorContainer = element.querySelector(".itemColor");
      const colorEl = colorContainer?.querySelector(
        'div[class*="jss773"], div[class*="jss681"]',
      );
      const color = colorEl?.textContent?.trim() || "";

      // Size - look for div after "Size:" text
      const sizeContainer = element.querySelector(".itemSize");
      const sizeEl = sizeContainer?.querySelector(
        'div[class*="jss776"], div[class*="jss681"]',
      );
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
          site: "Lifestyle",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Lifestyle cart item:", error);
    }
    return null;
  }

  function scanAndSave() {
    const items = extractLifestyleItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "lifestyle",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Lifestyle`);
          }
        },
      );
    }
  }

  // Wait for dynamic content to load (Material-UI React app)
  setTimeout(() => {
    scanAndSave();
  }, 3000);

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
