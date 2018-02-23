'use strict';

// Initial settings for clipboard upon extension install
chrome.runtime.onInstalled.addListener(function() {
  // TODO Update initial contents with better options
  /*
    NOTE: chrome.storeage stores only serializable objects. DOM objects are not serializable.
    Therefore, a new object must be created that holds the clipboard item properties
  */
  let clipboard = {
    pages: 1,
    page1: [new Item("Ω"), new Item("π"), new Item("Ω")]
  };
  chrome.storage.sync.set({"clipboard": clipboard}, function() {
    console.log("Clipboard Initialized");
  })
});

function getClipboard(callback) {
  chrome.storage.sync.get("clipboard", callback);
}

function sendClipboardToPopup(clipboard, pageNum) {
  // Send message to popup and tell it to display the clipboard
  chrome.runtime.sendMessage({
    msg: "Sending clipboard",
    data: clipboard,
    currentPage: pageNum
  });
}

function updateClipboard(clipboard) {
  chrome.storage.sync.set({"clipboard": clipboard}, function() {
    console.log("Clipboard Updated");
  })
}

function newPage(clipboard) {
  let pageNum = ++clipboard.pages;
  clipboard[`page${pageNum}`] = [];
  updateClipboard(clipboard);

  console.log("Added new page");

  sendClipboardToPopup(clipboard, pageNum);
}

// Creates object that holds the clipboard item's value and shortcut keys
function Item(value, shortcut) {
  this.value = value;
  this.shortcut = shortcut;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.msg) {
      case "Get page":
        getClipboard(function(storedObject) {
          sendClipboardToPopup(storedObject.clipboard, request.page);
        });
        break;
      case "Store item":
        //Store new item to page array and update storage
        let item = request.data;
        getClipboard(function(storedObject) {
          let clipboard = storedObject.clipboard;
          let pageNum = request.page;
          clipboard[`page${pageNum}`].push(item);
          updateClipboard(clipboard);

          console.log("Stored");
        });
        break;
      case "New page":
        getClipboard(function(storedObject) {
          newPage(storedObject.clipboard);
        });
        break;
      default:
        throw new Error("Unknown message recieved");
    }
  }
);
