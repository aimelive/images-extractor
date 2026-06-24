// Get all images from the current tab
async function extractImages() {
  const loadingEl = document.getElementById("loading");
  const errorEl = document.getElementById("error");
  const imagesListEl = document.getElementById("imagesList");
  const emptyStateEl = document.getElementById("emptyState");
  const imageCountEl = document.getElementById("imageCount");

  if (
    !loadingEl ||
    !errorEl ||
    !imagesListEl ||
    !emptyStateEl ||
    !imageCountEl
  ) {
    console.error("Required DOM elements not found");
    return;
  }

  // Show loading state
  loadingEl.style.display = "flex";
  errorEl.style.display = "none";
  emptyStateEl.style.display = "none";
  imagesListEl.innerHTML = "";

  // Safety timeout to ensure loading state is cleared
  const timeoutId = setTimeout(() => {
    console.warn("Extract images timeout - clearing loading state");
    loadingEl.style.display = "none";
    errorEl.style.display = "block";
    const errorText = errorEl.querySelector("p");
    if (errorText) {
      errorText.textContent = "Request timed out. Please try again.";
    }
  }, 10000); // 10 second timeout

  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!tab || !tab.url) {
      throw new Error("No active tab found");
    }

    // Check if the URL is a valid web page
    if (
      tab.url.startsWith("chrome://") ||
      tab.url.startsWith("chrome-extension://") ||
      tab.url.startsWith("edge://")
    ) {
      throw new Error("Cannot extract images from this page");
    }

    // Execute script to extract images from the page
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractImagesFromPage,
    });

    const images = results[0]?.result || [];

    // Hide loading state
    loadingEl.style.display = "none";

    if (images.length === 0) {
      emptyStateEl.style.display = "block";
      imageCountEl.textContent = "0 images";
      return;
    }

    // Update count
    imageCountEl.textContent = `${images.length} image${
      images.length !== 1 ? "s" : ""
    }`;

    // Display images
    images.forEach((img, index) => {
      const imageCard = createImageCard(img, index);
      imagesListEl.appendChild(imageCard);
    });

    // Clear timeout on success
    clearTimeout(timeoutId);
  } catch (error) {
    console.error("Error extracting images:", error);
    // Always hide loading state on error
    clearTimeout(timeoutId);
    if (loadingEl) loadingEl.style.display = "none";
    if (errorEl) errorEl.style.display = "block";
    if (imageCountEl) imageCountEl.textContent = "0 images";
  }
}

// Function to extract images from the page (runs in page context)
function extractImagesFromPage() {
  // Helper function to check if URL is a valid HTTP/HTTPS image link
  function isValidImageUrl(url) {
    if (!url) return false;

    // Skip data URIs (data:image/...)
    if (url.startsWith("data:")) return false;

    // Skip blob URIs (blob:http://... or blob:https://...)
    if (url.startsWith("blob:")) return false;

    // Only include HTTP and HTTPS URLs
    return url.startsWith("http://") || url.startsWith("https://");
  }

  const images = [];
  const processedUrls = new Set();

  // --- Collect the site's favicon(s) shown in the browser tab ---
  const favicons = [];

  function addFavicon(src) {
    if (processedUrls.has(src) || !isValidImageUrl(src)) return null;
    processedUrls.add(src);
    const entry = { src: src, alt: "Site icon", width: 0, height: 0, isFavicon: true };
    favicons.push(entry);
    return entry;
  }

  const iconLinks = document.querySelectorAll(
    'link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"], link[rel="mask-icon"], link[rel="fluid-icon"]'
  );

  iconLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    let src;
    try {
      src = new URL(href, window.location.href).href;
    } catch (e) {
      return;
    }

    const entry = addFavicon(src);
    if (!entry) return;

    // Parse a declared size such as sizes="32x32"
    const sizes = link.getAttribute("sizes");
    if (sizes) {
      const match = sizes.trim().split(/\s+/)[0].match(/^(\d+)x(\d+)$/i);
      if (match) {
        entry.width = parseInt(match[1], 10) || 0;
        entry.height = parseInt(match[2], 10) || 0;
      }
    }
  });

  // Fallback to /favicon.ico when no icon links are declared
  if (favicons.length === 0) {
    try {
      addFavicon(new URL("/favicon.ico", window.location.origin).href);
    } catch (e) {
      // Ignore invalid origins
    }
  }

  const imgElements = document.querySelectorAll("img");

  imgElements.forEach((img) => {
    let src =
      img.src ||
      img.getAttribute("srcset")?.split(",")[0]?.trim().split(" ")[0] ||
      img.getAttribute("data-src");

    if (src) {
      // Convert relative URLs to absolute
      try {
        src = new URL(src, window.location.href).href;
      } catch (e) {
        // If URL construction fails, skip this image
        return;
      }

      // Skip duplicates and non-HTTP/HTTPS URLs (data, blob, base64)
      if (processedUrls.has(src) || !isValidImageUrl(src)) {
        return;
      }

      processedUrls.add(src);

      images.push({
        src: src,
        alt: img.alt || "No description",
        width: img.naturalWidth || img.width || 0,
        height: img.naturalHeight || img.height || 0,
      });
    }
  });

  // Also check for background images in CSS
  const allElements = document.querySelectorAll("*");
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const bgImage = style.backgroundImage;

    if (bgImage && bgImage !== "none") {
      const urlMatch = bgImage.match(/url\(['"]?([^'"]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        let src = urlMatch[1];
        try {
          src = new URL(src, window.location.href).href;
          // Only include if it's a valid HTTP/HTTPS URL and not already processed
          if (!processedUrls.has(src) && isValidImageUrl(src)) {
            processedUrls.add(src);
            images.push({
              src: src,
              alt: "Background image",
              width: 0,
              height: 0,
            });
          }
        } catch (e) {
          // Skip invalid URLs
        }
      }
    }
  });

  // Site icons first, then page images
  return favicons.concat(images);
}

// Create image card element
function createImageCard(img, index) {
  const card = document.createElement("div");
  card.className = "image-card";

  // --- Preview ---
  const previewContainer = document.createElement("div");
  previewContainer.className =
    "image-preview-container" + (img.isFavicon ? " is-favicon" : "");

  if (img.isFavicon) {
    const badge = document.createElement("span");
    badge.className = "fav-badge";
    badge.textContent = "★ Site icon";
    previewContainer.appendChild(badge);
  }

  const imgElement = document.createElement("img");
  imgElement.src = img.src;
  imgElement.alt = img.alt;
  imgElement.className = "image-preview";
  imgElement.loading = "lazy";
  imgElement.title = "Click to copy image URL to clipboard";

  // Click thumbnail to copy URL
  imgElement.addEventListener("click", () => {
    copyImageToClipboard(img.src, card);
  });

  // Handle image load error
  imgElement.onerror = function () {
    this.style.display = "none";
    actions.style.display = "none";
    const errorDiv = document.createElement("div");
    errorDiv.className = "image-error";
    errorDiv.textContent = "Failed to load";
    previewContainer.appendChild(errorDiv);
  };

  // Hover action bar: Copy + Open
  const actions = document.createElement("div");
  actions.className = "card-actions";

  const copyBtn = document.createElement("button");
  copyBtn.type = "button";
  copyBtn.className = "action-btn";
  copyBtn.innerHTML = "⧉ Copy";
  copyBtn.title = "Copy image URL";
  copyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    copyImageToClipboard(img.src, card);
  });

  const openBtn = document.createElement("a");
  openBtn.className = "action-btn";
  openBtn.href = img.src;
  openBtn.target = "_blank";
  openBtn.rel = "noopener noreferrer";
  openBtn.innerHTML = "↗ Open";
  openBtn.title = "Open image in a new tab";
  openBtn.addEventListener("click", (e) => e.stopPropagation());

  actions.appendChild(copyBtn);
  actions.appendChild(openBtn);

  previewContainer.appendChild(imgElement);
  previewContainer.appendChild(actions);

  // --- Info ---
  const info = document.createElement("div");
  info.className = "image-info";

  const details = document.createElement("div");
  details.className = "image-details";
  details.innerHTML = `
    <span class="image-index">#${index + 1}</span>
    ${
      img.width > 0 && img.height > 0
        ? `<span class="image-dimensions">${img.width} × ${img.height}</span>`
        : ""
    }
  `;

  const link = document.createElement("a");
  link.href = img.src;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = "image-link";
  link.textContent = getImageLabel(img.src);
  link.title = img.src;

  info.appendChild(details);
  info.appendChild(link);

  card.appendChild(previewContainer);
  card.appendChild(info);

  return card;
}

// Derive a short, readable label (filename) from an image URL
function getImageLabel(url) {
  try {
    const { pathname, hostname } = new URL(url);
    const file = pathname.split("/").filter(Boolean).pop();
    if (file) return decodeURIComponent(file);
    return hostname;
  } catch (e) {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
}

// Copy image URL to clipboard
async function copyImageToClipboard(imageUrl, cardElement) {
  try {
    // Show copying feedback
    const previewContainer = cardElement.querySelector(
      ".image-preview-container"
    );
    const originalOpacity = previewContainer.style.opacity;
    previewContainer.style.opacity = "0.6";
    previewContainer.style.transition = "opacity 0.2s";

    // Copy URL to clipboard
    await navigator.clipboard.writeText(imageUrl);

    // Show success feedback
    showCopyFeedback(cardElement, true);
    previewContainer.style.opacity = originalOpacity || "1";
  } catch (error) {
    console.error("Error copying image URL to clipboard:", error);
    showCopyFeedback(cardElement, false);
    const previewContainer = cardElement.querySelector(
      ".image-preview-container"
    );
    previewContainer.style.opacity = "1";
  }
}

// Show copy feedback message
function showCopyFeedback(cardElement, success) {
  // Remove any existing feedback
  const existingFeedback = cardElement.querySelector(".copy-feedback");
  if (existingFeedback) {
    existingFeedback.remove();
  }

  const feedback = document.createElement("div");
  feedback.className = `copy-feedback ${success ? "success" : "error"}`;
  feedback.textContent = success ? "✓ URL copied!" : "✗ Failed to copy";

  const previewContainer = cardElement.querySelector(
    ".image-preview-container"
  );
  previewContainer.appendChild(feedback);

  // Remove feedback after 2 seconds
  setTimeout(() => {
    feedback.style.opacity = "0";
    feedback.style.transition = "opacity 0.3s";
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.remove();
      }
    }, 300);
  }, 2000);
}

// Initialize on popup open
document.addEventListener("DOMContentLoaded", () => {
  // Extract images
  extractImages();

  // Refresh button
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", extractImages);
  }
});
