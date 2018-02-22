'use strict';

let clipboard;

document.addEventListener("DOMContentLoaded", function() {
  let backgroundPage = chrome.extension.getBackgroundPage();

  loadClipboard();

  let form = document.querySelector("form");
  form.onsubmit = function() {
    // Get input from form
    let value = form.querySelector("input[name=text]");
    let shortcut = form.querySelector("input[name=shortcut]");

    // Create new clickable item on clipboard
    let item = new backgroundPage.Item(value.value, shortcut.value);
    let itemElement = createItemElement(item);
    addItemElementsToDocument([itemElement]);

    // Add item to clipboard object and update in chrome storage
    // TODO if page is full, refuse to add
    let nav = document.querySelector(".page-nav");
    let pageNum = Array.from(nav.children).indexOf(document.querySelector(".current-page")) + 1;
    storeItem(item, pageNum);

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

  // New page button
  // TODO Have new page button only on the last page
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
  // Replace the cols after the last active item with itemElements
  let columns = document.body.querySelectorAll(".col");
  let count = 0;
  for (let col of columns) {
    if (!(count < itemElements.length)) return;

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
