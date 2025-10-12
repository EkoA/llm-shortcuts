"use strict";
/**
 * Offscreen Document for LLM Shortcuts
 * This runs in a web context where window.ai is available
 * Handles all Chrome AI API interactions
 */
console.log('LLM Shortcuts offscreen document loaded');
// Cast window to access Chrome AI API
const aiWindow = window;
/**
 * Check if Chrome AI API is available
 */
async function checkAIAvailability() {
    try {
        console.log('[Offscreen] Checking AI availability...');
        console.log('[Offscreen] LanguageModel exists:', !!aiWindow.LanguageModel);
        if (!aiWindow.LanguageModel) {
            return {
                available: false,
                error: 'Chrome AI API (LanguageModel) not found in offscreen document'
            };
        }
        // Check AI availability using the correct method
        const availability = await aiWindow.LanguageModel.availability();
        console.log('[Offscreen] AI availability status:', availability);
        // Check if AI is available or downloadable
        const isAvailable = availability === 'available' || availability === 'downloadable';
        if (!isAvailable) {
            return {
                available: false,
                error: `AI model availability: ${availability}`
            };
        }
        return {
            available: true
        };
    }
    catch (error) {
        console.error('[Offscreen] Error checking AI availability:', error);
        return {
            available: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Execute a prompt using Chrome AI API
 */
async function executePrompt(prompt, options) {
    try {
        console.log('[Offscreen] Executing prompt...');
        if (!aiWindow.LanguageModel) {
            return {
                success: false,
                error: 'Chrome AI API not available'
            };
        }
        // Create AI session
        const session = await aiWindow.LanguageModel.create({
            temperature: options?.temperature ?? 0.7,
            topK: options?.topK ?? 40
        });
        console.log('[Offscreen] AI session created, executing prompt...');
        try {
            const response = await session.prompt(prompt);
            console.log('[Offscreen] Prompt execution successful');
            session.destroy();
            return {
                success: true,
                response
            };
        }
        catch (error) {
            session.destroy();
            throw error;
        }
    }
    catch (error) {
        console.error('[Offscreen] Error executing prompt:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Execute a prompt with streaming response
 */
async function executePromptStreaming(prompt, options) {
    try {
        console.log('[Offscreen] Executing streaming prompt...');
        if (!aiWindow.LanguageModel) {
            return {
                success: false,
                error: 'Chrome AI API not available'
            };
        }
        // Create AI session
        const session = await aiWindow.LanguageModel.create({
            temperature: options?.temperature ?? 0.7,
            topK: options?.topK ?? 40
        });
        console.log('[Offscreen] AI session created, streaming prompt...');
        try {
            // For now, use regular prompt instead of streaming since ReadableStream iteration is complex
            // TODO: Implement proper streaming with ReadableStream reader
            const response = await session.prompt(prompt);
            console.log('[Offscreen] Streaming execution successful');
            session.destroy();
            return {
                success: true,
                response
            };
        }
        catch (error) {
            session.destroy();
            throw error;
        }
    }
    catch (error) {
        console.error('[Offscreen] Error executing streaming prompt:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
/**
 * Listen for messages from background script
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    console.log('[Offscreen] Received message:', message.type);
    switch (message.type) {
        case 'CHECK_AI_AVAILABILITY':
            checkAIAvailability().then(sendResponse);
            return true; // Keep message channel open for async response
        case 'EXECUTE_PROMPT':
            executePrompt(message.prompt, message.options).then(sendResponse);
            return true;
        case 'EXECUTE_PROMPT_STREAMING':
            executePromptStreaming(message.prompt, message.options).then(sendResponse);
            return true;
        default:
            console.warn('[Offscreen] Unknown message type:', message.type);
            sendResponse({ success: false, error: 'Unknown message type' });
            return false;
    }
});
console.log('[Offscreen] Ready to handle AI requests');
//# sourceMappingURL=offscreen.js.map