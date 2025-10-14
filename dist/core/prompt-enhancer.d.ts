/**
 * Prompt Enhancer Service
 * Automatically improves user-written prompts using LLM
 */
export interface EnhancementResult {
    success: boolean;
    enhancedPrompt?: string;
    originalPrompt?: string;
    error?: string;
    improvements?: string[];
}
export interface EnhancementOptions {
    temperature?: number;
    topK?: number;
    maxRetries?: number;
}
/**
 * Prompt Enhancer Service
 * Uses AI to automatically improve user-provided prompts
 */
export declare class PromptEnhancer {
    private static instance;
    private aiClient;
    private constructor();
    /**
     * Get singleton instance of PromptEnhancer
     */
    static getInstance(): PromptEnhancer;
    /**
     * Enhance a user's prompt to be more effective
     */
    enhancePrompt(originalPrompt: string, options?: EnhancementOptions): Promise<EnhancementResult>;
    /**
     * Create the meta-prompt for enhancing user prompts
     */
    private createEnhancementMetaPrompt;
    /**
     * Clean and validate the enhanced prompt
     */
    private cleanEnhancedPrompt;
    /**
     * Extract placeholder variables from a prompt
     */
    private extractPlaceholders;
    /**
     * Extract improvements made to the prompt for user feedback
     */
    private extractImprovements;
    /**
     * Fallback method to enhance prompt using direct AI access
     */
    private enhancePromptDirectly;
    /**
     * Test the enhancement functionality
     */
    testEnhancement(): Promise<boolean>;
}
/**
 * Utility function to get Prompt Enhancer instance
 */
export declare const getPromptEnhancer: () => PromptEnhancer;
//# sourceMappingURL=prompt-enhancer.d.ts.map