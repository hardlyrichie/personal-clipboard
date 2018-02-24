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
      storeItem(item, getPageNum());
    }

    // Clear input
    form.reset();

    return false;
  }

  // Event delegation for items
  let page = document.querySelector(".page");
  page.addEventListener("click", itemClick);

  // Page nav
  let nav = document.querySelector(".page-nav");
  nav.addEventListener("click", navClick);

  // New page button
  let newPage = document.querySelector("#new-page");
  newPage.onclick = function(event) {
    clearClipboard();
    chrome.runtime.sendMessage({msg: "New page"});
  };

  let delPage = document.querySelector(".del-page");
  delPage.onclick = function(event) {
    // Remove page marker
    let page = getPageNum();
    let canDelete = removePageMarker(page + 1);

    if (!canDelete) return;

    // Remove page from display
    clearClipboard();

    chrome.runtime.sendMessage({
      msg: "Delete page",
      page: page,
    }, function() {
      getPage(getPageNum());
      document.querySelector("#delete").click();
    });
  };

  // Delete BUTTON
  let delOn = false;
  let del = document.querySelector("#delete");
  let formSubmit = document.querySelector(".submit");
  del.onclick = function(event) {
    delOn = !delOn;

    let actives = document.querySelectorAll(".active");

    // Turn on delete state
    if (delOn) {
      for (let active of actives) {
        active.classList.add("del-item");
        active.removeEventListener("mouseenter", expand);
        active.removeEventListener("mouseleave", normalSize);
      }
      delPage.style.display = "block";

      page.removeEventListener("click", itemClick);
      page.addEventListener("click", deleteItem);

      nav.removeEventListener("click", navClick)

      formSubmit.style.opacity = ".5";
      formSubmit.classList.remove("submit");
      formSubmit.setAttribute("type", "button");

      del.style.backgroundColor = "#3e0000";
    } else {
      // Turn off delete state
      for (let active of actives) {
        active.classList.remove("del-item");
        active.addEventListener("mouseenter", expand);
        active.addEventListener("mouseleave", normalSize);
      }
      delPage.style.display = "";

      page.removeEventListener("click", deleteItem);
      page.addEventListener("click", itemClick);

      nav.addEventListener("click", navClick);

      formSubmit.style = "";
      formSubmit.classList.add("submit");
      formSubmit.setAttribute("type", "submit");

      del.style = "";

      // Refresh clipboard display
      clearClipboard();
      getPage(getPageNum());
    }
  };
});

function navClick(event) {
  let target = event.target;

  if (target.tagName != "SPAN") return;

  let nav = document.querySelector(".page-nav");

  let pageNum = Array.from(nav.children).indexOf(target);
  clearClipboard();
  getPage(pageNum);
}

function itemClick(event) {
  let page = document.querySelector(".page");
  let target = event.target.closest("button");

  if (!target || !page.contains(target)) return;

  copy(target.firstElementChild.innerHTML);

  let copyMessage = document.querySelector(".copy-message");
  copyMessage.style.visibility = "visible";
  copyMessage.style.backgroundColor = "rgba(0, 0, 0, .7)";
  setTimeout(() => copyMessage.style = "", 1000);
}

function deleteItem(event) {
  let page = document.querySelector(".page");
  let target = event.target.closest("button");

  if (!target || !page.contains(target)) return;

  let item = Array.from(document.querySelectorAll(".active")).indexOf(target);

  // Remove item from display
  let emptyItem = document.createElement("div");
  emptyItem.classList.add("col");
  target.replaceWith(emptyItem);

  chrome.runtime.sendMessage({
    msg: "Delete item",
    page: getPageNum(),
    item: item
  });
}

function loadClipboard() {
  getPage(0);

  console.log("Clipboard loaded");
}

function getPageNum() {
  let nav = document.querySelector(".page-nav");
  return Array.from(nav.children).indexOf(document.querySelector(".current-page"));
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

  let pre = document.createElement("pre");
  pre.innerHTML = item.value;

  // Apply too wide class if text is wider than button
  if (pre.innerHTML.indexOf("\n") > 5 || (pre.innerHTML.indexOf("\n") < 0 && pre.innerHTML.length > 5)) {
    itemElement.classList.add("too-wide");
  }

  itemElement.appendChild(pre);

  // Dynamic sizing when active items are hovered over
  itemElement.addEventListener("mouseenter", expand);
  itemElement.addEventListener("mouseleave", normalSize);

  return itemElement;
}

function addItemElementsToDocument(itemElements) {
  // Cannot add to page if full
  console.log(document.querySelectorAll(".active").length );
  if (document.querySelectorAll(".active").length >= 42) {console.log("cannot store"); return false;}

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
  return true;
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

  let numOfMarkers = pages - nav.children.length;
  for (let i = 0; i < numOfMarkers; i++) {
    let marker = document.createElement("span");
    marker.classList.add("circle");
    nav.appendChild(marker);
  }
}

function removePageMarker(pageNum) {
  let nav = document.querySelector(".page-nav");
  let pages = nav.children.length;

  if (pages <= 1) return false;

  // Remove all markers
  while (nav.firstChild) {
    nav.removeChild(nav.firstChild);
  }

  // Add back markers
  addPageMarkers(pages - 1);
  // Set currentpage marker to one before if possible
  addCurrentPageMarker((pageNum === 1) ? 1 : pageNum - 1);

  return true;
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

function expand(event) {
  let target = event.target;
  let pre = target.firstElementChild;
  if (!(pre.scrollHeight > target.clientHeight || pre.scrollWidth > target.clientWidth)) return;

  let coords = target.getBoundingClientRect();

  target.style.position = "absolute";
  target.style.zIndex = "1";
  target.style.display = "inline";
  target.style.textAlign = "left";
  target.style.transition = "width .7s, height .7s";

  // Move target to original position in document flow
  target.style.top = coords.top - 10 + "px"; // Account for offset by margin and padding of containing block
  target.style.left = coords.left - 20 + "px"

  // Add buffer to move other elements back into normal flow
  let sibling = target.nextElementSibling;
  if (sibling) {
    sibling.style.marginLeft = "80px";
  }

  // Resize item to contain text
  target.style.width = `${((pre.scrollWidth > target.offsetWidth) ? pre.scrollWidth : target.offsetWidth) + 4}px`;
  target.style.height = `${(pre.scrollHeight > target.offsetHeight) ? pre.scrollHeight + 4 : target.offsetHeight}px`;
}

function normalSize(event) {
  let target = event.target;

  let sibling = target.nextElementSibling;
  if (sibling) {
    sibling.style = "";
  }

  target.style = "";
}

// Display the clipboard on popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg !== "Sending clipboard") return;

    clipboard = request.data[request.currentPage];
    let itemElements = [];
    for (let item of clipboard) {
      itemElements.push(createItemElement(item));
    }
    addItemElementsToDocument(itemElements);

    addPageMarkers(request.data.length);
    addCurrentPageMarker(request.currentPage + 1);
  }
);
