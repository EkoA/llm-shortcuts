/**
 * Chrome Built-in AI Prompt API wrapper
 * Provides a clean interface for interacting with Chrome's on-device AI model
 */
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
export declare class AIError extends Error {
    code: string;
    originalError?: Error | undefined;
    constructor(message: string, code: string, originalError?: Error | undefined);
}
/**
 * Chrome AI API Client
 * Handles all interactions with Chrome's built-in AI capabilities
 */
export declare class AIClient {
    private static instance;
    private capabilities;
    private isInitialized;
    private constructor();
    /**
     * Get singleton instance of AIClient
     */
    static getInstance(): AIClient;
    /**
     * Check if Chrome AI API is available and initialize capabilities
     */
    initialize(): Promise<AICapabilities>;
    /**
     * Check if AI API is available without full initialization
     */
    isAvailable(): Promise<boolean>;
    /**
     * Get current capabilities (requires initialization)
     */
    getCapabilities(): AICapabilities | null;
    /**
     * Create a new AI session for prompt execution
     */
    createSession(options?: {
        temperature?: number;
        topK?: number;
    }): Promise<AISession>;
    /**
     * Execute a prompt and get the response
     */
    executePrompt(prompt: string, options?: {
        temperature?: number;
        topK?: number;
    }): Promise<string>;
    /**
     * Execute a prompt with streaming response
     */
    executePromptStreaming(prompt: string, options?: {
        temperature?: number;
        topK?: number;
    }): AsyncGenerator<string, void, unknown>;
    /**
     * Test AI API availability and basic functionality
     */
    testConnection(): Promise<{
        available: boolean;
        capabilities?: AICapabilities;
        error?: string;
    }>;
    /**
     * Get Chrome version from user agent
     */
    private getChromeVersion;
}
/**
 * Utility function to get AI client instance
 */
export declare const getAIClient: () => AIClient;
/**
 * Check if Chrome AI API is available in the current environment
 */
export declare const isAIAvailable: () => Promise<boolean>;
export {};
//# sourceMappingURL=ai-client.d.ts.map