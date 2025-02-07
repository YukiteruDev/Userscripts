// ==UserScript==
// @name        YouTube UI Edits
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/*
// @grant       none
// @version     0.10
// @author      -
// @description 2025/1/18 20:16:58
// ==/UserScript==

function printLog(message) {
  console.log(`[YouTube UI Edits]: ${message}`);
}

function getVideoId() {
  const url = new URL(window.location.href);
  const videoId = url.searchParams.get("v");
  return videoId;
}

function isLivestream() {
  const liveBadge = document.querySelector(".ytp-live");
  return liveBadge !== null;
}

function isWideMode() {
  const page = document.querySelector("ytd-watch-flexy");
  const isTwoColumns = page.hasAttribute("is-two-columns_");
  return isTwoColumns;
}

function getOffsetHeight(offset = 0) {
  const topHeight = document.querySelector("#masthead-container").offsetHeight;
  const playerHeight = document.querySelector("#player").offsetHeight;
  const height = playerHeight + topHeight;
  return height + offset;
}

function disableBelowScroll() {
  const below = document.querySelector("#below");
  if (below) below.style.overflow = "hidden";
}

function enableBelowScroll() {
  const below = document.querySelector("#below");
  if (below) below.style.overflow = "hidden auto";
}

function resetBelowPosition() {
  const below = document.querySelector("#below");
  if (below) below.scrollTo(0, "instant");
}

function setPrimaryStyles(primary) {
  primary.style.margin = 0;
  primary.style.padding = 0;

  const below = document.querySelector("#below");
  if (below) {
    const offset = getOffsetHeight();
    below.style.padding = "0 10px";
    below.style.height = `calc(100vh - ${offset}px)`;
    below.style.scrollbarWidth = "none";
    enableBelowScroll();
  }
  document.body.style.overflow = "hidden";
  setBelowStyles();

  setContainerSize();
  if (isLivestream()) {
    printLog("is livestream");
    observeChatFrame();
  }
}

function setContainerSize() {
  const videoContainer = document.querySelector(".html5-video-container");
  videoContainer.style.height = "inherit";
  videoContainer.style.width = "inherit";

  const ytdPlayer = document.querySelector("#ytd-player");
  ytdPlayer.style.borderRadius = 0;
}

function observeChatFrame() {
  printLog("observing chat frame");
  const observer = new MutationObserver(() => {
    const chat = document.querySelector("ytd-live-chat-frame");
    const chatFrame = document.querySelector("iframe#chatframe");
    if (!chat || !chatFrame) return;

    setChatStyles(chat);
    observeChatCollapsed(chat);
    observeChatWindow();
    observer.disconnect();
    disableBelowScroll();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function observeChatWindow() {
  printLog("observing chat window");
  const observer = new MutationObserver(() => {
    printLog("chat frame detected");

    const chatFrame = document.querySelector("iframe#chatframe");
    const chatWindow = chatFrame.contentWindow.document.querySelector("#chat-messages");
    if (!chatWindow) return;
    printLog("chat window detected");

    observer.disconnect();

    const videoId = getVideoId();
    const checked = chatWindow.classList.contains("checked");
    const sameVideo = chatWindow.classList.contains(videoId);

    if (checked && !sameVideo) {
      printLog("chat frame outdated");
      // fix view count disappears after redirection
      setTimeout(() => observeChatWindow(), 500);
      return;
    } else {
      chatWindow.classList.add("checked");
      chatWindow.classList.add(videoId);
    }

    duplicateViewCount(chatWindow);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function duplicateViewCount(chatWindow) {
  if (chatWindow.classList.contains("view-count")) return;

  const originalCount = document.querySelector("#view-count");

  const duplicateCount = document.createElement("span");
  duplicateCount.id = "view-count-duplicate";
  duplicateCount.className = "style-scope yt-live-chat-header-renderer";

  const chatHeader = chatWindow.querySelector("#primary-content");
  chatHeader.after(duplicateCount);

  function updateDuplicateText() {
    const ariaLabel = originalCount.getAttribute("aria-label");
    duplicateCount.textContent = ariaLabel.trim();

    const dateText = document.querySelector("#info-container > #info");
    duplicateCount.setAttribute("title", dateText?.textContent);
  }

  updateDuplicateText();

  chatWindow.classList.add("view-count");

  const observer = new MutationObserver(updateDuplicateText);
  observer.observe(originalCount, {
    attributes: true,
    attributeFilter: ["aria-label"],
  });
}

function undoChatStyles(chat) {
  chat.style.cssText = `
    height: unset;
    position: relative;
    z-index: unset;
  `;
}

function setChatStyles(chat) {
  resetBelowPosition();

  const offset = getOffsetHeight();
  chat.style.cssText = `
    height: calc(100vh - ${offset}px);
    margin: 0;
    border-radius: 0;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  `;
}

function observeChatCollapsed(chat) {
  const observer = new MutationObserver(mutations => {
    if (!isLivestream()) {
      printLog("Not a livestream");
      observer.disconnect();
      return;
    }

    mutations.forEach(mutation => {
      if (mutation.type !== "attributes" || mutation.attributeName !== "collapsed") {
        return;
      }

      if (chat.hasAttribute("collapsed")) {
        printLog("chat closed");
        undoChatStyles(chat);
        enableBelowScroll();
      } else {
        printLog("chat opened");
        setChatStyles(chat);
        observeChatWindow();
        disableBelowScroll();
      }
    });
  });

  observer.observe(chat, {
    attributes: true,
    attributeFilter: ["collapsed"],
  });

  printLog("Chat `collapsed` observer attached.");
}

function observeVideoElement() {
  const videoContainer = document.querySelector(".html5-video-container");
  if (videoContainer) {
    const video = videoContainer.querySelector("video");
    if (video) {
      setVideoSize(video);

      const observer = new MutationObserver(() => {
        setVideoSize(video);
        observer.disconnect();
      });

      observer.observe(video, {
        attributes: true,
        attributeFilter: ["style"], // Only monitor the `style` attribute
      });

      printLog("Video observer attached.");
    }
  }
}

function setVideoSize(video) {
  // printLog(`Is wide mode: ${isWideMode()}`);
  if (!video) return;
  video.style.setProperty("height", "inherit", "important");
  video.style.setProperty("width", "inherit", "important");
  printLog("Video size updated.");
}

function findPrimaryContainer() {
  const observer = new MutationObserver(() => {
    const primary = document.querySelector("#columns #primary");
    if (primary) {
      setPrimaryStyles(primary);
      observeVideoElement();
      observeBodyStyles();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function observeBodyStyles() {
  const observer = new MutationObserver(mutationsList => {
    if (!getVideoId()) return;
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "style") {
        // fix scrollbars showing up after redirection
        document.body.style.overflow = "hidden";
      }
    }
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
  });
}

function setBelowStyles() {
  const chatMenu = document.querySelector("#teaser-carousel");
  chatMenu.style.display = "none";

  const contents = document.querySelector(
    "ytd-watch-metadata > ytd-metadata-row-container-renderer"
  );
  if (contents) contents.style.display = "none";

  observeComments();
  observeVideoDescription();
}

function observeComments() {
  const comments = document.querySelector("#comments");
  if (!comments) return printLog("No comments section element");
  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "hidden") {
        const isHidden = comments.hasAttribute("hidden");
        if (isHidden) return;

        printLog("comments detected");
        observer.disconnect();

        observeCommentsTitle();
      }
    }
  });
  observer.observe(comments, { attributes: true, attributeFilter: ["hidden"] });
}

let commentsTitle;

function observeCommentsTitle() {
  const below = document.querySelector("#below");
  const observer = new MutationObserver(() => {
    const titleElement = below.querySelector("#title-container h2#title");
    if (!titleElement) return;

    observer.disconnect();
    commentsTitle = titleElement.getAttribute("aria-label");
    createToggleButton();
  });
  observer.observe(below, { childList: true, subtree: true });
}

let initialOffset = 0;

function toggleRelated(toggleButton) {
  const isRelated = toggleButton.getAttribute("is-related");
  const comments = document.querySelector("#comments");
  const related = document.querySelector("#related");
  if (isRelated === "true") {
    related.style.display = "none";
    comments.style.display = "block";
    toggleButton.setAttribute("is-related", "false");
    toggleButton.textContent = "Show Related";
  } else {
    comments.style.display = "none";
    related.style.display = "block";
    toggleButton.setAttribute("is-related", "true");
    toggleButton.textContent = commentsTitle;
  }
  const below = document.querySelector("#below");
  below.scrollTo({ top: initialOffset, behavior: "smooth" });
}

function createToggleButton() {
  if (document.querySelector("#toggle-comments")) {
    printLog("Toggle button already created");
    return;
  }

  const comments = document.querySelector("#comments");
  comments.style.display = "none";

  const toggleContainer = document.createElement("div");
  toggleContainer.id = "toggle-comments";
  toggleContainer.style.cssText = `
    padding-top: 1rem;
    width: 100%;
    position: sticky;
    top: 0;
    z-index: 999;
    margin-bottom: 1rem;
  `;

  const toggleButton = document.createElement("button");
  toggleButton.id = "toggle-comments-button";
  toggleButton.classList =
    "yt-spec-button-shape-next yt-spec-button-shape-next--outline yt-spec-button-shape-next--mono yt-spec-button-shape-next--size-m";
  toggleButton.style.cssText = `
    width: 100%;
    backdrop-filter: blur(15px);
  `;
  toggleButton.textContent = commentsTitle;
  toggleButton.setAttribute("is-related", "true");
  toggleButton.addEventListener("click", () => toggleRelated(toggleButton));

  toggleContainer.appendChild(toggleButton);
  const related = document.querySelector("#related");
  related.before(toggleContainer);
  initialOffset = toggleContainer.offsetTop;
}

function setDescriptionStyles(restoring = false) {
  const description = document.querySelector("ytd-watch-metadata #description");
  const descriptionInner = description.querySelector("#description-inner");
  const descriptionHeader = description.querySelector("#description-header");

  if (restoring) {
    description.style.cssText = "";
    descriptionInner.style.cssText = "";
    if (descriptionHeader) descriptionHeader.style.display = "none";
    return;
  }

  resetBelowPosition();

  description.style.cssText = `
    position: absolute;
    background: var(--yt-spec-base-background);
    margin: 0;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
  `;

  let headerOffset;

  if (descriptionHeader) {
    printLog("description header already exist");
    descriptionHeader.style.display = "flex";
    headerOffset = descriptionHeader.offsetHeight;
    const collapseButton = description.querySelector("tp-yt-paper-button#collapse");
    descriptionHeader.appendChild(collapseButton);
  } else {
    const newDescriptionHeader = createDescriptionHeader();
    description.prepend(newDescriptionHeader);
    if (!headerOffset) headerOffset = newDescriptionHeader.offsetHeight;
  }

  const offset = getOffsetHeight(headerOffset);
  descriptionInner.style.cssText = `
    max-height: calc(100vh - ${offset}px);
    overflow-y: auto;
    margin: 0;
    padding: 1rem;
  `;
}

function createDescriptionHeader() {
  const descriptionHeader = document.createElement("div");
  descriptionHeader.id = "description-header";
  descriptionHeader.style.cssText = `
    height: 4rem;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 1rem;
    border-bottom: 1px solid var(--ytd-searchbox-border-color);
  `;

  const titleText = document.querySelector(".ytp-fullerscreen-edu-text").textContent;
  const descriptionTitle = document.createElement("span");
  descriptionTitle.textContent = titleText;
  descriptionTitle.classList = "style-scope ytd-video-description-infocards-section-renderer";
  descriptionTitle.style.fontSize = "1.6rem";
  descriptionHeader.appendChild(descriptionTitle);

  const collapseButton = document.querySelector("#description #collapse");
  collapseButton.style.margin = 0;
  collapseButton.style.minWidth = "unset";
  descriptionHeader.appendChild(collapseButton);
  return descriptionHeader;
}

function observeVideoDescription() {
  const metadata = document.querySelector("ytd-watch-metadata");
  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "description-collapsed") {
        const isCollapsed = metadata.hasAttribute("description-collapsed");
        if (isCollapsed) {
          printLog("description closed");
          setDescriptionStyles(true);
          enableBelowScroll();
        } else {
          printLog("description opened");
          setDescriptionStyles();
          disableBelowScroll();
        }
      }
    }
  });
  observer.observe(metadata, {
    attributes: true,
    attributeFilter: ["description-collapsed"],
  });
}

let hasNavigated = false;
let hasPlayerUpdated = false;

function checkBoth() {
  if (hasNavigated && hasPlayerUpdated) {
    printLog("Both events triggered on this redirection");
    const videoId = getVideoId();

    if (!videoId) return printLog("Not a video");

    printLog(`Is wide mode: ${isWideMode()}`);

    findPrimaryContainer();
  }
}

window.navigation.addEventListener("navigate", () => {
  hasNavigated = false;
  hasPlayerUpdated = false;
  printLog("Navigation started: flags reset");

  enableBelowScroll();
  const toggleButton = document.querySelector("#toggle-comments");
  if (toggleButton) {
    toggleButton.remove();
    const related = document.querySelector("#related");
    related.style.display = "block";
  }
});

document.addEventListener("yt-navigate-finish", () => {
  printLog("Navigation finished");

  if (!getVideoId) {
    document.body.style.overflow = "auto";
    return;
  }

  hasNavigated = true;
  checkBoth();
});

document.addEventListener("yt-player-updated", () => {
  printLog("Player updated");

  if (!getVideoId) return;

  hasPlayerUpdated = true;
  checkBoth();
});

window.addEventListener("resize", () => {
  printLog("Window resized.");
  // setVideoSize();
});
