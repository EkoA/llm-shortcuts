"use strict";
/**
 * Background service worker for LLM Shortcuts extension
 * Handles extension lifecycle and side panel management
 */
// Extension installation and startup
chrome.runtime.onInstalled.addListener((details) => {
    console.log('LLM Shortcuts extension installed:', details.reason);
    // Set up side panel for all tabs
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});
// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open side panel when extension icon is clicked
    if (tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
    }
});
// Note: onAvailabilityChanged is not available in current Chrome API
// Side panel availability is handled automatically by Chrome
// Handle messages from content scripts or side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('Background received message:', message);
    switch (message.type) {
        case 'CHECK_AI_AVAILABILITY':
            // Check if Chrome AI API is available
            if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
                window.ai.languageModel.availability()
                    .then(availability => {
                    sendResponse({ available: availability === 'available' });
                })
                    .catch(() => {
                    sendResponse({ available: false });
                });
            }
            else {
                sendResponse({ available: false });
            }
            break;
        default:
            console.log('Unknown message type:', message.type);
    }
    return true; // Keep message channel open for async response
});
// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('LLM Shortcuts extension started');
});
// Handle extension suspend/resume
chrome.runtime.onSuspend.addListener(() => {
    console.log('LLM Shortcuts extension suspended');
});
//# sourceMappingURL=background.js.map