// Variables to store the current popup, selection, and translation
let currentPopup = null;
let currentSelection = null;
let currentTranslation = '';
let isTranslatingPage = false;

// Settings variables
let settings = {
  targetLanguage: 'fr',
  autoTranslate: true
};

// Load settings from storage
chrome.storage.sync.get(['targetLanguage', 'autoTranslate'], (result) => {
  settings = { ...settings, ...result };
});

// Function to create and show the translation popup
function createTranslationPopup(translation, isLoading = false) {
  console.log('Creating translation popup with text:', translation);
  const popup = document.createElement('div');
  popup.style.position = 'fixed';
  popup.style.padding = '10px';
  popup.style.background = 'white';
  popup.style.border = '1px solid #ccc';
  popup.style.borderRadius = '4px';
  popup.style.zIndex = '10000';
  popup.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  popup.style.whiteSpace = 'pre-wrap';
  popup.style.wordWrap = 'break-word';
  popup.style.overflow = 'hidden';
  
  if (isLoading) {
    const spinner = document.createElement('div');
    spinner.style.display = 'inline-block';
    spinner.style.width = '20px';
    spinner.style.height = '20px';
    spinner.style.border = '3px solid #f3f3f3';
    spinner.style.borderTop = '3px solid #3498db';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    popup.appendChild(spinner);
    popup.appendChild(document.createTextNode(' Traduction en cours...'));

    if (!document.querySelector('#spinner-animation')) {
      const style = document.createElement('style');
      style.id = 'spinner-animation';
      style.textContent = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  } else {
    popup.textContent = translation;
  }

  document.body.appendChild(popup);
  return popup;
}

// Function to position the popup always under the last selected phrase and match width
function positionPopup(popup) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    return;
  }
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  let top = rect.bottom + window.scrollY + 5;
  let left = rect.left + window.scrollX;

  popup.style.width = `${rect.width}px`;

  const popupHeight = popup.offsetHeight;
  if ((top + popupHeight) > (window.scrollY + window.innerHeight)) {
    top = (rect.bottom + window.scrollY) - popupHeight - 5;
  }

  if ((left + popup.offsetWidth) > (window.scrollX + window.innerWidth)) {
    left = (window.scrollX + window.innerWidth) - popup.offsetWidth - 10;
  }

  popup.style.position = 'absolute';
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;
}

// Function to translate text using Google Translate API
async function translateText(text) {
  console.log('Attempting to translate text:', text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${settings.targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    console.log('Sending translation request to:', url);
    const response = await fetch(url);
    const data = await response.json();
    console.log('Translation response:', JSON.stringify(data, null, 2));
    
    return data[0].map(segment => segment[0]).join(' ');
  } catch (error) {
    console.error('Translation error:', error);
    return 'Erreur : Impossible de traduire';
  }
}

// Listen for text selection
document.addEventListener('mouseup', async function(event) {
  console.log('Mouse up event detected');
  const selectedText = window.getSelection().toString().trim();
  console.log('Selected text:', selectedText);
  
  if (!settings.autoTranslate) {
    return;
  }

  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
    currentSelection = null;
    currentTranslation = '';
  }

  if (selectedText) {
    console.log('Starting translation process');
    currentSelection = selectedText;
    currentPopup = createTranslationPopup('', true);
    positionPopup(currentPopup);

    currentTranslation = await translateText(selectedText);
    console.log('Received translation:', currentTranslation);

    if (currentPopup) {
      currentPopup.remove();
    }
    currentPopup = createTranslationPopup(currentTranslation);
    positionPopup(currentPopup);
  }
});

// Update popup position on scroll
document.addEventListener('scroll', function() {
  if (currentPopup && currentSelection) {
    positionPopup(currentPopup);
  }
}, { passive: true });

// Remove popup when clicking outside
document.addEventListener('mousedown', function(event) {
  if (currentPopup && !currentPopup.contains(event.target)) {
    console.log('Removing popup on outside click');
    currentPopup.remove();
    currentPopup = null;
    currentSelection = null;
    currentTranslation = '';
  }
});

// Function to get all text nodes in the document
function getTextNodes(node) {
  const textNodes = [];
  const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, null, false);
  let currentNode;
  while (currentNode = walk.nextNode()) {
    if (currentNode.parentElement.tagName !== 'SCRIPT' && 
        currentNode.parentElement.tagName !== 'STYLE' &&
        currentNode.textContent.trim() !== '') {
      textNodes.push(currentNode);
    }
  }
  return textNodes;
}

// Function to translate the entire page
async function translatePage() {
  if (isTranslatingPage) return;
  isTranslatingPage = true;

  const textNodes = getTextNodes(document.body);
  const batchSize = 10;
  const originalTexts = new Map();

  for (let i = 0; i < textNodes.length; i += batchSize) {
    const batch = textNodes.slice(i, i + batchSize);
    const texts = batch.map(node => node.textContent.trim());
    const translationPromises = texts.map(text => translateText(text));

    try {
      const translations = await Promise.all(translationPromises);
      batch.forEach((node, index) => {
        if (!originalTexts.has(node)) {
          originalTexts.set(node, node.textContent);
        }
        node.textContent = translations[index];
      });
    } catch (error) {
      console.error('Error translating batch:', error);
    }

    // Add a small delay between batches to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  isTranslatingPage = false;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translatePage') {
    translatePage();
  } else if (request.action === 'updateSettings') {
    settings = { ...settings, ...request.settings };
    console.log('Settings updated:', settings);
  }
});