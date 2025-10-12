"use strict";
/**
 * Background service worker for LLM Shortcuts extension
 * Handles extension lifecycle, side panel management, and offscreen document
 */
const OFFSCREEN_DOCUMENT_PATH = 'offscreen.html';
/**
 * Create offscreen document for AI API access
 */
async function createOffscreenDocument() {
    // Check if offscreen document already exists
    const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH);
    const matchedClients = await self.clients.matchAll();
    for (const client of matchedClients) {
        if (client.url === offscreenUrl) {
            console.log('Offscreen document already exists');
            return;
        }
    }
    // Create offscreen document
    await chrome.offscreen.createDocument({
        url: OFFSCREEN_DOCUMENT_PATH,
        reasons: ['DOM_SCRAPING'],
        justification: 'Access Chrome AI API (window.ai) which is only available in document contexts'
    });
    console.log('Offscreen document created');
}
/**
 * Ensure offscreen document exists and forward message to it
 */
async function sendToOffscreen(message) {
    // Ensure offscreen document exists
    await createOffscreenDocument();
    // Send message to offscreen document
    return chrome.runtime.sendMessage(message);
}
// Extension installation and startup
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('LLM Shortcuts extension installed:', details.reason);
    // Set up side panel for all tabs
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    // Create offscreen document for AI access
    try {
        await createOffscreenDocument();
    }
    catch (error) {
        console.error('Failed to create offscreen document:', error);
    }
});
// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    // Open side panel when extension icon is clicked
    if (tab.id) {
        chrome.sidePanel.open({ tabId: tab.id });
    }
});
// Handle messages from side panel and route to offscreen document
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Background] Received message:', message.type);
    // Route AI-related messages to offscreen document
    const aiMessageTypes = ['CHECK_AI_AVAILABILITY', 'EXECUTE_PROMPT', 'EXECUTE_PROMPT_STREAMING'];
    if (aiMessageTypes.includes(message.type)) {
        console.log('[Background] Routing to offscreen document:', message.type);
        sendToOffscreen(message)
            .then(response => {
            console.log('[Background] Offscreen response:', response);
            sendResponse(response);
        })
            .catch(error => {
            console.error('[Background] Offscreen error:', error);
            sendResponse({
                success: false,
                available: false,
                error: error.message || 'Failed to communicate with offscreen document'
            });
        });
        return true; // Keep message channel open for async response
    }
    // Handle other message types
    switch (message.type) {
        default:
            console.log('[Background] Unknown message type:', message.type);
            sendResponse({ error: 'Unknown message type' });
    }
    return false;
});
// Handle extension startup
chrome.runtime.onStartup.addListener(async () => {
    console.log('LLM Shortcuts extension started');
    // Create offscreen document
    try {
        await createOffscreenDocument();
    }
    catch (error) {
        console.error('Failed to create offscreen document on startup:', error);
    }
});
// Handle extension suspend/resume
chrome.runtime.onSuspend.addListener(() => {
    console.log('LLM Shortcuts extension suspended');
});
//# sourceMappingURL=background.js.map