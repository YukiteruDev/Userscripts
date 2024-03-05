// ==UserScript==
// @name        Reddit Auto Dark Mode
// @namespace   Violentmonkey Scripts
// @match       https://www.reddit.com/*
// @grant       none
// @version     1.0
// @author      Yukiteru
// @description Change Reddit's theme based on your system theme
// @license     MIT
// ==/UserScript==

function getToggleSwitch() {
  return document.querySelector('faceplate-switch-input');
}

function isDarkMode() {
  return getToggleSwitch().getAttribute('aria-checked') === 'true';
}

function toggleTheme(isDark) {
  if (isDark !== isDarkMode()) getToggleSwitch().click(); // only toggles when the reddit theme and system theme does not match
}

const darkMedia = window.matchMedia('(prefers-color-scheme: dark)');
setTimeout(() => toggleTheme(darkMedia.matches), 300)

darkMedia.addEventListener('change', e => {
  toggleTheme(e.matches); // toggle theme when system theme is changed
});
