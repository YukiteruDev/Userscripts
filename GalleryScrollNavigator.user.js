// ==UserScript==
// @name         Gallery Scroll Navigator
// @namespace    https://github.com/YukiteruDev
// @version      1.28
// @description  Automatically navigate to the next page when scrolling to the bottom of image gallery websites. Optimized for Hitomi and Pixiv.
// @author       Yukiteru
// @match        https://hitomi.la/*
// @match        https://f95zone.to/*
// @match        https://www.pixiv.net/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @grant        GM_config
// @require      https://greasyfork.org/scripts/470224-tampermonkey-config/code/Tampermonkey%20Config.js
// @license      MIT
// ==/UserScript==

(function() {
  'use strict';

  function printLog(message) {
    console.log(`[Scroll Pager]: ${message}`);
  }

  // Initialize the configuration
  const config_desc = {
    scrolls: {
      name: "Number of Scrolls to Next Page",
      processor: "int_range-1-10",
      value: 4, // Default value
    }
  };
  const config = new GM_config(config_desc);

  let scrollCounter = 0;
  let progressBar;

  // Function to create the progress bar element
  function createProgressBar() {
    const bar = document.createElement('div');
    bar.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background-color: red;
      z-index: 9999;
      transform-origin: center;
      transform: scaleX(0);
      transition: transform 0.3s ease;
    `;
    document.body.appendChild(bar);
    return bar;
  }


  const siteDict = {
    hitomi: {
      host: 'hitomi.la',
      selector: '.page-container li:not(:has(a)) + li a'
    },
    pixiv: {
      host: 'www.pixiv.net',
      selector: 'nav:has(button) > a:last-child'
    },
    f95zone: {
      host: 'f95zone.to',
      selector: '.pageNav-jump--next'
    }
  };

  function getCurrentSite() {
    // Determine the current site based on host
    return Object.values(siteDict).find(site => location.host === site.host);
  }

  function getCurrentPosition() {
    return window.innerHeight + window.scrollY;
  }

  function loadNextPage() {
    printLog('Loading next page...');

    const site = getCurrentSite();
    const pageButton = document.querySelector(site.selector);
    pageButton.click();
  }

  function checkIsScrollingDown(event) {
    if (event.wheelDelta) {
      return event.wheelDelta < 0;
    }
    return event.deltaY > 0;
  }

  // Update the progress bar based on the current scroll count
  function updateProgressBar(progress) {
    const maxScrolls = config.get('scrolls'); // Number of scrolls to next page
    const scale = Math.min(progress / maxScrolls, 1); // Calculate scale based on scrolls
    progressBar.style.transform = `scaleX(${scale})`; // Apply scaling
  }

  // Initialize the progress bar when the page loads
  progressBar = createProgressBar();

  function resetScrollProgress() {
    scrollCounter = 0; // Reset counter when scrolling
    updateProgressBar(0); // Reset progress bar when scrolling starts
  }

  function checkIsBottom() {
    return (window.innerHeight + window.scrollY).toFixed() >= document.body.offsetHeight;
  }

  function setWheelEvent() {
    document.addEventListener("wheel", event => {
      const isBottom = checkIsBottom();
      const isScrollingDown = checkIsScrollingDown(event);

      if (!isBottom || !isScrollingDown) return resetScrollProgress();

      scrollCounter++;
      updateProgressBar(scrollCounter);
      printLog(scrollCounter);

      const maxScrolls = config.get('scrolls'); // Number of scrolls to next page
      if (scrollCounter >= maxScrolls) {
        loadNextPage();
        resetScrollProgress();
      }
    });
  }

  function checkPagination() {
    const site = getCurrentSite();
    if (!site) return;

    const pager = document.querySelector(site.selector);
    printLog(pager)
    if (!pager) return;

    printLog('Pager detected');
    observer.disconnect();
    setWheelEvent();
  }

  const observer = new MutationObserver(() => checkPagination());
  observer.observe(document.body, { childList: true, subtree: true });
})();
