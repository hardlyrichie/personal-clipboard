'use strict';
function copy(text) {
  // Workaround to copy to clipboard without selection
  var textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function paste() {
  // Sends message to content script to attempt pasting to currently focused element
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {msg: "paste"});
  })
}

document.querySelector("button[name='copy']").addEventListener("click", () => copy("Testing"));
document.querySelector("button[name='paste']").addEventListener("click", paste);
