// Popup script for Shopping Wishlist Aggregator

let allItems = {};
let currentFilter = "all";
let currentType = "all";
let searchQuery = "";
let sortOption = "date-desc";
let collapsedSites = {}; // Track collapsed state of each site

// Load items when popup opens
document.addEventListener("DOMContentLoaded", () => {
  loadItems();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", (e) => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.dataset.filter;
      displayItems();
    });
  });

  // Type filter
  document.querySelectorAll(".type-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".type-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      currentType = e.target.dataset.type;
      displayItems();
    });
  });

  // Search input
  document.getElementById("searchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    displayItems();
  });

  // Sort dropdown
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    sortOption = e.target.value;
    displayItems();
  });

  // Refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadItems();
  });

  // Collapse All button
  document.getElementById("collapseAllBtn").addEventListener("click", () => {
    collapseAll();
  });

  // Expand All button
  document.getElementById("expandAllBtn").addEventListener("click", () => {
    expandAll();
  });
}

// Load items from storage
function loadItems() {
  chrome.runtime.sendMessage({ action: "getItems" }, (response) => {
    if (response && response.items) {
      allItems = response.items;
      displayItems();
      updateStats();
    }
  });
}

// Display items based on current filters
function displayItems() {
  const container = document.getElementById("itemsContainer");
  const emptyState = document.getElementById("emptyState");

  // Get filtered items
  let filteredItems = getFilteredItems();

  // Apply search filter
  if (searchQuery) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery),
    );
  }

  // Apply sorting
  filteredItems = sortItems(filteredItems);

  if (filteredItems.length === 0) {
    container.style.display = "none";
    emptyState.style.display = "flex";
    return;
  }

  container.style.display = "grid";
  emptyState.style.display = "none";

  // Show/hide collapse controls based on filter
  const collapseControls = document.getElementById("collapseControls");
  if (currentFilter === "all" && filteredItems.length > 0) {
    collapseControls.style.display = "flex";
  } else {
    collapseControls.style.display = "none";
  }

  // Clear container
  container.innerHTML = "";

  // Group items by site
  const itemsBySite = {};
  filteredItems.forEach((item) => {
    const site = item.site.toLowerCase();
    if (!itemsBySite[site]) {
      itemsBySite[site] = [];
    }
    itemsBySite[site].push(item);
  });

  // Display items
  Object.keys(itemsBySite).forEach((site) => {
    const items = itemsBySite[site];
    const isCollapsed = collapsedSites[site] || false;

    // Add site header if showing all sites
    if (currentFilter === "all") {
      const siteHeader = document.createElement("div");
      siteHeader.className = "site-header";
      siteHeader.innerHTML = `
        <div class="site-header-left">
          <button class="collapse-btn" data-site="${site}" title="${isCollapsed ? "Expand" : "Collapse"} section">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="collapse-icon ${isCollapsed ? "collapsed" : ""}">
              <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <h3>${getSiteDisplayName(site)}</h3>
          <span class="site-count">${items.length} items</span>
        </div>
        <button class="open-all-btn" data-site="${site}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 5H8.2C7.0799 5 6.51984 5 6.09202 5.21799C5.71569 5.40973 5.40973 5.71569 5.21799 6.09202C5 6.51984 5 7.0799 5 8.2V15.8C5 16.9201 5 17.4802 5.21799 17.908C5.40973 18.2843 5.71569 18.5903 6.09202 18.782C6.51984 19 7.0799 19 8.2 19H15.8C16.9201 19 17.4802 19 17.908 18.782C18.2843 18.5903 18.5903 18.2843 18.782 17.908C19 17.4802 19 16.9201 19 15.8V14M15 10L21 4M21 4H15M21 4V10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Open All in Tabs
        </button>
      `;
      container.appendChild(siteHeader);

      // Add click event to collapse button
      siteHeader
        .querySelector(".collapse-btn")
        .addEventListener("click", (e) => {
          const site = e.currentTarget.dataset.site;
          toggleSiteCollapse(site);
        });

      // Add click event to "Open All in Tabs" button
      siteHeader
        .querySelector(".open-all-btn")
        .addEventListener("click", (e) => {
          const site = e.currentTarget.dataset.site;
          openAllInTabs(site);
        });
    }

    // Create a container for items (to allow collapse/expand)
    const itemsWrapper = document.createElement("div");
    itemsWrapper.className = `site-items-wrapper ${isCollapsed ? "collapsed" : ""}`;
    itemsWrapper.dataset.site = site;

    // Add items
    items.forEach((item) => {
      const itemCard = createItemCard(item);
      itemsWrapper.appendChild(itemCard);
    });

    container.appendChild(itemsWrapper);
  });
}

// Get filtered items based on current filters
function getFilteredItems() {
  const items = [];

  Object.keys(allItems).forEach((site) => {
    if (currentFilter !== "all" && currentFilter !== site) {
      return;
    }

    if (allItems[site] && allItems[site].items) {
      allItems[site].items.forEach((item) => {
        if (currentType === "all" || currentType === item.type) {
          items.push(item);
        }
      });
    }
  });

  return items;
}

// Create item card HTML
function createItemCard(item) {
  const card = document.createElement("div");
  card.className = "item-card";

  const typeClass = item.type === "wishlist" ? "type-wishlist" : "type-cart";
  const typeBadge = item.type === "wishlist" ? "Wishlist" : "Cart";

  card.innerHTML = `
    <div class="item-image">
      ${item.image ? `<img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'">` : ""}
    </div>
    <div class="item-details">
      <div class="item-header">
        <span class="item-badge ${typeClass}">${typeBadge}</span>
        ${currentFilter === "all" ? `<span class="site-badge">${item.site}</span>` : ""}
      </div>
      <h4 class="item-name" title="${item.name}">${truncateText(item.name, 60)}</h4>
      <p class="item-price">${item.price}</p>
      ${
        item.size || item.color
          ? `
        <div class="item-meta">
          ${item.size ? `<span class="meta-item">Size: ${item.size}</span>` : ""}
          ${item.color ? `<span class="meta-item">Color: ${item.color}</span>` : ""}
        </div>
      `
          : ""
      }
      <button class="view-btn" data-url="${item.url}">
        View on ${item.site}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 3L15 3M21 3L21 9M21 3L13 11M10 5H7.8C6.11984 5 5.27976 5 4.63803 5.32698C4.07354 5.6146 3.6146 6.07354 3.32698 6.63803C3 7.27976 3 8.11984 3 9.8V16.2C3 17.8802 3 18.7202 3.32698 19.362C3.6146 19.9265 4.07354 20.3854 4.63803 20.673C5.27976 21 6.11984 21 7.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  // Add click event to view button
  card.querySelector(".view-btn").addEventListener("click", (e) => {
    const url = e.currentTarget.dataset.url;
    chrome.tabs.create({ url: url });
  });

  return card;
}

// Update stats
function updateStats() {
  const totalItems = getFilteredItems().length;
  document.getElementById("totalItems").textContent = totalItems;

  // Get most recent update time
  let lastUpdated = null;
  Object.keys(allItems).forEach((site) => {
    if (allItems[site] && allItems[site].lastUpdated) {
      const updatedDate = new Date(allItems[site].lastUpdated);
      if (!lastUpdated || updatedDate > lastUpdated) {
        lastUpdated = updatedDate;
      }
    }
  });

  if (lastUpdated) {
    document.getElementById("lastUpdated").textContent =
      formatTimeAgo(lastUpdated);
  } else {
    document.getElementById("lastUpdated").textContent = "Never";
  }
}

// Utility function to get site display name
function getSiteDisplayName(site) {
  const names = {
    ajio: "Ajio",
    flipkart: "Flipkart",
    amazon: "Amazon",
    myntra: "Myntra",
    snitch: "Snitch",
    lifestyle: "Lifestyle",
    uniqlo: "Uniqlo",
    shoppersstop: "Shoppers Stop",
  };
  return names[site] || site;
}

// Utility function to truncate text
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Utility function to format time ago
function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}

// Sort items based on selected option
function sortItems(items) {
  const sorted = [...items];

  switch (sortOption) {
    case "price-low":
      sorted.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
        return priceA - priceB;
      });
      break;

    case "price-high":
      sorted.sort((a, b) => {
        const priceA = parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0;
        const priceB = parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0;
        return priceB - priceA;
      });
      break;

    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "date-asc":
      sorted.sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));
      break;

    case "date-desc":
    default:
      sorted.sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt));
      break;
  }

  return sorted;
}

// Toggle site collapse state
function toggleSiteCollapse(site) {
  collapsedSites[site] = !collapsedSites[site];
  displayItems();
}

// Collapse all sites
function collapseAll() {
  // Get filtered items
  let filteredItems = getFilteredItems();

  // Apply search filter
  if (searchQuery) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchQuery),
    );
  }

  // Group items by site to get all visible sites
  const itemsBySite = {};
  filteredItems.forEach((item) => {
    const site = item.site.toLowerCase();
    if (!itemsBySite[site]) {
      itemsBySite[site] = [];
    }
    itemsBySite[site].push(item);
  });

  // Collapse all visible sites
  Object.keys(itemsBySite).forEach((site) => {
    collapsedSites[site] = true;
  });

  displayItems();
}

// Expand all sites
function expandAll() {
  collapsedSites = {};
  displayItems();
}

// Open all items from a site in separate tabs
function openAllInTabs(site) {
  if (!allItems[site] || !allItems[site].items) return;

  const items = allItems[site].items;

  // Filter by current type filter
  const itemsToOpen = items.filter(
    (item) => currentType === "all" || currentType === item.type,
  );

  // Filter by search query if active
  const finalItems = searchQuery
    ? itemsToOpen.filter((item) =>
        item.name.toLowerCase().includes(searchQuery),
      )
    : itemsToOpen;

  // Open each item in a new tab
  finalItems.forEach((item, index) => {
    setTimeout(() => {
      chrome.tabs.create({ url: item.url, active: index === 0 });
    }, index * 100); // Stagger the tab opening by 100ms
  });
}
