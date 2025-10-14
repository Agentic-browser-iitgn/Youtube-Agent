// Popup script for YouTube Agent extension
document.addEventListener('DOMContentLoaded', async () => {
  const apiKeyInput = document.getElementById('apiKey');
  const apiStatus = document.getElementById('apiStatus');
  const openYoutubeButton = document.getElementById('openYoutube');
  
  // Load saved API key
  const result = await chrome.storage.local.get(['geminiApiKey']);
  if (result.geminiApiKey) {
    apiKeyInput.value = result.geminiApiKey;
    updateApiStatus('success', '✅ API key saved');
  }
  
  // Save API key on input
  apiKeyInput.addEventListener('input', async (e) => {
    const apiKey = e.target.value.trim();
    
    if (apiKey) {
      await chrome.storage.local.set({ geminiApiKey: apiKey });
      updateApiStatus('success', '✅ API key saved');
    } else {
      await chrome.storage.local.remove(['geminiApiKey']);
      updateApiStatus('', 'Enter your API key to get started');
    }
  });
  
  // Open YouTube button
  openYoutubeButton.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://www.youtube.com' });
    window.close();
  });
  
  function updateApiStatus(className, message) {
    apiStatus.className = `status ${className}`;
    apiStatus.textContent = message;
  }
  
  // Check if we're on YouTube and show appropriate message
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.url && tab.url.includes('youtube.com')) {
      openYoutubeButton.textContent = 'Look for Agent Button';
      openYoutubeButton.addEventListener('click', () => {
        window.close();
      });
    }
  } catch (error) {
    console.log('Could not check current tab');
  }
});