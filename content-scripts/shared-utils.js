// Shared utilities for content scripts
// This provides common functions to extract item data from e-commerce sites

/**
 * Generic item extractor that tries common patterns
 * @param {Element} element - The DOM element containing item info
 * @param {string} type - 'wishlist' or 'cart'
 * @param {string} siteName - Name of the site
 * @param {Object} selectors - Custom selectors for this site
 * @returns {Object|null} - Extracted item data or null
 */
function extractItemData(element, type, siteName, selectors) {
  try {
    // Try to find name/title using provided selectors or common patterns
    const nameSelectors = selectors.name || [
      '[class*="name"]',
      '[class*="title"]',
      '[class*="product-name"]',
      "h2",
      "h3",
      "h4",
      ".prod-name",
      "a[title]",
    ];
    const nameEl = findElement(element, nameSelectors);

    // Try to find price
    const priceSelectors = selectors.price || [
      '[class*="price"]',
      ".price-value",
      ".product-price",
      '[class*="amount"]',
      '[class*="cost"]',
    ];
    const priceEl = findElement(element, priceSelectors);

    // Try to find image
    const imageEl = element.querySelector("img");

    // Try to find link
    const linkSelectors = selectors.link || [
      'a[href*="/product"]',
      'a[href*="/p/"]',
      "a[href]",
    ];
    const linkEl = findElement(element, linkSelectors);

    // Extract text content
    const name =
      nameEl?.textContent?.trim() || nameEl?.getAttribute("title") || "";
    const priceText = priceEl?.textContent?.trim() || "";
    const price = extractPrice(priceText);
    const image = imageEl?.src || imageEl?.dataset?.src || "";
    const url = linkEl?.href || window.location.href;

    // Try to extract size and color
    const sizeSelectors = selectors.size || [
      '[class*="size"]',
      ".size-value",
      '[class*="variant"]',
    ];
    const colorSelectors = selectors.color || [
      '[class*="color"]',
      ".color-value",
      '[class*="colour"]',
    ];

    const sizeEl = findElement(element, sizeSelectors);
    const colorEl = findElement(element, colorSelectors);

    const size = sizeEl?.textContent?.trim() || "";
    const color = colorEl?.textContent?.trim() || "";

    if (name && price) {
      return {
        name,
        price: formatPrice(price),
        image,
        url,
        size,
        color,
        type,
        site: siteName,
        addedAt: new Date().toISOString(),
      };
    }
  } catch (error) {
    console.error(`Error extracting item from ${siteName}:`, error);
  }
  return null;
}

/**
 * Find first element matching any of the selectors
 */
function findElement(parent, selectors) {
  const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
  for (const selector of selectorArray) {
    const el = parent.querySelector(selector);
    if (el) return el;
  }
  return null;
}

/**
 * Extract numeric price from text
 */
function extractPrice(priceText) {
  const match = priceText.match(/[\d,]+\.?\d*/);
  return match ? match[0].replace(/,/g, "") : "";
}

/**
 * Format price with rupee symbol
 */
function formatPrice(price) {
  return price ? `₹${price}` : "";
}

/**
 * Generic scan and save function
 */
function scanAndSave(extractorFn, siteName, siteKey) {
  const items = extractorFn();

  if (items.length > 0) {
    chrome.runtime.sendMessage(
      {
        action: "saveItems",
        site: siteKey,
        items: items,
      },
      (response) => {
        if (response?.success) {
          console.log(`Saved ${items.length} items from ${siteName}`);
        }
      },
    );
  }
}

/**
 * Setup URL change detection for SPAs
 */
function setupUrlChangeDetection(callback) {
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(callback, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
}
