'use strict';
console.log("adsfas");

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.msg == "paste") {
      // Tries to paste to currently focused element in document
      try {
        document.execCommand("paste");
      } catch(err) {
        console.log("Error!");
      }
    }
  }
);