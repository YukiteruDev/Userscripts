// ==UserScript==
// @name         Yuki Portal Downloader
// @namespace    http://tampermonkey.net/
// @version      1.4
// @description  Download images from Yuki Portal with advanced configurations, logging, and delays.
// @author       You
// @match        https://yuki-portal.com/uploader/honeyselect2/screenshots/*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_addValueChangeListener
// @grant        GM_download
// @require      https://greasyfork.org/scripts/470224-tampermonkey-config/code/Tampermonkey%20Config.js
// ==/UserScript==

(function () {
  "use strict";

  let config;

  /**
   * Print standardized logs to the console.
   * @param {string} message - Message to log.
   */
  function printLog(message) {
    console.log(`[Yuki Portal Downloader] ${message}`);
  }

  /**
   * Initialize the configuration settings.
   */
  function initConfig() {
    const configOptions = {
      skipFirstImage: {
        name: "Skip First Image",
        input: "current",
        processor: "not",
        formatter: "boolean",
        value: false,
      },
      downloadOriginal: {
        name: "Download Original Image",
        input: "current",
        processor: "not",
        formatter: "boolean",
        value: true,
      },
      downloadDelay: {
        name: "Download Delay (0.1s to 5s)",
        processor: "int_range-1-50", // Allows delay values between 0.1 to 5 seconds
        value: 5, // Default delay of 0.5 seconds
      },
    };
    config = new GM_config(configOptions);
  }

  /**
   * Initialize the script.
   */
  function init() {
    initConfig();
    observeFirstImage();
  }

  /**
   * Observes the first image and waits for a valid src if it is initially base64.
   */
  function observeFirstImage() {
    const firstImage = document.querySelector("figure.imgwrap img");
    if (!firstImage) return;

    const isBase64 = src => src.startsWith("data:image");
    const observer = new MutationObserver(() => {
      if (!isBase64(firstImage.src)) {
        observer.disconnect(); // Stop observing once a valid src is found
        printLog("First image updated with valid src.");
        createDownloadButton();
      }
    });

    if (isBase64(firstImage.src)) {
      printLog("First image src is base64. Waiting for update...");
      observer.observe(firstImage, { attributes: true, attributeFilter: ["src"] });
    }
  }

  /**
   * Processes all image URLs on the page and downloads them.
   */
  async function downloadImages() {
    const button = document.querySelector("#download-button");
    button.disabled = true;
    button.textContent = "Downloading...";
    button.style.cursor = "default";

    // Extract metadata
    const main = document.querySelector("main.site-main");
    const title = cleanText(main.querySelector("h1.entry-title").textContent);
    const author = cleanText(main.querySelector("span.author").textContent);
    const date = cleanText(main.querySelector("time.entry-date").textContent);

    // Gather image links
    const firstImage = document.querySelector("figure.imgwrap img");
    const gallery = document.querySelector("div.entry-content .gallery");
    const images = gallery ? gallery.querySelectorAll("figure.gallery-item a") : [];
    let imageLinks = [...images].map(a => a.href);

    // Handle first image based on config
    if (!config.get("skipFirstImage") && firstImage && !firstImage.src.startsWith("data:image")) {
      imageLinks.unshift(firstImage.src); // Add the first image if valid
    }

    // Process links based on config
    if (config.get("downloadOriginal")) {
      imageLinks = imageLinks.map(link =>
        link.includes("-scaled") ? link.replace("-scaled", "") : link
      );
    }

    const padLength = imageLinks.length.toString().length;

    // Download images
    const delay = config.get("downloadDelay") / 10; // Convert from tenths of a second to seconds
    printLog(
      `Starting download for ${imageLinks.length} images with ${delay}s delay between each.`
    );
    for (let index = 0; index < imageLinks.length; index++) {
      const link = imageLinks[index];
      const paddedIndex = String(index + 1).padStart(padLength, "0");
      const extension = getFileExtension(link);
      const filename = `[${author}] ${title} (${date})_${paddedIndex}.${extension}`
        .replace(/[/\\?%*:|"<>]/g, "") // Remove illegal characters
        .trim();

      printLog(`Downloading ${filename} from ${link}`);
      GM_download(link, filename);

      // Delay next download
      await delayBetweenDownloads(delay);
    }

    button.textContent = "Download Completed";
    printLog("Download process completed.");
  }

  /**
   * Delay function for spacing out downloads.
   * @param {number} seconds - Time to wait in seconds.
   * @returns {Promise<void>} A promise that resolves after the delay.
   */
  function delayBetweenDownloads(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
  }

  /**
   * Extracts the file extension from a URL.
   * @param {string} url - The URL to extract the extension from.
   * @returns {string} File extension.
   */
  function getFileExtension(url) {
    const parts = url.split(".");
    return parts[parts.length - 1].split("?")[0]; // Handle query strings
  }

  /**
   * Creates a floating download button.
   */
  function createDownloadButton() {
    const button = document.createElement("button");
    button.id = "download-button";
    button.textContent = "Download Images";
    button.style.cssText = `
            position: fixed;
            right: 10px;
            top: 12vh;
            z-index: 1000;
            background-color: #4CAF50;
            color: white;
            padding: 10px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        `;

    button.addEventListener("click", downloadImages);
    document.body.appendChild(button);
  }

  /**
   * Utility function to clean and trim text.
   * @param {string} text - The text to clean.
   * @returns {string} Cleaned text.
   */
  function cleanText(text) {
    return text.trim();
  }

  // Start the script
  init();
})();
