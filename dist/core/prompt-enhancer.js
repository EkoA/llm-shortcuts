/**
 * Prompt Enhancer Service
 * Automatically improves user-written prompts using LLM
 */
import { getAIClient } from './ai-client';
/**
 * Prompt Enhancer Service
 * Uses AI to automatically improve user-provided prompts
 */
export class PromptEnhancer {
    constructor() {
        this.aiClient = getAIClient();
    }
    /**
     * Get singleton instance of PromptEnhancer
     */
    static getInstance() {
        if (!PromptEnhancer.instance) {
            PromptEnhancer.instance = new PromptEnhancer();
        }
        return PromptEnhancer.instance;
    }
    /**
     * Enhance a user's prompt to be more effective
     */
    async enhancePrompt(originalPrompt, options = {}) {
        try {
            // Validate input
            if (!originalPrompt || originalPrompt.trim().length === 0) {
                return {
                    success: false,
                    error: 'Original prompt cannot be empty',
                    originalPrompt
                };
            }
            // Check if AI client is available and initialize if needed
            if (!(await this.aiClient.isAvailable())) {
                return {
                    success: false,
                    error: 'AI client is not available. Please ensure Chrome AI API is enabled.',
                    originalPrompt
                };
            }
            // Ensure AI client is initialized with timeout
            try {
                const initPromise = this.aiClient.initialize();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI client initialization timeout')), 10000));
                await Promise.race([initPromise, timeoutPromise]);
            }
            catch (initError) {
                console.error('Failed to initialize AI client for enhancement:', initError);
                // Try to use direct AI access as fallback
                console.log('Attempting fallback to direct AI access...');
                try {
                    const enhancedPrompt = await this.enhancePromptDirectly(originalPrompt);
                    return {
                        success: true,
                        enhancedPrompt,
                        originalPrompt,
                        improvements: ['Enhanced using direct AI access']
                    };
                }
                catch (fallbackError) {
                    console.error('Fallback enhancement also failed:', fallbackError);
                    return {
                        success: false,
                        error: 'Failed to initialize AI client. Please try again.',
                        originalPrompt
                    };
                }
            }
            console.log('Enhancing prompt:', originalPrompt);
            // Create enhancement meta-prompt
            const metaPrompt = this.createEnhancementMetaPrompt(originalPrompt);
            // Execute enhancement with timeout
            const executePromise = this.aiClient.executePrompt(metaPrompt, {
                temperature: options.temperature ?? 0.3, // Lower temperature for more consistent results
                topK: options.topK ?? 40
            });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Enhancement timeout')), 30000));
            const enhancedPrompt = await Promise.race([executePromise, timeoutPromise]);
            // Validate and clean the enhanced prompt
            const cleanedPrompt = this.cleanEnhancedPrompt(enhancedPrompt, originalPrompt);
            // Extract improvements for user feedback
            const improvements = this.extractImprovements(originalPrompt, cleanedPrompt);
            console.log('Prompt enhanced successfully');
            console.log('Original:', originalPrompt);
            console.log('Enhanced:', cleanedPrompt);
            return {
                success: true,
                enhancedPrompt: cleanedPrompt,
                originalPrompt,
                improvements
            };
        }
        catch (error) {
            console.error('Prompt enhancement failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred during enhancement',
                originalPrompt
            };
        }
    }
    /**
     * Create the meta-prompt for enhancing user prompts
     */
    createEnhancementMetaPrompt(originalPrompt) {
        return `You are an expert prompt engineer. Your task is to improve the following user prompt to make it more effective, clear, and specific while maintaining its original intent.

IMPORTANT RULES:
1. Preserve the original intent and purpose of the prompt
2. If the prompt contains placeholders like {user_input}, {input}, or similar, keep them exactly as they are
3. If the prompt does NOT contain any placeholder for user input, you MUST add {user_input} in the appropriate place where the user's input should be inserted
4. Make the prompt more specific and actionable
5. Add context and constraints that will improve results
6. Use clear, direct language
7. Structure the prompt for better AI understanding
8. Keep the enhanced prompt concise but comprehensive
9. Do not change the core functionality or expected output format
10. ALWAYS ensure the enhanced prompt includes {user_input} placeholder for user input

Original prompt to enhance:
"${originalPrompt}"

Enhanced prompt:`;
    }
    /**
     * Clean and validate the enhanced prompt
     */
    cleanEnhancedPrompt(enhancedPrompt, originalPrompt) {
        // Remove any quotes that might have been added
        let cleaned = enhancedPrompt.trim();
        // Remove leading/trailing quotes if present
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }
        if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
            cleaned = cleaned.slice(1, -1);
        }
        // Ensure placeholder syntax is preserved
        const originalPlaceholders = this.extractPlaceholders(originalPrompt);
        const enhancedPlaceholders = this.extractPlaceholders(cleaned);
        // If original had placeholders but enhanced doesn't, try to preserve them
        if (originalPlaceholders.length > 0 && enhancedPlaceholders.length === 0) {
            // Try to add back the most common placeholder
            if (originalPrompt.includes('{user_input}') && !cleaned.includes('{user_input}')) {
                // Add {user_input} if it seems like it should be there
                if (cleaned.toLowerCase().includes('input') || cleaned.toLowerCase().includes('text') || cleaned.toLowerCase().includes('content')) {
                    cleaned = cleaned.replace(/(\b(?:input|text|content|data)\b)/gi, '$1: {user_input}');
                }
            }
        }
        // CRITICAL: Ensure {user_input} placeholder is always present
        // If no user input placeholder exists, add it at the end
        if (!cleaned.includes('{user_input}') && !cleaned.includes('{input}') && !cleaned.includes('{text}') && !cleaned.includes('{content}')) {
            // Add {user_input} at the end of the prompt
            cleaned = cleaned + ' {user_input}';
        }
        return cleaned;
    }
    /**
     * Extract placeholder variables from a prompt
     */
    extractPlaceholders(prompt) {
        const placeholderRegex = /\{([^}]+)\}/g;
        const placeholders = [];
        let match;
        while ((match = placeholderRegex.exec(prompt)) !== null) {
            if (match[1]) {
                placeholders.push(match[1]);
            }
        }
        return placeholders;
    }
    /**
     * Extract improvements made to the prompt for user feedback
     */
    extractImprovements(original, enhanced) {
        const improvements = [];
        // Check for common improvements
        if (original.length < enhanced.length && enhanced.length > original.length * 1.2) {
            improvements.push('Added more specific instructions and context');
        }
        if (enhanced.includes('Please') || enhanced.includes('please')) {
            improvements.push('Added polite and clear language');
        }
        if (enhanced.includes('format') || enhanced.includes('structure')) {
            improvements.push('Specified output format requirements');
        }
        if (enhanced.includes('specific') || enhanced.includes('detailed')) {
            improvements.push('Made instructions more specific and actionable');
        }
        if (enhanced.includes('context') || enhanced.includes('background')) {
            improvements.push('Added helpful context for better results');
        }
        // If no specific improvements detected, add a generic one
        if (improvements.length === 0) {
            improvements.push('Improved clarity and effectiveness');
        }
        return improvements;
    }
    /**
     * Fallback method to enhance prompt using direct AI access
     */
    async enhancePromptDirectly(originalPrompt) {
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API not available');
        }
        // Create AI session directly
        const session = await aiWindow.LanguageModel.create({
            temperature: 0.3,
            topK: 40,
            outputLanguage: 'en'
        });
        try {
            // Create enhancement meta-prompt
            const metaPrompt = this.createEnhancementMetaPrompt(originalPrompt);
            // Execute enhancement with timeout
            const promptPromise = session.prompt(metaPrompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Direct enhancement timeout')), 30000));
            const enhancedPrompt = await Promise.race([promptPromise, timeoutPromise]);
            // Clean up session
            session.destroy();
            // Clean and validate the enhanced prompt
            return this.cleanEnhancedPrompt(enhancedPrompt, originalPrompt);
        }
        catch (error) {
            session.destroy();
            throw error;
        }
    }
    /**
     * Test the enhancement functionality
     */
    async testEnhancement() {
        try {
            const testPrompt = "Make this better";
            const result = await this.enhancePrompt(testPrompt);
            return result.success;
        }
        catch (error) {
            console.error('Enhancement test failed:', error);
            return false;
        }
    }
}
/**
 * Utility function to get Prompt Enhancer instance
 */
export const getPromptEnhancer = () => {
    return PromptEnhancer.getInstance();
};
//# sourceMappingURL=prompt-enhancer.js.map