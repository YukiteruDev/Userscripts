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

function setPrimaryStyles(primary) {
  primary.style.margin = 0;
  primary.style.padding = 0;

  setContainerSize();
  if (isLivestream()) observeChatContainer();
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
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function setChatSize(chat) {
  const topHeight = document.querySelector("#masthead-container").offsetHeight;
  const playerHeight = document.querySelector("#player").offsetHeight;
  const offset = playerHeight + topHeight;

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
      const topHeight = document.querySelector("#masthead-container").offsetHeight;
      const playerHeight = document.querySelector("#player").offsetHeight;
      const offset = playerHeight + topHeight;
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
