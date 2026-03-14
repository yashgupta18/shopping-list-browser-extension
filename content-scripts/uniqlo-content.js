// Content script for Uniqlo
(function () {
  "use strict";

  function extractUniqloItems() {
    const items = [];

    // Try multiple selectors
    const selectors = [
      ".fr-ec-product-tile-resize-wrapper",
      ".fr-ec-product-tile",
      '[class*="fr-ec-product-tile"]',
      ".fr-ec-template-cart__left .fr-ec-content-alignment",
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
      // Uniqlo specific selectors
      const nameEl = element.querySelector(
        "h3.fr-ec-title, .fr-ec-product-tile__end-product-name",
      );
      const priceEl = element.querySelector(".fr-ec-price-text");
      const imageEl = element.querySelector("img.fr-ec-image__img");
      const linkEl = element.querySelector(".fr-ec-product-tile__image a");

      const name = nameEl?.textContent?.trim() || "";
      const priceText = priceEl?.textContent?.trim() || "";
      // Extract numbers from "Rs. 490.00" format
      // Remove currency symbols and text, keep only numbers and decimal
      let price = priceText.replace(/[^\d.]/g, "");
      // Remove leading periods if any
      price = price.replace(/^\.+/, "");
      const image =
        imageEl?.src ||
        imageEl?.dataset?.src ||
        imageEl?.getAttribute("data-src") ||
        "";
      const url = linkEl?.href || window.location.href;

      // Extract size and color from Uniqlo's flag-text elements
      const flagTexts = element.querySelectorAll(".fr-ec-flag-text");
      let size = "";
      let color = "";

      flagTexts.forEach((flag) => {
        const text = flag.textContent?.trim() || "";
        if (text.toLowerCase().includes("size:")) {
          size = text.replace(/size:/i, "").trim();
        } else if (
          text.toLowerCase().includes("color:") ||
          text.toLowerCase().includes("colour:")
        ) {
          color = text.replace(/colou?r:/i, "").trim();
        }
      });

      if (name && price) {
        return {
          name,
          price: `Rs. ${price}`,
          image,
          url,
          size,
          color,
          type,
          site: "Uniqlo",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting Uniqlo item:", error);
    }
    return null;
  }

  function scanAndSave() {
    const items = extractUniqloItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "uniqlo",
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from Uniqlo`);
          }
        },
      );
    }
  }

  // Run on page load with delay to ensure content is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(scanAndSave, 2000);
    });
  } else {
    // Page already loaded, but wait a bit for dynamic content
    setTimeout(scanAndSave, 2000);
  }

  // Also try after a longer delay in case content is very slow to load
  setTimeout(() => {
    scanAndSave();
  }, 5000);

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
