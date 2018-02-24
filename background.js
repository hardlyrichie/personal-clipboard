'use strict';

// Initial settings for clipboard upon extension install
chrome.runtime.onInstalled.addListener(function() {
  /*
    NOTE: chrome.storeage stores only serializable objects. DOM objects are not serializable.
    Therefore, a new object must be created that holds the clipboard item properties
  */
  let pre = document.createElement("pre");
  pre.innerHTML =
  `──────▄▀▄─────▄▀▄
─────▄█░░▀▀▀▀▀░░█▄
─▄▄──█░░░░░░░░░░░█──▄▄
█▄▄█─█░░▀░░┬░░▀░░█─█▄▄█`;

  let clipboard = [
    [new Item("π"), new Item("supercalifragilisticexpialidocious"), new Item("😀") , new Item(pre.innerHTML)]
  ];

  chrome.storage.local.set({"clipboard": clipboard}, function() {
    console.log("Clipboard Initialized");
  })
});

function getClipboard(callback) {
  chrome.storage.local.get("clipboard", callback);
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
  chrome.storage.local.set({"clipboard": clipboard}, function() {
    console.log("Clipboard Updated");
  })
}

function newPage(clipboard) {
  let arr = [];
  clipboard.push(arr);
  updateClipboard(clipboard);

  console.log("Added new page");

  sendClipboardToPopup(clipboard, clipboard.length - 1);
}

// Creates object that holds the clipboard item's value
function Item(value) {
  this.value = value;
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
          clipboard[pageNum].push(item);
          updateClipboard(clipboard);

          console.log("Stored");
        });
        break;
      case "New page":
        getClipboard(function(storedObject) {
          newPage(storedObject.clipboard);
        });
        break;
      case "Delete item":
        getClipboard(function(storedObject) {
          let clipboard = storedObject.clipboard;
          let pageNum = request.page;
          clipboard[pageNum].splice(request.item, 1);
          updateClipboard(clipboard);

          console.log("Removed Item");
        });
        break;
      case "Delete page":
        getClipboard(function(storedObject) {
          let clipboard = storedObject.clipboard;
          let pageNum = request.page;
          clipboard.splice(pageNum, 1);
          updateClipboard(clipboard);
          console.log(storedObject);
        });

        console.log("Page deleted");
        break;
      default:
        throw new Error("Unknown message recieved");
    }
  }
);
