// ==UserScript==
// @name        YouTube UI Edits
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/watch*
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

function getOffsetHeight(offset = 0) {
  const topHeight = document.querySelector("#masthead-container").offsetHeight;
  const playerHeight = document.querySelector("#player").offsetHeight;
  const height = playerHeight + topHeight;
  return height + offset;
}

function disableBelowScroll() {
  const below = document.querySelector("#below");
  below.style.overflow = "hidden";
}
function enableBelowScroll() {
  const below = document.querySelector("#below");
  below.style.overflow = "hidden scroll";
}

function setPrimaryStyles(primary) {
  primary.style.margin = 0;
  primary.style.padding = 0;

  const below = document.querySelector("#below");
  if (below) {
    const offset = getOffsetHeight();
    below.style.maxHeight = `calc(100vh - ${offset}px)`;
    below.style.scrollbarWidth = "none";
    enableBelowScroll();
  }
  document.body.style.overflow = "hidden";
  setBelowStyles();

  setContainerSize();
  if (isLivestream()) {
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
  const observer = new MutationObserver(() => {
    const chat = document.querySelector("ytd-live-chat-frame");
    const chatFrame = document.querySelector("iframe#chatframe");
    if (!chat || !chatFrame) return;

    setChatSize(chat);
    observeChatCollapsed(chat);
    observeChatWindow();
    observer.disconnect();
    disableBelowScroll();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function observeChatWindow() {
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
      // fix view count gone after redirection
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
  }

  updateDuplicateText();

  chatWindow.classList.add("view-count");

  const observer = new MutationObserver(updateDuplicateText);

  observer.observe(originalCount, {
    attributes: true,
    attributeFilter: ["aria-label"],
  });
}

function setChatSize(chat) {
  const offset = getOffsetHeight();

  chat.style.height = `calc(100vh - ${offset}px)`;
  chat.style.margin = 0;
  chat.style.borderRadius = 0;
}

function observeChatCollapsed(chat) {
  const observer = new MutationObserver(() => {
    if (chat.hasAttribute("collapsed")) {
      printLog("chat closed");
      chat.style.height = "unset";
      enableBelowScroll();
    } else {
      printLog("chat opened");
      const offset = getOffsetHeight();
      chat.style.height = `calc(100vh - ${offset}px)`;
      observeChatWindow();
      disableBelowScroll();
    }
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
        setVideoSize(video); // Reapply custom styles when the `style` attribute changes
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
  if (!video) return;
  video.style.setProperty("height", "inherit", "important");
  video.style.setProperty("width", "inherit", "important");
  printLog("Video size updated.");
}

function findPrimaryContainer() {
  const observer = new MutationObserver(() => {
    const primary = document.querySelector("#primary");
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

function createDescriptionContainer() {
  const container = document.createElement("div");
  container.id = "description-container";
  // container.style.display = "none";
  const closeButton = document.createElement("button");
  closeButton.textContent = "x";
  container.appendChild(closeButton);

  closeButton.addEventListener("click", () => {
    container.display = "none";
  });
}

function setBelowStyles() {
  const chatMenu = document.querySelector("#teaser-carousel");
  chatMenu.style.display = "none";

  const contents = document.querySelector(
    "ytd-watch-metadata > ytd-metadata-row-container-renderer"
  );
  contents.style.display = "none";

  observeVideoDescription();
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

  description.style.cssText = `
    width: 100%;
    position: absolute;
    background: var(--yt-spec-base-background);
    margin: 0;
    top: 0;
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
    overflow-y: scroll;
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

document.addEventListener("yt-player-updated", () => {
  printLog("player updated");
  findPrimaryContainer();
});

window.addEventListener("resize", () => {
  printLog("Window resized.");
  setVideoSize();
});
