// ==UserScript==
// @name        Soul Plus EndlessScroll Blocker
// @namespace   Violentmonkey Scripts
// @match       https://south-plus.net/thread.php*
// @match       https://south-plus.net/read.php*
// @grant       none
// @version     1.0
// @author      -
// @description This script is meant to be using alongside with the RinSP and EndlessScroll script
// ==/UserScript==

function getBlockList() {
  const item = localStorage.getItem("config");
  const config = JSON.parse(item);
  return config.blist;
}

function isDetailPage() {
  const url = window.location.href;
  return url.includes("read.php?tid-");
}

function getPostList() {
  const listSelector =
    "table#ajaxtable tr.tr3:not(.block-checked):not(.rinsp-thread-filter-dislike)";
  const detailSelector = "#main form table.js-post:not(.block-checked):not(.rinsp-filter-ignored)";
  const selector = isDetailPage() ? detailSelector : listSelector;
  const postList = document.querySelectorAll(selector);
  return postList;
}

function hideBlockedPosts() {
  const blockList = getBlockList();
  const postList = getPostList();
  let blockedCount = 0;
  postList.forEach(post => {
    post.classList.add("block-checked");
    const listSelector = "td:nth-of-type(3) a";
    const detailSelector = ".rinsp-userframe-username a";
    const selector = isDetailPage() ? detailSelector : listSelector;
    const author = post.querySelector(selector);
    const href = author?.getAttribute("href");
    if (!href) return;
    const uidMatch = href.match(/uid-(\d+)\.html/);
    const uid = uidMatch ? uidMatch[1] : null;
    if (blockList[uid]) {
      console.log(post);
      post.style.display = "none";
      blockedCount += 1;
    }
  });
  if (blockedCount) console.log(`${blockedCount} post(s) hidden.`);
}

function scrollHandler() {
  const postList = getPostList();
  const postCount = postList.length;
  if (!postCount) return;
  hideBlockedPosts();
}

document.addEventListener("scroll", scrollHandler);
