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

// Inline icons for the card action bar (16px, stroked with currentColor)
const ICONS = {
  link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07l-1.06 1.06"/><path d="M14 11a5 5 0 0 0-7.07 0l-2.12 2.12a5 5 0 0 0 7.07 7.07l1.06-1.06"/></svg>',
  picture:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M21 16.5l-4.6-4.6a1.6 1.6 0 0 0-2.3 0L4 20"/></svg>',
  download:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M4 18.5v.5A2 2 0 0 0 6 21h12a2 2 0 0 0 2-2v-.5"/></svg>',
  open: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-8.5 8.5"/><path d="M18 14.5V18a2.5 2.5 0 0 1-2.5 2.5H6A2.5 2.5 0 0 1 3.5 18V8.5A2.5 2.5 0 0 1 6 6h3.5"/></svg>',
};

// Build one icon-only action button (an <a> when it has an href)
function createActionButton({ icon, label, href, onClick }) {
  const el = document.createElement(href ? "a" : "button");
  el.className = "action-btn";
  el.innerHTML = icon;
  el.title = label;
  el.setAttribute("aria-label", label);

  if (href) {
    el.href = href;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.addEventListener("click", (e) => e.stopPropagation());
  } else {
    el.type = "button";
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick(el);
    });
  }

  return el;
}

// Run an async action while the button shows a busy state, ignoring re-clicks
async function withBusy(button, task) {
  if (button.classList.contains("is-busy")) return;
  button.classList.add("is-busy");
  button.disabled = true;
  try {
    await task();
  } finally {
    button.classList.remove("is-busy");
    button.disabled = false;
  }
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
    copyImageUrl(img.src, card);
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

  // Hover action bar: Copy URL + Copy image + Download + Open
  const actions = document.createElement("div");
  actions.className = "card-actions";

  [
    {
      icon: ICONS.link,
      label: "Copy image URL",
      onClick: () => copyImageUrl(img.src, card),
    },
    {
      icon: ICONS.picture,
      label: "Copy image to clipboard",
      onClick: (btn) => copyImageToClipboard(img.src, card, btn),
    },
    {
      icon: ICONS.download,
      label: "Download image",
      onClick: (btn) => downloadImage(img.src, card, btn),
    },
    {
      icon: ICONS.open,
      label: "Open image in a new tab",
      href: img.src,
    },
  ].forEach((def) => actions.appendChild(createActionButton(def)));

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
async function copyImageUrl(imageUrl, cardElement) {
  const previewContainer = cardElement.querySelector(
    ".image-preview-container"
  );

  try {
    // Show copying feedback
    const originalOpacity = previewContainer.style.opacity;
    previewContainer.style.opacity = "0.6";
    previewContainer.style.transition = "opacity 0.2s";

    // Copy URL to clipboard
    await navigator.clipboard.writeText(imageUrl);

    // Show success feedback
    showFeedback(cardElement, "✓ URL copied!");
    previewContainer.style.opacity = originalOpacity || "1";
  } catch (error) {
    console.error("Error copying image URL to clipboard:", error);
    showFeedback(cardElement, "✗ Failed to copy", "error");
    previewContainer.style.opacity = "1";
  }
}

// Copy the image itself (not its URL) to the clipboard
async function copyImageToClipboard(imageUrl, cardElement, button) {
  await withBusy(button, async () => {
    try {
      const dataUrl = await fetchImageAsDataUrl(imageUrl);
      const pngBlob = await toPngBlob(dataUrl);
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": pngBlob }),
      ]);
      showFeedback(cardElement, "✓ Image copied!");
    } catch (error) {
      console.error("Error copying image to clipboard:", error);
      showFeedback(cardElement, "✗ Can't copy this image", "error");
    }
  });
}

// Download the image via its URL
async function downloadImage(imageUrl, cardElement, button) {
  await withBusy(button, async () => {
    try {
      const filename = getDownloadFilename(imageUrl);
      await chrome.downloads.download({
        url: imageUrl,
        ...(filename ? { filename } : {}),
      });
      showFeedback(cardElement, "✓ Downloading…");
    } catch (error) {
      console.error("Error downloading image:", error);
      showFeedback(cardElement, "✗ Download failed", "error");
    }
  });
}

// Read an image's bytes as a data URL.
// The popup is tried first (works when the host sends CORS headers), then the
// page itself, which can always read images served from its own origin.
async function fetchImageAsDataUrl(imageUrl) {
  try {
    const response = await fetch(imageUrl, { credentials: "omit" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    if (!blob.size) throw new Error("Empty response");
    return await blobToDataUrl(blob);
  } catch (error) {
    return await fetchImageAsDataUrlFromPage(imageUrl);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Read failed"));
    reader.readAsDataURL(blob);
  });
}

// Ask the active tab to fetch the image for us, using the page's own origin
async function fetchImageAsDataUrlFromPage(imageUrl) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) throw new Error("No active tab found");

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [imageUrl],
    function: fetchImageAsDataUrlInPage,
  });

  const dataUrl = results[0]?.result;
  if (!dataUrl) throw new Error("Image is not readable from this page");
  return dataUrl;
}

// Runs in the page context; resolves to null when the request is blocked
function fetchImageAsDataUrlInPage(imageUrl) {
  return fetch(imageUrl, { credentials: "include" })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.blob();
    })
    .then(
      (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        })
    )
    .catch(() => null);
}

// The clipboard only accepts PNG, so re-encode whatever we fetched via a canvas
async function toPngBlob(dataUrl) {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  // SVGs without an intrinsic size report 0 - give them a sensible canvas
  const width = image.naturalWidth || 512;
  const height = image.naturalHeight || 512;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(image, 0, 0, width, height);

  return await new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      blob ? resolve(blob) : reject(new Error("PNG encoding failed"));
    }, "image/png");
  });
}

// Derive a safe download filename, or undefined to let Chrome pick one
function getDownloadFilename(imageUrl) {
  const imageExtension = /\.(png|jpe?g|gif|webp|avif|svg|bmp|ico|tiff?)$/i;

  try {
    const file = decodeURIComponent(
      new URL(imageUrl).pathname.split("/").filter(Boolean).pop() || ""
    );
    const safe = file.replace(/[\\/:*?"<>|]+/g, "-").trim().slice(-120);
    if (imageExtension.test(safe)) return safe;
  } catch (e) {
    // Fall through and let Chrome derive the name from the response
  }

  return undefined;
}

// Show feedback message over the card preview
function showFeedback(cardElement, message, variant = "success") {
  // Remove any existing feedback
  const existingFeedback = cardElement.querySelector(".copy-feedback");
  if (existingFeedback) {
    existingFeedback.remove();
  }

  const feedback = document.createElement("div");
  feedback.className = `copy-feedback ${variant}`;
  feedback.textContent = message;

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
