/**
 * Chrome Built-in AI Prompt API wrapper
 * Provides a clean interface for interacting with Chrome's on-device AI model
 */

// Type definitions for Chrome AI API
interface AICapabilities {
    canUseAI: boolean;
    model?: string;
    features?: string[];
}

interface AISession {
    prompt(prompt: string): Promise<string>;
    promptStreaming(prompt: string): AsyncIterable<string>;
    destroy(): void;
}

interface AILanguageModel {
    capabilities(): Promise<AICapabilities>;
    availability(): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;
    create(options?: {
        temperature?: number;
        topK?: number;
        monitor?: (monitor: any) => void;
    }): Promise<AISession>;
}

interface AIAPI {
    languageModel: AILanguageModel;
}

declare global {
    interface Window {
        ai?: AIAPI;
    }
}

/**
 * Error types for AI API operations
 */
export class AIError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'AIError';
    }
}

/**
 * Chrome AI API Client
 * Handles all interactions with Chrome's built-in AI capabilities
 */
export class AIClient {
    private static instance: AIClient;
    private capabilities: AICapabilities | null = null;
    private isInitialized = false;

    private constructor() { }

    /**
     * Get singleton instance of AIClient
     */
    public static getInstance(): AIClient {
        if (!AIClient.instance) {
            AIClient.instance = new AIClient();
        }
        return AIClient.instance;
    }

    /**
     * Check if Chrome AI API is available and initialize capabilities
     */
    public async initialize(): Promise<AICapabilities> {
        if (this.isInitialized && this.capabilities) {
            return this.capabilities;
        }

        try {
            // Check if LanguageModel is available
            if (!(window as any).LanguageModel) {
                console.error('Chrome AI API not available. Debug info:');
                console.error('- LanguageModel:', !!(window as any).LanguageModel);
                console.error('- User agent:', navigator.userAgent);
                console.error('- Chrome version check:', this.getChromeVersion());

                throw new AIError(
                    'Chrome AI API is not available. Please ensure you are using Chrome 127+ with AI features enabled. Check chrome://flags/#optimization-guide-on-device-model and chrome://flags/#prompt-api-for-gemini-nano',
                    'API_NOT_AVAILABLE'
                );
            }

            // Check AI availability status
            const availability = await (window as any).LanguageModel.availability();
            console.log('AI availability status:', availability);

            if (availability === 'unavailable') {
                throw new AIError(
                    'AI model is not available on this device. Please check Chrome flags and ensure you are using Chrome 127+',
                    'MODEL_UNAVAILABLE'
                );
            }

            if (availability === 'downloadable') {
                console.log('AI model needs to be downloaded. This may take some time...');
                // The model will be downloaded when we create a session
            }

            if (availability === 'downloading') {
                console.log('AI model is currently downloading. Please wait...');
                // Wait for download to complete
                let downloadStatus: 'unavailable' | 'downloadable' | 'downloading' | 'available' = availability;
                while (downloadStatus === 'downloading') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    downloadStatus = await (window as any).LanguageModel.availability();
                }

                if (downloadStatus !== 'available') {
                    throw new AIError(
                        'AI model download failed or is not available',
                        'DOWNLOAD_FAILED'
                    );
                }
            }

            // Get capabilities (if available)
            try {
                if (typeof (window as any).LanguageModel.capabilities === 'function') {
                    this.capabilities = await (window as any).LanguageModel.capabilities();
                    console.log('AI Client initialized with capabilities:', this.capabilities);
                } else {
                    console.log('AI capabilities not available, using basic AI functionality');
                    this.capabilities = {
                        canUseAI: true,
                        model: 'chrome-ai',
                        features: ['prompt', 'streaming']
                    };
                }
                this.isInitialized = true;
                return this.capabilities!;
            } catch (capabilitiesError) {
                console.error('Failed to get AI capabilities:', capabilitiesError);
                // Don't fail initialization if capabilities are not available
                console.log('Proceeding without capabilities, using basic AI functionality');
                this.capabilities = {
                    canUseAI: true,
                    model: 'chrome-ai',
                    features: ['prompt', 'streaming']
                };
                this.isInitialized = true;
                return this.capabilities!;
            }
        } catch (error) {
            const aiError = new AIError(
                'Failed to initialize AI client',
                'INITIALIZATION_FAILED',
                error as Error
            );
            console.error('AI Client initialization failed:', aiError);
            throw aiError;
        }
    }

    /**
     * Check if AI API is available without full initialization
     */
    public async isAvailable(): Promise<boolean> {
        try {
            if (!(window as any).LanguageModel) {
                return false;
            }

            const availability = await (window as any).LanguageModel.availability();
            // Accept both 'available' and 'downloadable' as valid states
            // The model will be downloaded automatically on first use if needed
            return availability === 'available' || availability === 'downloadable';
        } catch (error) {
            console.error('Error checking AI availability:', error);
            return false;
        }
    }

    /**
     * Get current capabilities (requires initialization)
     */
    public getCapabilities(): AICapabilities | null {
        return this.capabilities;
    }

    /**
     * Create a new AI session for prompt execution
     */
    public async createSession(options?: {
        temperature?: number;
        topK?: number;
    }): Promise<AISession> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!(window as any).LanguageModel) {
            throw new AIError(
                'AI API not available',
                'API_NOT_AVAILABLE'
            );
        }

        try {
            const session = await (window as any).LanguageModel.create({
                temperature: options?.temperature ?? 0.7,
                topK: options?.topK ?? 40
            });

            return session;
        } catch (error) {
            throw new AIError(
                'Failed to create AI session',
                'SESSION_CREATION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Execute a prompt and get the response
     */
    public async executePrompt(
        prompt: string,
        options?: {
            temperature?: number;
            topK?: number;
        }
    ): Promise<string> {
        const session = await this.createSession(options);

        try {
            const response = await session.prompt(prompt);
            session.destroy();
            return response;
        } catch (error) {
            session.destroy();

            if (error instanceof AIError) {
                throw error;
            }

            throw new AIError(
                'Failed to execute prompt',
                'PROMPT_EXECUTION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Execute a prompt with streaming response
     */
    public async *executePromptStreaming(
        prompt: string,
        options?: {
            temperature?: number;
            topK?: number;
        }
    ): AsyncGenerator<string, void, unknown> {
        const session = await this.createSession(options);

        try {
            const stream = session.promptStreaming(prompt);

            for await (const chunk of stream) {
                yield chunk;
            }

            session.destroy();
        } catch (error) {
            session.destroy();

            if (error instanceof AIError) {
                throw error;
            }

            throw new AIError(
                'Failed to execute streaming prompt',
                'STREAMING_EXECUTION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Test AI API availability and basic functionality
     */
    public async testConnection(): Promise<{
        available: boolean;
        capabilities?: AICapabilities;
        error?: string;
    }> {
        try {
            const capabilities = await this.initialize();

            // Test basic prompt execution
            const testPrompt = "Say 'Hello, AI is working!'";
            await this.executePrompt(testPrompt);

            return {
                available: true,
                capabilities
            };
        } catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get Chrome version from user agent
     */
    private getChromeVersion(): string {
        const userAgent = navigator.userAgent;
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        return chromeMatch?.[1] || 'Unknown';
    }
}

/**
 * Utility function to get AI client instance
 */
export const getAIClient = (): AIClient => AIClient.getInstance();

/**
 * Check if Chrome AI API is available in the current environment
 */
export const isAIAvailable = async (): Promise<boolean> => {
    try {
        if (!(window as any).LanguageModel) {
            return false;
        }

        const availability = await (window as any).LanguageModel.availability();
        // Accept both 'available' and 'downloadable' as valid states
        // The model will be downloaded automatically on first use if needed
        return availability === 'available' || availability === 'downloadable';
    } catch (error) {
        console.error('Error checking AI availability:', error);
        return false;
    }
};

// Make functions available globally for browser environment
if (typeof window !== 'undefined') {
    (window as any).getAIClient = getAIClient;
    (window as any).isAIAvailable = isAIAvailable;
    console.log('AI Client: Functions exposed globally');
}
