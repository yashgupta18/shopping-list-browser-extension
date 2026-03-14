# Shopping Wishlist Aggregator

A browser extension that aggregates wishlist and cart items from multiple Indian e-commerce websites in one convenient place.

![Extension Preview](https://github.com/yashgupta18/shopping-list-browser-extension/blob/main/assets/preview.png)

## Features

✨ **Multi-Site Support**: Currently supports 8 major Indian e-commerce platforms:

- Ajio
- Flipkart
- Amazon India
- Myntra
- Snitch
- Lifestyle Stores
- Uniqlo
- Shoppers Stop

🎯 **Unified View**: See all your wishlist and cart items from different sites in one place

🔍 **Smart Filtering**: Filter items by site or type (wishlist/cart)

📊 **Item Details**: View product name, price, size, color, and images

🔗 **Direct Links**: Click to open any item directly on the original site

## Installation

### For Development/Testing:

1. **Download the Extension**
   - Clone or download this repository to your local machine

2. **Open Chrome/Edge Extensions Page**
   - Open your browser and navigate to `chrome://extensions/` (or `edge://extensions/`)
   - Enable "Developer mode" using the toggle in the top right

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `shopping-extension` folder
   - The extension will now appear in your browser toolbar

4. **Add Icons (Required)**
   - The extension requires icon files in the `icons/` folder
   - Create three PNG files named:
     - `icon16.png` (16x16 pixels)
     - `icon48.png` (48x48 pixels)
     - `icon128.png` (128x128 pixels)
   - You can create simple shopping bag/cart icons or use any icon generator online

## How to Use

1. **Visit Supported Sites**
   - Go to Ajio, Flipkart, or Amazon India
   - Add items to your wishlist or cart as you normally would

2. **View in Extension**
   - Click the extension icon in your browser toolbar
   - The extension will automatically detect and display your items

3. **Navigate Your Items**
   - Use the site tabs to filter by platform (scrollable for all 8 sites)
   - Use the type buttons (All Items, Wishlist, Cart) to filter by item type
   - Click "View on [Site]" to open the item on the original website

4. **Refresh**
   - Click the "Refresh" button at the bottom to reload items
   - Visit the wishlist/cart pages on supported sites to sync latest items

## How It Works

1. **Content Scripts**: When you visit wishlist or cart pages on supported sites, the extension's content scripts automatically extract item information (name, price, image, size, color, etc.)

2. **Local Storage**: All data is stored locally in your browser using Chrome's storage API - nothing is sent to external servers

3. **Popup Interface**: Click the extension icon to see a unified view of all your items from different sites

## Supported Pages

The extension automatically scans these pages:

**Ajio**:

- Wishlist: `/wishlist`, `/my-wish-list`
- Cart: `/bag`, `/cart`

**Flipkart**:

- Wishlist: `/wishlist`
- Cart: `/cart`, `/viewcart`

**Amazon India**:

- Wishlist: `/wishlist`, `/hz/wishlist`
- Cart: `/cart`, `/gp/cart`

**Myntra**:

- Wishlist: `/wishlist`
- Cart: `/checkout/cart`

**Snitch**:

- Wishlist: `/account/wishlist`
- Cart: `/checkout/cart`

**Lifestyle Stores**:

- Cart: `/cart`

**Uniqlo**:

- Wishlist: `/wishlist`
- Cart: `/cart`

**Shoppers Stop**:

- Wishlist: `/wishlist`
- Cart: `/cart/bag`

## Privacy

- **100% Local**: All data is stored locally in your browser
- **No Tracking**: We don't collect or transmit any personal information
- **No Accounts**: No sign-up or login required
- **Open Source**: Review the code to see exactly what it does

## Troubleshooting

**Items not showing up?**

- Make sure you visited the wishlist or cart page on the supported sites
- Click the "Refresh" button in the extension
- Check that you're on the actual wishlist/cart pages (not just browsing products)

**Extension not loading?**

- Make sure you have the required icon files in the `icons/` folder
- Check that Developer Mode is enabled in `chrome://extensions/`
- Try reloading the extension

**Site-specific issues?**

- E-commerce sites frequently update their designs
- Content scripts may need updates to match new page structures
- Check the browser console for any errors

## Technical Details

**Built With**:

- Manifest V3
- Vanilla JavaScript
- Chrome Extension APIs
- CSS3

**File Structure**:

```
shopping-extension/
├── manifest.json           # Extension configuration
├── background.js           # Service worker for data management
├── popup.html              # Extension popup UI
├── popup.js                # Popup logic
├── popup.css               # Popup styles
├── content-scripts/
│   ├── shared-utils.js     # Shared utility functions
│   ├── ajio-content.js     # Ajio data extraction
│   ├── flipkart-content.js # Flipkart data extraction
│   ├── amazon-content.js   # Amazon data extraction
│   ├── myntra-content.js   # Myntra data extraction
│   ├── snitch-content.js   # Snitch data extraction
│   ├── lifestyle-content.js # Lifestyle data extraction
│   ├── uniqlo-content.js   # Uniqlo data extraction
│   └── shoppersstop-content.js # Shoppers Stop data extraction
├── icons/                  # Extension icons (you need to add these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md               # This file
```

## Future Enhancements

Potential features for future versions:

- Support for more e-commerce sites
- Price tracking and alerts
- Export items to spreadsheet
- Remove items directly from extension
- Compare prices across sites
- Dark mode

## Contributing

Feel free to fork this project and submit pull requests for:

- Bug fixes
- New site support
- UI improvements
- Feature enhancements

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have suggestions:

1. Check the troubleshooting section above
2. Review the browser console for errors
3. Ensure you're using the latest version of Chrome/Edge

---

**Note**: This extension is not affiliated with or endorsed by Ajio, Flipkart, Amazon, or any other e-commerce platform.
