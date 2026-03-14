// Background service worker for the Shopping Wishlist Aggregator extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveItems") {
    saveItems(request.site, request.items);
    sendResponse({ success: true });
  } else if (request.action === "getItems") {
    getItems(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Save items from a specific site
function saveItems(site, items) {
  chrome.storage.local.get(["shoppingItems"], (result) => {
    const shoppingItems = result.shoppingItems || {};
    const existingSiteData = shoppingItems[site] || { items: [] };
    const existingItems = existingSiteData.items || [];

    // Determine the type of items being saved (wishlist or cart)
    const newItemType = items.length > 0 ? items[0].type : null;

    if (newItemType) {
      // Remove existing items of the same type
      const otherTypeItems = existingItems.filter(
        (item) => item.type !== newItemType,
      );

      // Combine: keep items of other type + add new items of this type
      const combinedItems = [...otherTypeItems, ...items];

      shoppingItems[site] = {
        items: combinedItems,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // If no items, just update with empty array for this site
      shoppingItems[site] = {
        items: items,
        lastUpdated: new Date().toISOString(),
      };
    }

    chrome.storage.local.set({ shoppingItems }, () => {
      console.log(
        `Saved ${items.length} items from ${site} (${newItemType || "unknown"})`,
      );
    });
  });
}

// Get all items from storage
function getItems(callback) {
  chrome.storage.local.get(["shoppingItems"], (result) => {
    callback({ items: result.shoppingItems || {} });
  });
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Shopping Wishlist Aggregator installed");
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
