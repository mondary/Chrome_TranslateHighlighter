// Default settings
const DEFAULT_SETTINGS = {
  targetLanguage: 'fr',
  autoTranslate: true
};

// Initialize settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['targetLanguage', 'autoTranslate'], (result) => {
    if (!result.targetLanguage || !result.autoTranslate) {
      chrome.storage.sync.set(DEFAULT_SETTINGS);
    }
  });

  // Create context menu items
  chrome.contextMenus.create({
    id: 'languageMenu',
    title: '🌐 Target Language',
    contexts: ['action']
  });

  const languages = [
    { code: 'fr', name: '🇫🇷 French' },
    { code: 'en', name: '🇬🇧 English' },
    { code: 'es', name: '🇪🇸 Spanish' },
    { code: 'de', name: '🇩🇪 German' },
    { code: 'it', name: '🇮🇹 Italian' }
  ];

  languages.forEach(lang => {
    chrome.contextMenus.create({
      id: `lang_${lang.code}`,
      parentId: 'languageMenu',
      title: lang.name,
      type: 'radio',
      contexts: ['action']
    });
  });

  chrome.contextMenus.create({
    id: 'autoTranslate',
    title: '🔄 Auto-translate on selection',
    type: 'checkbox',
    contexts: ['action']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith('lang_')) {
    const language = info.menuItemId.replace('lang_', '');
    chrome.storage.sync.set({ targetLanguage: language });
    // Notify content script of language change
    chrome.tabs.sendMessage(tab.id, { 
      action: 'updateSettings', 
      settings: { targetLanguage: language }
    });
  } else if (info.menuItemId === 'autoTranslate') {
    chrome.storage.sync.set({ autoTranslate: info.checked });
    // Notify content script of auto-translate setting change
    chrome.tabs.sendMessage(tab.id, { 
      action: 'updateSettings', 
      settings: { autoTranslate: info.checked }
    });
  }
});

// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send message to content script to trigger page translation
  chrome.tabs.sendMessage(tab.id, { action: 'translatePage' });
});