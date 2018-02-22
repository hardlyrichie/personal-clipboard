'use strict';

// Initial settings for clipboard upon extension install
chrome.runtime.onInstalled.addListener(function() {
  // TODO Update initial contents
  // NOTE: chrome.storeage stores only serializable objects. DOM objects are not serializable. Therefore, a new object must be created that holds the clipboard item properties
  let clipboard = {
    page1: [new Item("Δ"), new Item("π"), new Item("θ")]
  };
  chrome.storage.sync.set({"clipboard": clipboard}, function() {
    console.log("Clipboard Initialized");
  })
});

function getClipboard(callback) {
  chrome.storage.sync.get("clipboard", callback);
}

function sendClipboardToPopup() {
  getClipboard(function(storedObject) {
    // Send message to popup and tell it to display the clipboard
    chrome.runtime.sendMessage({
      msg: "Sending clipboard",
      data: storedObject
    });

    console.log("Clipboard Loaded");
  })
}

function updateClipboard(clipboard) {
  chrome.storage.sync.set({"clipboard": clipboard}, function() {
    console.log("Clipboard Updated");
  })
}

// Creates object that holds the clipboard item's value and shortcut keys
function Item(value, shortcut) {
  this.value = value;
  this.shortcut = shortcut;
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.msg) {
      case "Load clipboard":
        sendClipboardToPopup();
        break;
      case "Store item":
        //Store new item to page array and update storage
        let item = request.data;
        getClipboard(function(storedObject) {
          let clipboard = storedObject.clipboard;
          clipboard.page1.push(item);
          updateClipboard(clipboard);

          console.log("Stored (Current Array): " + clipboard.page1);
        });
        break;
      default:
        throw new Error("Unknown message recieved");
    }
  }
);
