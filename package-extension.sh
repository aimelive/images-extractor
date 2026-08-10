#!/bin/bash

# Script to package the Chrome extension for Chrome Web Store submission
# This creates a clean ZIP file excluding unnecessary files

echo "📦 Packaging Images Extractor extension for Chrome Web Store..."

# Remove old package if it exists
if [ -f "images-extractor.zip" ]; then
    rm images-extractor.zip
    echo "✅ Removed old package"
fi

# Create ZIP file excluding unnecessary files
zip -r images-extractor.zip . \
    -x "*.git*" \
    -x "*node_modules*" \
    -x "*.DS_Store" \
    -x "*package-extension.sh" \
    -x "*.zip" \
    -x "*.claude*" \
    -x "index.html" \
    -x "404.html" \
    -x "assets/*" \
    -x "privacy/*" \
    -x "compare/*" \
    -x "CNAME" \
    -x "favicon.ico" \
    -x "robots.txt" \
    -x "sitemap.xml" \
    -x "update-seo-dates.sh" \
    -x "*.md"

echo "✅ Package created: images-extractor.zip"
echo ""
echo "📋 Files included:"
unzip -l images-extractor.zip | grep -E "\.(json|html|js|css|png)$" | head -20
echo ""
echo "🚀 Ready to upload to Chrome Web Store!"
echo "   Go to: https://chrome.google.com/webstore/devconsole"

