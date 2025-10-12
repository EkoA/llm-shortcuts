/**
 * Prompt Executor Service
 * Handles AI session management and prompt execution with streaming support
 */
import { AIClient } from './ai-client';
import { interpolatePrompt, sanitizeInput } from '../utils/prompt-interpolation';
/**
 * Error types for prompt execution
 */
export class PromptExecutorError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'PromptExecutorError';
    }
}
/**
 * Prompt Executor Service
 * Manages AI session lifecycle and prompt execution
 */
export class PromptExecutor {
    constructor() {
        this.activeSessions = new Map();
        this.executionHistory = new Map();
        this.aiClient = AIClient.getInstance();
    }
    /**
     * Get singleton instance of PromptExecutor
     */
    static getInstance() {
        if (!PromptExecutor.instance) {
            PromptExecutor.instance = new PromptExecutor();
        }
        return PromptExecutor.instance;
    }
    /**
     * Execute a recipe with user input
     */
    async executeRecipe(recipe, userInput, options = {}) {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        try {
            // Validate inputs
            if (!recipe || !userInput) {
                throw new PromptExecutorError('Recipe and user input are required', 'INVALID_INPUTS');
            }
            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError('AI client is not available. Please ensure Chrome AI API is enabled.', 'AI_CLIENT_NOT_AVAILABLE');
            }
            // Interpolate prompt with user input
            console.log('=== PROMPT EXECUTOR DEBUG ===');
            console.log('Recipe prompt template:', recipe.prompt);
            console.log('User input:', userInput);
            console.log('User input type:', typeof userInput);
            const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, options.sanitization);
            console.log('Executing recipe:', recipe.name);
            console.log('Interpolated prompt:', interpolatedPrompt);
            console.log('Interpolation successful:', interpolatedPrompt !== recipe.prompt);
            // Execute prompt
            const response = await this.aiClient.executePrompt(interpolatedPrompt, {
                temperature: options.temperature ?? 0.7,
                topK: options.topK ?? 40
            });
            const executionTime = Date.now() - startTime;
            const result = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(interpolatedPrompt + response)
            };
            // Store execution history
            this.executionHistory.set(sessionId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };
            // Store failed execution
            this.executionHistory.set(sessionId, result);
            console.error('Recipe execution failed:', error);
            throw new PromptExecutorError('Failed to execute recipe', 'EXECUTION_FAILED', error);
        }
    }
    /**
     * Execute a recipe with streaming response
     */
    async *executeRecipeStreaming(recipe, userInput, options = {}) {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        try {
            // Validate inputs
            if (!recipe || !userInput) {
                throw new PromptExecutorError('Recipe and user input are required', 'INVALID_INPUTS');
            }
            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError('AI client is not available. Please ensure Chrome AI API is enabled.', 'AI_CLIENT_NOT_AVAILABLE');
            }
            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, options.sanitization);
            console.log('Executing recipe with streaming:', recipe.name);
            let fullResponse = '';
            let tokenCount = 0;
            // Execute streaming prompt
            const stream = this.aiClient.executePromptStreaming(interpolatedPrompt, {
                temperature: options.temperature ?? 0.7,
                topK: options.topK ?? 40
            });
            for await (const chunk of stream) {
                fullResponse += chunk;
                tokenCount += this.estimateTokenCount(chunk);
                yield chunk;
            }
            const executionTime = Date.now() - startTime;
            const result = {
                success: true,
                response: fullResponse,
                executionTime,
                tokensUsed: tokenCount
            };
            // Store execution history
            this.executionHistory.set(sessionId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };
            // Store failed execution
            this.executionHistory.set(sessionId, result);
            console.error('Streaming execution failed:', error);
            throw new PromptExecutorError('Failed to execute recipe with streaming', 'STREAMING_EXECUTION_FAILED', error);
        }
    }
    /**
     * Execute a custom prompt (not from a recipe)
     */
    async executeCustomPrompt(prompt, options = {}) {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        try {
            // Sanitize prompt if needed
            const sanitizedPrompt = options.sanitization
                ? sanitizeInput(prompt, options.sanitization)
                : prompt;
            console.log('Executing custom prompt');
            // Execute prompt
            const response = await this.aiClient.executePrompt(sanitizedPrompt, {
                temperature: options.temperature ?? 0.7,
                topK: options.topK ?? 40
            });
            const executionTime = Date.now() - startTime;
            const result = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(sanitizedPrompt + response)
            };
            // Store execution history
            this.executionHistory.set(sessionId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };
            // Store failed execution
            this.executionHistory.set(sessionId, result);
            console.error('Custom prompt execution failed:', error);
            throw new PromptExecutorError('Failed to execute custom prompt', 'CUSTOM_EXECUTION_FAILED', error);
        }
    }
    /**
     * Get execution history for a session
     */
    getExecutionHistory(sessionId) {
        return this.executionHistory.get(sessionId);
    }
    /**
     * Get all execution history
     */
    getAllExecutionHistory() {
        return Array.from(this.executionHistory.values());
    }
    /**
     * Clear execution history
     */
    clearExecutionHistory() {
        this.executionHistory.clear();
    }
    /**
     * Get execution statistics
     */
    getExecutionStats() {
        const executions = this.getAllExecutionHistory();
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(e => e.success).length;
        const failedExecutions = totalExecutions - successfulExecutions;
        const averageExecutionTime = executions.length > 0
            ? executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length
            : 0;
        const totalTokensUsed = executions.reduce((sum, e) => sum + (e.tokensUsed || 0), 0);
        return {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            averageExecutionTime,
            totalTokensUsed
        };
    }
    /**
     * Test AI connection and basic functionality
     */
    async testConnection() {
        try {
            return await this.aiClient.testConnection();
        }
        catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Clean up active sessions
     */
    async cleanup() {
        try {
            // Clean up any active sessions
            for (const [sessionId, session] of this.activeSessions) {
                try {
                    if (session && typeof session.destroy === 'function') {
                        session.destroy();
                    }
                }
                catch (error) {
                    console.warn(`Failed to destroy session ${sessionId}:`, error);
                }
            }
            this.activeSessions.clear();
        }
        catch (error) {
            console.error('Failed to cleanup sessions:', error);
        }
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Estimate token count for a text (rough approximation)
     */
    estimateTokenCount(text) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
}
/**
 * Utility function to get prompt executor instance
 */
export const getPromptExecutor = () => PromptExecutor.getInstance();
//# sourceMappingURL=prompt-executor.js.map