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

function getOffsetHeight() {
  const topHeight = document.querySelector("#masthead-container").offsetHeight;
  const playerHeight = document.querySelector("#player").offsetHeight;
  const offset = playerHeight + topHeight;
  return offset;
}

function setPrimaryStyles(primary) {
  primary.style.margin = 0;
  primary.style.padding = 0;

  const below = document.querySelector("#below");
  if (below) {
    const offset = getOffsetHeight();
    below.style.maxHeight = `calc(100vh - ${offset}px)`;
    // below.style.padding = "0 10px";
    below.style.overflowY = "scroll";
    below.style.overflowX = "hidden";
    below.style.scrollbarWidth = "none";
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
    } else {
      printLog("chat opened");
      const offset = getOffsetHeight();
      chat.style.height = `calc(100vh - ${offset}px)`;
      observeChatWindow();
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

function setDescriptionStyles(restore = false) {
  const description = document.querySelector("ytd-watch-metadata #description");
  if (restore) {
    description.style.cssText = "";
    return;
  }

  const offset = getOffsetHeight();
  description.style.cssText = `
    max-height: calc(100vh - ${offset}px);
    overflow: scroll;
    scrollbar-width: thin;
    position: absolute;
    background: var(--yt-spec-base-background);
    margin: 0;
    top: 0;
    z-index: 9999;
  `;
}

function observeVideoDescription() {
  const metadata = document.querySelector("ytd-watch-metadata");
  const observer = new MutationObserver(mutationsList => {
    for (const mutation of mutationsList) {
      if (mutation.type === "attributes" && mutation.attributeName === "description-collapsed") {
        const isCollapsed = metadata.hasAttribute("description-collapsed");
        if (isCollapsed) {
          printLog("is collapsed");
          setDescriptionStyles(true);
        } else {
          printLog("not collapsed");
          setDescriptionStyles();
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
