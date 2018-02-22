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
    document.body.append(itemElement);

    // Add item to clipboard object and update in chrome storage
    // TODO update page dynamically
    addItem(item);

    // Clear input
    form.reset();

    return false;
  }


});

function loadClipboard() {
  chrome.runtime.sendMessage({ msg: "Load clipboard" });

  console.log("Clipboard loaded");
}

function createItemElement(item) {
  let itemElement = document.createElement("div");
  itemElement.classList.add("col");
  itemElement.innerHTML = item.value;
  itemElement.onclick = (event) => copy(item.value);
  return itemElement;
}

function addItem(item) {
  chrome.runtime.sendMessage({
    msg: "Add item",
    data: item
  });

  console.log("Item added");
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

    for (let item of clipboard.page1) {
      let itemElement = createItemElement(item);
      document.body.append(itemElement);
    }
  }
);

// document.querySelector("button[name='copy']").addEventListener("click", () => copy("Testing"));
// document.querySelector("button[name='paste']").addEventListener("click", paste);
