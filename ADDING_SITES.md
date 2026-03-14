# Adding New E-commerce Sites

This guide explains how to add support for new e-commerce websites to the Shopping Wishlist Aggregator extension.

## Dynamic vs Site-Specific Approach

### Why Site-Specific Content Scripts Are Required

**The extension needs site-specific content scripts** because:

1. **Different HTML Structures**: Each e-commerce site uses unique DOM structures and HTML elements
2. **Varied CSS Classes**: Sites use different naming conventions for CSS classes (e.g., `.product-name` vs `.prod-title` vs `.item-name`)
3. **Different Page URLs**: Wishlist and cart URLs vary across sites (e.g., `/wishlist`, `/my-wish-list`, `/account/wishlist`)
4. **Unique Selectors**: Product information is nested differently in each site's HTML

### Our Hybrid Approach

We've implemented a **hybrid approach** that balances flexibility with site-specific needs:

- **`shared-utils.js`**: Contains reusable utility functions for common operations
- **Site-specific content scripts**: Each site has its own script with custom selectors

This approach reduces code duplication while maintaining the flexibility to handle each site's unique structure.

## How to Add a New Site

### Step 1: Identify the Site Structure

Visit the site's wishlist and cart pages and inspect the HTML to find:

1. **Container selectors**: Elements that wrap each product item
2. **Product name**: Element containing the product title
3. **Price**: Element showing the price
4. **Image**: The product image element
5. **Link**: Product detail page URL
6. **Size/Color**: Variant information (if available)

**Example inspection process:**

```javascript
// Open browser DevTools (F12) on the wishlist/cart page
// Find repeating product elements, note their classes/IDs
```

### Step 2: Create Content Script

Create a new file in `content-scripts/` directory:

**Template**: `newsite-content.js`

```javascript
// Content script for NewSite
(function () {
  "use strict";

  function extractNewSiteItems() {
    const items = [];

    // Check if on wishlist page
    if (window.location.href.includes("/wishlist")) {
      const wishlistItems = document.querySelectorAll(".your-item-selector");

      wishlistItems.forEach((item) => {
        const itemData = extractItemData(item, "wishlist");
        if (itemData) items.push(itemData);
      });
    }

    // Check if on cart page
    if (window.location.href.includes("/cart")) {
      const cartItems = document.querySelectorAll(".your-cart-selector");

      cartItems.forEach((item) => {
        const itemData = extractItemData(item, "cart");
        if (itemData) items.push(itemData);
      });
    }

    return items;
  }

  function extractItemData(element, type) {
    try {
      // Customize these selectors based on site structure
      const nameEl = element.querySelector('.product-name, [class*="name"]');
      const priceEl = element.querySelector('.price, [class*="price"]');
      const imageEl = element.querySelector("img");
      const linkEl = element.querySelector('a[href*="/product"]');

      const name = nameEl?.textContent?.trim() || "";
      const priceText = priceEl?.textContent?.trim() || "";
      const price = priceText.replace(/[^0-9.,]/g, "").replace(/,/g, "");
      const image = imageEl?.src || imageEl?.dataset?.src || "";
      const url = linkEl?.href || window.location.href;

      // Extract variants
      const sizeEl = element.querySelector('[class*="size"]');
      const colorEl = element.querySelector('[class*="color"]');

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
          site: "NewSite",
          addedAt: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.error("Error extracting NewSite item:", error);
    }
    return null;
  }

  function scanAndSave() {
    const items = extractNewSiteItems();

    if (items.length > 0) {
      chrome.runtime.sendMessage(
        {
          action: "saveItems",
          site: "newsite", // lowercase key for storage
          items: items,
        },
        (response) => {
          if (response?.success) {
            console.log(`Saved ${items.length} items from NewSite`);
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

  // Setup URL change detection for SPAs
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(scanAndSave, 1000);
    }
  }).observe(document, { subtree: true, childList: true });
})();
```

### Step 3: Update manifest.json

Add host permissions and content script entry:

```json
{
  "host_permissions": [
    // ... existing sites
    "https://*.newsite.com/*"
  ],
  "content_scripts": [
    // ... existing scripts
    {
      "matches": ["https://*.newsite.com/*"],
      "js": ["content-scripts/newsite-content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

### Step 4: Update popup.html

Add a tab for the new site:

```html
<nav class="tabs">
  <!-- ... existing tabs -->
  <button class="tab" data-filter="newsite">NewSite</button>
</nav>
```

### Step 5: Update popup.js

Add site display name mapping:

```javascript
function getSiteDisplayName(site) {
  const names = {
    // ... existing sites
    newsite: "NewSite",
  };
  return names[site] || site;
}
```

### Step 6: Test

1. Reload the extension in `chrome://extensions/`
2. Visit the new site's wishlist/cart page
3. Check browser console for any errors
4. Click extension icon to verify items are displayed
5. Test the "View on [Site]" button

## Tips for Finding Selectors

### Common Selector Patterns

```javascript
// Product containers
(".product-card", ".item", '[class*="product"]', '[class*="item"]');

// Product names
(".product-name", ".product-title", '[class*="name"]', "h3", "h4");

// Prices
(".price", '[class*="price"]', ".amount", '[class*="cost"]');

// Images
("img", 'img[src*="product"]', "picture img");

// Links
('a[href*="/product"]', 'a[href*="/p/"]', 'a[href*="/item"]');
```

### Using Browser DevTools

1. Open DevTools (F12 or Cmd+Opt+I)
2. Click the "Select Element" tool (Cmd+Shift+C)
3. Click on a product item to see its HTML structure
4. Look for unique or consistent class names
5. Test selectors in the Console: `document.querySelectorAll('.your-selector')`

### Debugging Tips

```javascript
// Add logging to see what's being extracted
console.log("Found items:", items);
console.log("Extracted data:", { name, price, image, url });

// Check if selectors are working
console.log("Name element:", nameEl);
console.log("Price element:", priceEl);
```

## Common Issues

### Items Not Showing Up

- **Check URL patterns**: Ensure `window.location.href.includes()` matches the actual URLs
- **Verify selectors**: Use DevTools to confirm selectors match the page structure
- **Wait for content**: Some sites load content dynamically; adjust the MutationObserver delay
- **Check permissions**: Ensure `host_permissions` includes the site domain

### Wrong Data Extracted

- **Inspect HTML carefully**: The site might have multiple elements with similar selectors
- **Use more specific selectors**: Add parent context or combine selectors
- **Test edge cases**: Check products with and without images, sales, variants

### Site Uses React/Vue/Angular

- **Wait for render**: Single-page apps take time to render content
- **Use MutationObserver**: Already included in template for detecting URL changes
- **Check for data attributes**: SPAs often use `data-*` attributes

## Currently Supported Sites

✅ Ajio
✅ Flipkart
✅ Amazon India
✅ Myntra
✅ Snitch
✅ Lifestyle Stores
✅ Uniqlo
✅ Shoppers Stop

## Need Help?

If you're having trouble adding a new site:

1. Check the browser console for errors
2. Compare with existing content scripts
3. Test selectors manually in DevTools Console
4. Start with simple selectors and refine gradually
