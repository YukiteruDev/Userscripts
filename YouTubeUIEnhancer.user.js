// ==UserScript==
// @name        YouTube UI Enhancer
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/watch*
// @grant       none
// @version     1.4
// @author      Yukiteru
// @description Adds a toggle button to show/hide the comments section on YouTube.
// ==/UserScript==

function printLog(message) {
  console.log(`[YouTube UI Enhancer]: ${message}`);
}

function createToggleButton() {
  const secondaryPanels = document.querySelector("#secondary #panels");
  const toggleButton = document.createElement("button");
  toggleButton.id = "show-comments";
  toggleButton.textContent = "查看评论";
  toggleButton.style.cssText = `
    display: block;
    margin: 10px 0;
    padding: 10px;
    width: 100%;
    color: var(--yt-spec-text-primary);
    background-color: transparent;
    padding: 10px 20px;
    border: 1px solid;
    border-color: var(--ytd-searchbox-border-color);
    border-radius: 50px;
    cursor: pointer;
    font-size: 14px;
  `;

  const commentsObserver = new MutationObserver(() => {
    const commentsContainer = document.querySelector("#comments-container");
    const comments = document.querySelector("#comments");
    const header = comments.querySelector("#header");
    const title = header.querySelector("#title");
    const box = header.querySelector("#simple-box");
    if (!header || !title || !box) return;

    commentsObserver.disconnect();

    const closeButton = createCloseButton();
    closeButton.addEventListener("click", () => {
      commentsContainer.style.display = "none";
      const toggleButton = document.querySelector("#show-comments");
      toggleButton.style.display = "block";
    });
    title.style.justifyContent = "space-between";
    title.style.padding = "10px";
    title.style.marginBottom = "0";
    title.style.borderBottom = "1px solid var(--ytd-searchbox-border-color)";
    title.appendChild(closeButton);

    const renderer = header.querySelector("ytd-comments-header-renderer");
    renderer.style.margin = "0";

    commentsContainer.style.display = "flex";
    commentsContainer.style.flexDirection = "column";
    commentsContainer.style.justifyContent = "space-between";
    commentsContainer.prepend(header);
    box.style.borderTop = "1px solid var(--ytd-searchbox-border-color)";
    box.style.padding = "5px";
    commentsContainer.append(box);
  });

  toggleButton.addEventListener("click", () => {
    toggleButton.style.display = "none";
    const playerHeight = document.querySelector("#player").offsetHeight;
    const commentsContainer = document.querySelector("#comments-container");
    commentsContainer.style.height = `${playerHeight}px`;
    commentsContainer.style.display = "block";

    commentsObserver.observe(comments, { childList: true, subtree: true });
  });

  secondaryPanels.after(toggleButton);
}

function appendCommentSection() {
  const secondaryPanels = document.querySelector("#secondary #panels");
  const comments = document.querySelector("#comments");
  const commentsContainer = document.createElement("div");
  commentsContainer.id = "comments-container";
  commentsContainer.style.cssText = `
    min-height: 500px;
    display: none;
    border: 1px solid;
    border-color: var(--ytd-searchbox-border-color);
    border-radius: 8px;
    overflow: hidden;
  `;

  const commentsInner = document.createElement("div");
  commentsInner.id = "comments-inner";
  commentsInner.style.cssText = `
    padding-top: 10px;
    padding-left: 5px;
    overflow-y: scroll;
    overflow-x: hidden;
    scrollbar-width: thin;
  `;

  commentsContainer.appendChild(commentsInner);
  commentsInner.appendChild(comments);
  secondaryPanels.after(commentsContainer);
}

function createCloseButton() {
  const closeButton = document.createElement("button");
  closeButton.style.cssText = `
    display: inline-block;
    width: 30px;
    height: 30px;
    padding: 0;
    cursor: pointer;
    background: unset;
    border: unset;
  `;

  const svgContainer = document.createElement("div");
  svgContainer.style.cssText = `
    width: 100%;
    height: 100%;
    display: block;
    fill: currentcolor;
    color: var(--yt-spec-text-secondary);
  `;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("enable-background", "new 0 0 24 24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", "24");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("aria-hidden", "true");
  svg.style.cssText = `
    pointer-events: none;
    display: inherit;
    width: 100%;
    height: 100%;
  `;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "m12.71 12 8.15 8.15-.71.71L12 12.71l-8.15 8.15-.71-.71L11.29 12 3.15 3.85l.71-.71L12 11.29l8.15-8.15.71.71L12.71 12z"
  );
  svg.appendChild(path);
  svgContainer.appendChild(svg);

  closeButton.appendChild(svgContainer);
  return closeButton;
}

const pageObserver = new MutationObserver(() => {
  const page = document.querySelector("ytd-watch-flexy");
  if (!page) return false;

  const isTwoColumns = page.hasAttribute("is-two-columns_");
  if (isTwoColumns) {
    //
  } else {
    //
  }
});

function moveComments() {
  const comments = document.querySelector("#show-comments");
  if (comments) return printLog("Comment section already exists");
  createToggleButton();
  appendCommentSection();
}

function hideComments() {
  const button = document.querySelector("#show-comments");
  if (button) button.style.display = "none";

  const container = document.querySelector("#comments-container");
  if (container) container.style.display = "none";
}

function observeComments() {
  const comments = document.querySelector("#comments");
  if (!comments) return printLog("Comments element not found");

  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      printLog(mutation.attributeName);

      if (mutation.type !== "attributes" || mutation.attributeName !== "hidden") continue;

      observer.disconnect();

      if (!comments.hasAttribute("hidden")) {
        printLog("has comments");
        moveComments();
      } else {
        printLog("no comments");
      }
    }
  });

  observer.observe(comments, { attributes: true });

  if (!comments.hasAttribute("hidden")) {
    printLog("has comments already");
  } else {
    printLog("waiting for comments");
  }
}

document.addEventListener("yt-navigate-finish", observeComments);
document.addEventListener("yt-navigate-start", hideComments);
