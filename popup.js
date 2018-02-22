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
    // TODO update page dynamically
    storeItem(item);

    // Clear input
    form.reset();

    return false;
  }


});

function loadClipboard() {
  chrome.runtime.sendMessage({ msg: "Load clipboard" });

  console.log("Clipboard loaded");
}

// Creates DOM object given item's characteristics
function createItemElement(item) {
  let itemElement = document.createElement("div");
  itemElement.classList.add("col");
  itemElement.innerHTML = item.value;
  itemElement.onclick = (event) => copy(item.value);
  return itemElement;
}

function addItemElementsToDocument(itemElements) {
  // Replace the cols after the last active item with itemElements
  let columns = document.body.querySelectorAll(".col");
  let count = 0;
  for (let col of columns) {
    if (!(count < itemElements.length)) return;

    // Checks if col already is active, has content in it
    if (col.textContent.length !== 0) continue;

    col.replaceWith(itemElements[count]);
    count++;
  }
}

function storeItem(item) {
  chrome.runtime.sendMessage({
    msg: "Store item",
    data: item
  });

  console.log("Item stored");
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

function paste() {
  // Sends message to content script to attempt pasting to currently focused element
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {msg: "paste"});
  });

  console.log("Pasted");
}

// Display the clipboard on popup
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg !== "Sending clipboard") return;

    clipboard = request.data.clipboard;

    let itemElements = [];
    for (let item of clipboard.page1) {
      itemElements.push(createItemElement(item));
    }
    addItemElementsToDocument(itemElements);
  }
);

// document.querySelector("button[name='copy']").addEventListener("click", () => copy("Testing"));
// document.querySelector("button[name='paste']").addEventListener("click", paste);
