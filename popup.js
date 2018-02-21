'use strict';
document.addEventListener("DOMContentLoaded", function() {
  let form = document.querySelector("form");
  form.onsubmit = function() {
    // Get input from form
    let value = form.querySelector("input[name=text]");
    let shortcut = form.querySelector("input[name=shortcut]");

    // Create new clickable item on clipboard
    let item = createItem(value.value, shortcut.value);
    document.body.append(item);

    // Clear input
    value.innerHTML = '';
    shortcut.innerHTML = '';

    return false;
  }
});

function createItem(value, shortcut) {
  let item = document.createElement("div");
  item.classList.add("col");
  item.innerHTML = value;
  item.onclick = (event) => copy(value);
  return item;

  //TODO bind shortcut to key input
}

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

// document.querySelector("button[name='copy']").addEventListener("click", () => copy("Testing"));
// document.querySelector("button[name='paste']").addEventListener("click", paste);
