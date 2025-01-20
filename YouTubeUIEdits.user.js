// ==UserScript==
// @name        YouTube UI Edits
// @namespace   Violentmonkey Scripts
// @match       https://www.youtube.com/watch*
// @grant       none
// @version     1.01
// @author      -
// @description 2025/1/18 20:16:58
// ==/UserScript==

function printLog(message) {
  console.log(`[YouTube UI Edits]: ${message}`);
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
    below.style.overflowY = "scroll";
    below.style.overflowX = "hidden";
    below.style.scrollbarWidth = "none";
  }
  document.body.style.overflow = "hidden";

  setContainerSize();
  if (isLivestream()) {
    observeChatContainer();
  }
}

function setContainerSize() {
  const videoContainer = document.querySelector(".html5-video-container");
  videoContainer.style.height = "inherit";
  videoContainer.style.width = "inherit";

  const ytdPlayer = document.querySelector("#ytd-player");
  ytdPlayer.style.borderRadius = 0;
}

function observeChatContainer() {
  const observer = new MutationObserver(() => {
    const chat = document.querySelector("ytd-live-chat-frame");
    if (chat) {
      setChatSize(chat);
      observeChatCollapsed(chat);
      observeChatWindow();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function observeChatWindow() {
  const observer = new MutationObserver(() => {
    const chatFrame = document.querySelector("iframe#chatframe");
    if (!chatFrame) return;
    printLog("chat frame detected");

    const chatWindow = chatFrame.contentWindow.document.querySelector("#chat-messages");
    if (!chatWindow) return;
    printLog("chat window detected");

    observer.disconnect();

    duplicateViewCount(chatWindow);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function duplicateViewCount(chatWindow) {
  const originalCount = document.querySelector("#view-count");

  const duplicateCount = document.createElement("span");
  duplicateCount.id = "view-count-duplicate";
  duplicateCount.className = "style-scope yt-live-chat-header-renderer";

  const chatHeader = chatWindow.querySelector("#primary-content");
  chatHeader.after(duplicateCount);

  function updateDuplicateText() {
    const ariaLabel = originalCount.getAttribute("aria-label");
    if (ariaLabel) {
      duplicateCount.textContent = ariaLabel.trim();
    }
  }

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
    }
  });

  observer.observe(chat, {
    attributes: true, // Observe attribute changes
    attributeFilter: ["collapsed"], // Only listen for `collapsed` changes
  });

  console.log("[YouTube UI Edits]: Chat `collapsed` observer attached.");
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
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

document.addEventListener("yt-navigate-finish", () => {
  printLog("yt-navigate-finish event detected.");
  findPrimaryContainer();
});

window.addEventListener("resize", () => {
  printLog("Window resized.");
  setVideoSize();
});
