// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to trigger page translation
  chrome.tabs.sendMessage(tab.id, { action: 'translatePage' });
});