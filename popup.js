'use strict';

let clipboard;

document.addEventListener("DOMContentLoaded", function() {
  let backgroundPage = chrome.extension.getBackgroundPage();

  loadClipboard();

  let form = document.querySelector("form");
  form.onsubmit = function() {
    // Get input from form
    let value = form.querySelector("textarea");
    let shortcut = form.querySelector("input[name=shortcut]");

    // Create new clickable item on clipboard
    let item = new backgroundPage.Item(value.value, shortcut.value);
    let itemElement = createItemElement(item);
    let canAdd = addItemElementsToDocument([itemElement]);

    if (canAdd) {
      // Add item to clipboard object and update in chrome storage
      let nav = document.querySelector(".page-nav");
      let pageNum = Array.from(nav.children).indexOf(document.querySelector(".current-page")) + 1;
      storeItem(item, pageNum);
    }

    // Clear input
    form.reset();

    return false;
  }

  // Event delegation
  let page = document.querySelector(".page");
  page.onclick = function(event) {
    let target = event.target.closest("button");

    if (!target) return;

    if (!page.contains(target)) return;

    copy(target.innerHTML);
  };

  // Dynamic sizing when active items are hovered over
  page.onmouseover = function(event) {
    let target = event.target;

    if (!target.className.includes("active")) return;

    // Check if overflow
    if (!(target.scrollHeight > target.clientHeight || target.scrollWidth > target.clientWidth)) return;

    let coords = target.getBoundingClientRect();

    target.style.position = "absolute";
    target.style.zIndex = "100";

    // TODO if not enough space expand right instead of left
    // Move target to original position in document flow
    target.style.top = coords.top - 10 + "px"; // Account for offset by margin and padding of containing block
    target.style.left = coords.left - 20 + "px"

    // Add buffer to move other elements back into normal flow
    let sibling = target.nextElementSibling;
    if (sibling) {
      sibling.style.marginLeft = "80px";
    }

    // Reposition text from center to topleft
    target.style.justifyContent = "start";
    target.style.alignItems = "start";

    target.style.transition = ".7s";

    // Resize item to contain text
    target.style.height = `${target.scrollHeight + 4}px`;
    target.style.width = `${target.scrollWidth + 20}px`;

  };

  page.onmouseout = function(event) {
    let target = event.target;

    let sibling = target.nextElementSibling;
    if (sibling) {
      sibling.style = "";
    }

    target.style = "";
  };

  // New page button
  let newPage = document.querySelector("#new-page");
  newPage.onclick = function(event) {
    clearClipboard();
    chrome.runtime.sendMessage({msg: "New page"});
  };

  // Page nav
  let nav = document.querySelector(".page-nav");
  nav.onclick = function(event) {
    let target = event.target;

    if (target.tagName != "SPAN") return;

    let pageNum = Array.from(nav.children).indexOf(target) + 1;
    clearClipboard();
    getPage(pageNum);
  }
});

function loadClipboard() {
  getPage(1);

  console.log("Clipboard loaded");
}

function getPage(pageNum) {
  chrome.runtime.sendMessage({
    msg: "Get page",
    page: pageNum
  });

  console.log("Got Page: " + pageNum);
}

// Creates DOM object given item's characteristics
function createItemElement(item) {
  let itemElement = document.createElement("button");
  itemElement.classList.add("col", "active");
  itemElement.innerHTML = item.value;
  return itemElement;
}

function addItemElementsToDocument(itemElements) {
  // Cannot add to page if full
  if (document.querySelectorAll(".active").length >= 41) return false;

  // Replace the cols after the last active item with itemElements
  let columns = document.querySelectorAll(".col");
  let count = 0;
  for (let col of columns) {
    if (!(count < itemElements.length)) return true;

    // Checks if col already is active, is button, then skip
    if (col.tagName === "BUTTON") continue;

    col.replaceWith(itemElements[count]);
    count++;
  }
}

function storeItem(item, pageNum) {
  chrome.runtime.sendMessage({
    msg: "Store item",
    data: item,
    page: pageNum
  });

  console.log("Item stored");
}

function addPageMarkers(pages) {
  let nav = document.querySelector(".page-nav");

  let numOfMarkers = (pages - nav.children.length);
  for (let i = 0; i < numOfMarkers; i++) {
    let marker = document.createElement("span");
    marker.classList.add("circle");
    nav.appendChild(marker);
  }
}

function clearClipboard() {
  let actives = document.body.querySelectorAll(".active");
  for (let active of actives) {
    let emptyItem = document.createElement("div");
    emptyItem.classList.add("col");
    active.replaceWith(emptyItem);
  }
}

function addCurrentPageMarker(pageNum) {
  // Remove the current-page from previous page marker
  let marker = document.querySelector(".current-page");
  if (marker) {
    marker.classList.remove("current-page");
  }

  // Add current-page to the current marker
  let nav = document.querySelector(".page-nav");
  Array.from(nav.children)[pageNum - 1].classList.add("current-page");
}

function copy(text) {
  // Workaround to copy to clipboard without selection
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);

  console.log("Copied: " + text);
}

// Display the clipboard on popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg !== "Sending clipboard") return;

    clipboard = request.data[`page${request.currentPage}`];

    let itemElements = [];
    for (let item of clipboard) {
      itemElements.push(createItemElement(item));
    }
    addItemElementsToDocument(itemElements);

    addPageMarkers(request.data.pages);
    addCurrentPageMarker(request.currentPage);
  }
);

// document.querySelector("button[name='copy']").addEventListener("click", () => copy("Testing"));
// document.querySelector("button[name='paste']").addEventListener("click", paste);
