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

function appendCommentSection() {
  const secondaryPanels = document.querySelector("#secondary #panels");
  const comments = document.querySelector("#comments");
  secondaryPanels.after(comments);
}

function isLivestream() {
  const liveBadge = document.querySelector(".ytp-live");
  return liveBadge !== null;
}

function adjustChat() {
  const observer = new MutationObserver((mutations, observer) => {
    const chat = document.querySelector("#chat-container #chat");
    if (!chat) return;

    printLog("chat detected");
    observer.disconnect();

    chat.style.margin = "100";
    const widePage = isWidePage();
    if (widePage) {
      printLog("is wide");
      chat.style.height = "calc(100vh - 56px) !important";
    } else {
      printLog("not wide");
      const playerHeight = document.querySelector("#player").offsetHeight;
      chat.style.height = `calc(100vh - ${playerHeight}) !important`;
    }
  });
  observer.observe(document, { childList: true, subtree: true });
}

function resizePlayer() {
  document.body.style.overflow = "hidden";
  if (isWidePage()) return printLog("resized to wide");

  const ytdPlayer = document.querySelector("#ytd-player");
  const player = document.querySelector("#player");
  const video = document.querySelector("video.html5-main-video");
  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;
  const aspectRatio = videoHeight / videoWidth;

  const viewportWidth = window.innerWidth;
  const newHeight = viewportWidth * aspectRatio;

  video.style.setProperty("width", `${viewportWidth}px`, "important");
  video.style.setProperty("height", `${newHeight}px`, "important");

  player.style.width = `${viewportWidth}px`;
  player.style.height = `${newHeight}px`;

  const bottom = document.querySelector("#ytp-chrome-bottom");
  bottom.style.width = "100%";

  ytdPlayer.style.borderRadius = "0";
}

function observePlayer() {
  const observer = new MutationObserver((mutations, observer) => {
    const player = document.querySelector("#player");
    const video = document.querySelector("video.html5-main-video");
    const videoWidth = video?.videoWidth;
    const videoHeight = video?.videoHeight;
    if (!player || !video || !videoWidth || !videoHeight) return;

    printLog("player detected");
    observer.disconnect();

    setTimeout(() => resizePlayer(), 300);
  });
  observer.observe(document, { childList: true, subtree: true });
}

function moveRelated() {
  document.body.style.overflow = "hidden";
  const columns = document.querySelector("#columns");
  columns.style.height = "calc(100vh - 56px)";
  columns.style.overflow = "hidden";
  const primary = columns.querySelector("#primary");
  primary.style.overflowY = "scroll";
  primary.style.scrollbarWidth = "none";
  primary.style.padding = "0";
  primary.style.margin = "0";
  const secondary = columns.querySelector("#secondary");
  secondary.style.padding = "0";

  const related = document.querySelector("#related");
  const below = document.querySelector("#primary-inner #below");
  below.appendChild(related);

  observePlayer();
  if (isLivestream()) adjustChat();
}

function isWidePage() {
  const page = document.querySelector("ytd-watch-flexy");
  const isTwoColumns = page.hasAttribute("is-two-columns_");
  return isTwoColumns;
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
  appendCommentSection();
}

function observeComments() {
  moveRelated();
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
window.addEventListener("resize", () => {
  setTimeout(() => resizePlayer(), 300);
});
