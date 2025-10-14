/**
 * Chrome Built-in AI Prompt API wrapper
 * Provides a clean interface for interacting with Chrome's on-device AI model
 */
/**
 * Error types for AI API operations
 */
export class AIError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'AIError';
    }
}
/**
 * Chrome AI API Client
 * Handles all interactions with Chrome's built-in AI capabilities
 */
export class AIClient {
    constructor() {
        this.capabilities = null;
        this.isInitialized = false;
    }
    /**
     * Get singleton instance of AIClient
     */
    static getInstance() {
        if (!AIClient.instance) {
            AIClient.instance = new AIClient();
        }
        return AIClient.instance;
    }
    /**
     * Check if Chrome AI API is available and initialize capabilities
     */
    async initialize() {
        if (this.isInitialized && this.capabilities) {
            return this.capabilities;
        }
        try {
            // Check if LanguageModel is available
            if (!window.LanguageModel) {
                console.error('Chrome AI API not available. Debug info:');
                console.error('- LanguageModel:', !!window.LanguageModel);
                console.error('- User agent:', navigator.userAgent);
                console.error('- Chrome version check:', this.getChromeVersion());
                throw new AIError('Chrome AI API is not available. Please ensure you are using Chrome 127+ with AI features enabled. Check chrome://flags/#optimization-guide-on-device-model and chrome://flags/#prompt-api-for-gemini-nano', 'API_NOT_AVAILABLE');
            }
            // Check AI availability status
            const availability = await window.LanguageModel.availability();
            console.log('AI availability status:', availability);
            if (availability === 'unavailable') {
                throw new AIError('AI model is not available on this device. Please check Chrome flags and ensure you are using Chrome 127+', 'MODEL_UNAVAILABLE');
            }
            if (availability === 'downloadable') {
                console.log('AI model needs to be downloaded. This may take some time...');
                // The model will be downloaded when we create a session
            }
            if (availability === 'downloading') {
                console.log('AI model is currently downloading. Please wait...');
                // Wait for download to complete
                let downloadStatus = availability;
                while (downloadStatus === 'downloading') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    downloadStatus = await window.LanguageModel.availability();
                }
                if (downloadStatus !== 'available') {
                    throw new AIError('AI model download failed or is not available', 'DOWNLOAD_FAILED');
                }
            }
            // Get capabilities (if available)
            try {
                if (typeof window.LanguageModel.capabilities === 'function') {
                    this.capabilities = await window.LanguageModel.capabilities();
                    console.log('AI Client initialized with capabilities:', this.capabilities);
                }
                else {
                    console.log('AI capabilities not available, using basic AI functionality');
                    this.capabilities = {
                        canUseAI: true,
                        model: 'chrome-ai',
                        features: ['prompt', 'streaming']
                    };
                }
                this.isInitialized = true;
                return this.capabilities;
            }
            catch (capabilitiesError) {
                console.error('Failed to get AI capabilities:', capabilitiesError);
                // Don't fail initialization if capabilities are not available
                console.log('Proceeding without capabilities, using basic AI functionality');
                this.capabilities = {
                    canUseAI: true,
                    model: 'chrome-ai',
                    features: ['prompt', 'streaming']
                };
                this.isInitialized = true;
                return this.capabilities;
            }
        }
        catch (error) {
            const aiError = new AIError('Failed to initialize AI client', 'INITIALIZATION_FAILED', error);
            console.error('AI Client initialization failed:', aiError);
            throw aiError;
        }
    }
    /**
     * Check if AI API is available without full initialization
     */
    async isAvailable() {
        try {
            if (!window.LanguageModel) {
                return false;
            }
            const availability = await window.LanguageModel.availability();
            // Accept both 'available' and 'downloadable' as valid states
            // The model will be downloaded automatically on first use if needed
            return availability === 'available' || availability === 'downloadable';
        }
        catch (error) {
            console.error('Error checking AI availability:', error);
            return false;
        }
    }
    /**
     * Get current capabilities (requires initialization)
     */
    getCapabilities() {
        return this.capabilities;
    }
    /**
     * Create a new AI session for prompt execution
     */
    async createSession(options) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (!window.LanguageModel) {
            throw new AIError('AI API not available', 'API_NOT_AVAILABLE');
        }
        try {
            const session = await window.LanguageModel.create({
                temperature: options?.temperature ?? 0.7,
                topK: options?.topK ?? 40
            });
            return session;
        }
        catch (error) {
            throw new AIError('Failed to create AI session', 'SESSION_CREATION_FAILED', error);
        }
    }
    /**
     * Execute a prompt and get the response
     */
    async executePrompt(prompt, options) {
        const session = await this.createSession(options);
        try {
            const response = await session.prompt(prompt);
            session.destroy();
            return response;
        }
        catch (error) {
            session.destroy();
            if (error instanceof AIError) {
                throw error;
            }
            throw new AIError('Failed to execute prompt', 'PROMPT_EXECUTION_FAILED', error);
        }
    }
    /**
     * Execute a prompt with streaming response
     */
    async *executePromptStreaming(prompt, options) {
        const session = await this.createSession(options);
        try {
            const stream = session.promptStreaming(prompt);
            for await (const chunk of stream) {
                yield chunk;
            }
            session.destroy();
        }
        catch (error) {
            session.destroy();
            if (error instanceof AIError) {
                throw error;
            }
            throw new AIError('Failed to execute streaming prompt', 'STREAMING_EXECUTION_FAILED', error);
        }
    }
    /**
     * Test AI API availability and basic functionality
     */
    async testConnection() {
        try {
            const capabilities = await this.initialize();
            // Test basic prompt execution
            const testPrompt = "Say 'Hello, AI is working!'";
            await this.executePrompt(testPrompt);
            return {
                available: true,
                capabilities
            };
        }
        catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get Chrome version from user agent
     */
    getChromeVersion() {
        const userAgent = navigator.userAgent;
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        return chromeMatch?.[1] || 'Unknown';
    }
}
/**
 * Utility function to get AI client instance
 */
export const getAIClient = () => AIClient.getInstance();
/**
 * Check if Chrome AI API is available in the current environment
 */
export const isAIAvailable = async () => {
    try {
        if (!window.LanguageModel) {
            return false;
        }
        const availability = await window.LanguageModel.availability();
        // Accept both 'available' and 'downloadable' as valid states
        // The model will be downloaded automatically on first use if needed
        return availability === 'available' || availability === 'downloadable';
    }
    catch (error) {
        console.error('Error checking AI availability:', error);
        return false;
    }
};
// Make functions available globally for browser environment
if (typeof window !== 'undefined') {
    window.getAIClient = getAIClient;
    window.isAIAvailable = isAIAvailable;
    console.log('AI Client: Functions exposed globally');
}
//# sourceMappingURL=ai-client.js.map