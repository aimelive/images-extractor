# Images Extractor - Chrome Extension

A powerful Chrome extension that extracts and displays all images from any webpage in a beautiful, easy-to-use interface. Perfect for designers, developers, content creators, and anyone who needs to quickly access images from web pages.

## ✨ Features

- **🔍 Extract All Images** - Automatically finds all images on the current webpage
- **👁️ Visual Grid View** - Beautiful responsive grid layout with image previews
- **📋 Copy Image URLs** - Click any image to instantly copy its URL to clipboard
- **🖼️ Copy Image** - Copy the picture itself to the clipboard as a PNG, ready to paste anywhere
- **⬇️ Download Image** - Save any image to your Downloads folder in one click
- **📊 Image Details** - View image dimensions and other metadata
- **🔗 Direct Links** - Open images in new tabs with one click
- **🔄 Refresh Support** - Re-extract images anytime with the refresh button
- **🎨 Modern UI** - Clean, intuitive interface with smooth animations
- **⚡ Fast & Lightweight** - Quick extraction and minimal resource usage

**Website:** [images-extractor.netiiv.com](https://images-extractor.netiiv.com/)

## 📦 Installation

### Manual Installation (Developer Mode)

1. **Download the Extension**

   - Download the ZIP file: [images-extractor.zip](https://images-extractor.netiiv.com/images-extractor.zip)
   - Extract the ZIP file to a folder on your computer

2. **Open Chrome Extensions Page**

   - Open Chrome and navigate to `chrome://extensions/`
   - Or go to: **Menu (⋮) → Extensions → Manage Extensions**

3. **Enable Developer Mode**

   - Toggle the **"Developer mode"** switch in the top-right corner

4. **Load the Extension**

   - Click **"Load unpacked"** button
   - Select the folder where you extracted the extension files
   - The extension will be installed and appear in your extensions list

5. **Pin the Extension** (Optional but Recommended)
   - Click the **Extensions icon (puzzle piece)** in your toolbar
   - Find "Images Extractor" and click the **pin icon** 📌
   - This keeps the extension icon visible in your toolbar

## 🚀 How to Use

### Basic Usage

1. **Navigate to any webpage** that contains images
2. **Click the Images Extractor icon** in your Chrome toolbar
3. **View all images** displayed in a beautiful grid layout
4. **Click any image** to copy its URL to your clipboard
5. **Hover a card** to copy the URL, copy the image itself, download it, or open it in a new tab

### Step-by-Step Guide

#### Step 1: Open the Extension

- Click the **Images Extractor icon** (🖼️) in your Chrome toolbar
- The popup will open showing all images from the current page

#### Step 2: Browse Images

- Images are displayed in a **responsive grid layout**
- Each image shows:
  - **Preview thumbnail**
  - **Image number** (#1, #2, etc.)
  - **Dimensions** (width × height, if available)
  - **Image URL** (clickable link)

#### Step 3: Copy Image URL

- **Click on any image preview** to copy its URL to your clipboard
- You'll see a confirmation message: **"✓ URL copied!"**
- Paste the URL anywhere (browser, text editor, etc.)

#### Step 4: Use the Card Actions

Hover any card to reveal four icon actions:

| Icon | Action        | What it does                                                              |
| ---- | ------------- | ------------------------------------------------------------------------- |
| 🔗   | Copy URL      | Copies the image's URL to your clipboard                                  |
| 🖼️   | Copy image    | Copies the picture itself as a PNG, ready to paste into Figma, Slides, etc. |
| ⬇️   | Download      | Saves the image to your Downloads folder using its original filename       |
| ↗    | Open new tab  | Opens the full-size image in a new browser tab                            |

#### Step 5: Open Full Image

- Click the **image URL link** below any image
- The full-size image will open in a new browser tab

#### Step 6: Refresh Images

- Click the **"Refresh"** button to re-extract images from the page
- Useful if the page content has changed or images have loaded dynamically

## 🎯 Use Cases

### For Designers

- Quickly extract images from design inspiration websites
- Collect image URLs for mood boards
- Access high-resolution images from portfolios

### For Developers

- Debug image loading issues
- Extract image URLs for documentation
- Analyze image dimensions and formats

### For Content Creators

- Find and save images for blog posts
- Extract images from articles
- Collect visual assets for projects

### For Researchers

- Document images from research pages
- Extract image sources for citations
- Analyze visual content on websites

## 🔧 Technical Details

### Supported Image Types

- ✅ HTTP/HTTPS image URLs
- ✅ Images from `<img>` tags
- ✅ CSS background images
- ❌ Data URIs (base64 encoded images)
- ❌ Blob URLs

### Permissions

The extension requires minimal permissions:

- **`activeTab`** - To access the current tab's content
- **`scripting`** - To extract images from the page
- **`downloads`** - To save an image to your Downloads folder
- **`clipboardWrite`** - To copy a URL or an image to your clipboard

### Browser Compatibility

- ✅ Chrome (latest version)
- ✅ Edge (Chromium-based)
- ✅ Other Chromium-based browsers

## ❓ Frequently Asked Questions

### Q: Why don't I see all images from a page?

**A:** The extension only shows images with HTTP/HTTPS URLs. Data URIs, blob URLs, and base64-encoded images are excluded for better usability.

### Q: Can I download images directly?

**A:** Yes. Hover any image card and click the **download** icon - the image is saved straight to your Downloads folder using its original filename.

### Q: Can I copy the image itself instead of its URL?

**A:** Yes. The **copy image** action puts the actual picture on your clipboard as a PNG, so you can paste it directly into Figma, Slides, Word, or a chat app. A small number of images are locked down by their host and can't be read - for those you'll see a **"✗ Can't copy this image"** notice, and download or open in a new tab still works.

### Q: Does the extension work on all websites?

**A:** The extension works on most websites. Some pages with special security restrictions (like `chrome://` pages) cannot be accessed.

### Q: Is my data collected or stored?

**A:** No! The extension runs entirely locally in your browser. No data is collected, stored, or transmitted to any server.

### Q: Why is the extension not showing images?

**A:** Make sure you're on a regular webpage (not a Chrome internal page). Try clicking the refresh button, or reload the webpage first.

### Q: Can I use this extension offline?

**A:** The extension works offline for pages you've already loaded. However, you need an internet connection to load new web pages.

## 🐛 Troubleshooting

### Extension icon not showing

1. Go to `chrome://extensions/`
2. Make sure Images Extractor is **enabled**
3. Click the **Extensions icon (puzzle piece)** in the toolbar
4. Find Images Extractor and click the **pin icon** 📌

### No images found

- Make sure you're on a webpage (not a Chrome settings page)
- Some images might be loaded dynamically - try clicking **Refresh**
- Check if the page has loaded completely
- Some websites use special image loading techniques that may not be detected

### Images not copying to clipboard

- Make sure you've granted clipboard permissions (usually automatic)
- Try clicking the image again
- Check if your browser supports the Clipboard API

### Extension not working

1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Find Images Extractor
   - Click the **reload icon** (circular arrow)
2. **Check for errors:**
   - Right-click the extension popup
   - Select **"Inspect"**
   - Check the Console tab for errors
3. **Reinstall the extension** if issues persist

## 📝 Changelog

### Version 1.1.0

- **Copy Image** - copy the picture itself to the clipboard as a PNG
- **Download Image** - save an image to the Downloads folder in one click
- Card actions redesigned as four compact icon buttons with tooltips
- New `downloads` and `clipboardWrite` permissions to support the above
- Site moved to [images-extractor.netiiv.com](https://images-extractor.netiiv.com/)

### Version 1.0.0

- Initial release
- Extract images from web pages
- Grid view with image previews
- Copy image URLs to clipboard
- Open images in new tabs
- Refresh functionality

## 🤝 Contributing

Contributions are welcome! If you have ideas for improvements or find bugs, please:

1. Open an issue on GitHub
2. Submit a pull request with your changes
3. Follow the existing code style

## 📄 License

This project is open source and available for use.

## 🔗 Links

- **Website:** [images-extractor.netiiv.com](https://images-extractor.netiiv.com/)
- **Permissions compared:** [how this extension's site access compares to others](https://images-extractor.netiiv.com/compare/)
- **Privacy Policy:** [images-extractor.netiiv.com/privacy](https://images-extractor.netiiv.com/privacy/)
- **Download Extension:** [images-extractor.zip](https://images-extractor.netiiv.com/images-extractor.zip)
- **GitHub Repository:** [aimelive/images-extractor](https://github.com/aimelive/images-extractor)

## 💡 Tips & Tricks

1. **Keyboard Shortcut:** After opening the extension, you can use Tab and Enter keys to navigate
2. **Multiple Tabs:** The extension works independently in each browser tab
3. **Large Pages:** For pages with many images, scroll within the extension popup to see all images
4. **Image Dimensions:** Hover over images to see full URLs in tooltips
5. **Quick Access:** Pin the extension to your toolbar for one-click access

## ⭐ Support

If you find this extension useful, please consider:

- ⭐ Starring the repository on GitHub
- 🐛 Reporting bugs or suggesting features
- 💬 Sharing feedback and ideas

## 🙏 Acknowledgments

Built with ❤️ for the web community. Special thanks to all contributors and users who provide feedback.

---

**Made with ❤️ by [aimelive](https://github.com/aimelive)**

For questions, issues, or feature requests, please visit the [GitHub repository](https://github.com/aimelive/images-extractor).
