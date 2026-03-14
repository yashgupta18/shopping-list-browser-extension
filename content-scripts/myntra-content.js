// Content script for Myntra.com
(function () {
  "use strict";

  function extractMyntraItems() {
    const items = [];

    // Check if we're on wishlist page
    if (window.location.href.includes("/wishlist")) {
      const wishlistItems = document.querySelectorAll(".itemcard-itemCard");

      wishlistItems.forEach((item) => {
        const itemData = extractItemData(item, "wishlist");
        if (itemData) items.push(itemData);
      });
    }

    // Check if we're on cart page
    if (
      window.location.href.includes("/cart") ||
      window.location.href.includes("/checkout/cart")
    ) {
      const cartItems = document.querySelectorAll(
        ".itemContainer-base-itemMargin",
      );

      cartItems.forEach((item) => {
        const itemData = extractCartItemData(item, "cart");
        if (itemData) items.push(itemData);
      });
    }

    return items;
  }

  function extractItemData(element, type) {
    try {
      // Name - from item details label
      const nameEl = element.querySelector(".itemdetails-itemDetailsLabel");
      const name = nameEl?.textContent?.trim() || "";

      // Price - from bold font (discounted price)
      const priceEl = element.querySelector(".itemdetails-boldFont");
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9]/g, "");

      // Image - from itemcard-itemImage
      const imageEl = element.querySelector(".itemcard-itemImage");
      const image = imageEl?.src || imageEl?.srcset?.split(" ")[0] || "";

      // URL - from link in image div
      const linkEl = element.querySelector(".itemcard-itemImageDiv a[href]");
      const url = linkEl?.href || window.location.href;

      // Size and color might be in description or separate fields
      const descEl = element.querySelector(
        ".itemdetails-itemDetailsDescription",
      );
      const description = descEl?.textContent?.trim() || "";

      // Try to extract size and color from description if available
      let size = "";
      let color = "";

      if (description) {
        const sizeMatch = description.match(/Size:\s*(\S+)/i);
        const colorMatch = description.match(/Color:\s*(\S+)/i);
        size = sizeMatch ? sizeMatch[1] : "";
        color = colorMatch ? colorMatch[1] : "";
      }

      if (name && price) {
        return {
          name,
          price: `₹${price}`,
          image,
          url,
          size,
          color,
          type,
          site: "Myntra",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Myntra item:", error);
    }
    return null;
  }

  function extractCartItemData(element, type) {
    try {
      // Brand
      const brandEl = element.querySelector(".itemContainer-base-brand");
      const brand = brandEl?.textContent?.trim() || "";

      // Product name
      const nameEl = element.querySelector(".itemContainer-base-itemLink");
      const productName = nameEl?.textContent?.trim() || "";

      // Combine brand and product name
      const name =
        brand && productName ? `${brand} ${productName}` : productName || brand;

      // Price - from bold price element
      const priceEl = element.querySelector(
        ".itemComponents-base-price.itemComponents-base-bold",
      );
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9]/g, "");

      // Image
      const imageEl = element.querySelector('img[alt="image"]');
      const image = imageEl?.src || "";

      // URL - from product link
      const url = nameEl?.href || window.location.href;

      // Size - from size container
      const sizeEl = element.querySelector(".itemComponents-base-size");
      const sizeText = sizeEl?.textContent?.trim() || "";
      const size = sizeText.replace(/Size:\s*/i, "").trim();

      // Color - might be in product description (not always visible)
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
          site: "Myntra",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Myntra cart item:", error);
    }
    return null;
  }

  function scanAndSave() {
    const items = extractMyntraItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "myntra",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Myntra`);
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
