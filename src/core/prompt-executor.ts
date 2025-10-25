/**
 * Prompt Executor Service
 * Handles AI session management and prompt execution with streaming support
 */

import { AIClient } from './ai-client';
import { interpolatePrompt, sanitizeInput, SanitizationOptions } from '../utils/prompt-interpolation';
import { Recipe } from '../models/recipe.model';
import { AppError, ErrorCategory, ErrorSeverity, handleWithRetry, handleWithTimeout } from '../utils/error-handler';

/**
 * Execution options for prompt execution
 */
export interface ExecutionOptions {
    temperature?: number;
    topK?: number;
    streaming?: boolean;
    sanitization?: SanitizationOptions;
    timeout?: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
    success: boolean;
    response?: string;
    error?: string;
    executionTime: number;
    tokensUsed?: number;
}

/**
 * Streaming execution result
 */
export interface StreamingExecutionResult {
    success: boolean;
    error?: string;
    executionTime: number;
    tokensUsed?: number;
}

/**
 * Error types for prompt execution
 */
export class PromptExecutorError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'PromptExecutorError';
    }
}

/**
 * Prompt Executor Service
 * Manages AI session lifecycle and prompt execution
 */
export class PromptExecutor {
    private static instance: PromptExecutor;
    private aiClient: AIClient;
    private activeSessions: Map<string, any> = new Map();
    private executionHistory: Map<string, ExecutionResult> = new Map();

    private constructor() {
        this.aiClient = AIClient.getInstance();
    }

    /**
     * Get singleton instance of PromptExecutor
     */
    public static getInstance(): PromptExecutor {
        if (!PromptExecutor.instance) {
            PromptExecutor.instance = new PromptExecutor();
        }
        return PromptExecutor.instance;
    }

    /**
     * Execute a recipe with user input
     */
    public async executeRecipe(
        recipe: Recipe,
        userInput: string,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();

        try {
            // Validate inputs
            if (!recipe || !userInput) {
                throw new AppError(
                    'Recipe and user input are required',
                    'INVALID_INPUTS',
                    ErrorCategory.VALIDATION,
                    ErrorSeverity.LOW,
                    undefined,
                    false,
                    'Please provide both a recipe and user input.'
                );
            }

            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new AppError(
                    'AI client is not available. Please ensure Chrome AI API is enabled.',
                    'AI_CLIENT_NOT_AVAILABLE',
                    ErrorCategory.AI_API,
                    ErrorSeverity.CRITICAL,
                    undefined,
                    true,
                    'AI features are not available. Please check your Chrome settings.'
                );
            }

            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(
                recipe.prompt,
                userInput,
                options.sanitization
            );

            console.log('Executing recipe:', recipe.name);
            console.log('Interpolated prompt:', interpolatedPrompt);

            // Execute prompt with retry logic and timeout
            const response = await handleWithRetry(
                () => handleWithTimeout(
                    () => this.aiClient.executePrompt(interpolatedPrompt, {
                        temperature: options.temperature ?? 0.7,
                        topK: options.topK ?? 40
                    }),
                    options.timeout ?? 30000, // 30 second timeout
                    'Recipe execution'
                ),
                'Recipe execution'
            );

            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(interpolatedPrompt + response)
            };

            // Store execution history
            this.executionHistory.set(sessionId, result);

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };

            // Store failed execution
            this.executionHistory.set(sessionId, result);

            console.error('Recipe execution failed:', error);

            if (error instanceof AppError) {
                throw error;
            }

            throw new AppError(
                'Failed to execute recipe',
                'EXECUTION_FAILED',
                ErrorCategory.AI_API,
                ErrorSeverity.HIGH,
                error as Error,
                true,
                'Failed to execute recipe. Please try again.'
            );
        }
    }

    /**
     * Execute a recipe with multimodal input (text and image)
     */
    public async executeRecipeMultimodal(
        recipe: Recipe,
        userInput: string,
        imageFile?: File,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();

        try {
            // Validate inputs
            if (!recipe || (!userInput && !imageFile)) {
                throw new PromptExecutorError(
                    'Recipe and at least one input (text or image) are required',
                    'INVALID_INPUTS'
                );
            }

            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError(
                    'AI client is not available. Please ensure Chrome AI API is enabled.',
                    'AI_CLIENT_NOT_AVAILABLE'
                );
            }

            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(
                recipe.prompt,
                userInput || '',
                options.sanitization
            );

            console.log('Executing multimodal recipe:', recipe.name);
            console.log('Interpolated prompt:', interpolatedPrompt);
            console.log('Image file:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'None');

            // Execute multimodal prompt
            const response = await this.aiClient.executeMultimodalPrompt(
                interpolatedPrompt,
                imageFile,
                {
                    temperature: options.temperature ?? 0.7,
                    topK: options.topK ?? 40
                }
            );

            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(interpolatedPrompt + response)
            };

            // Store execution history
            this.executionHistory.set(sessionId, result);

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };

            // Store failed execution
            this.executionHistory.set(sessionId, result);

            console.error('Multimodal recipe execution failed:', error);
            throw new PromptExecutorError(
                'Failed to execute multimodal recipe',
                'MULTIMODAL_EXECUTION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Execute a recipe with multimodal input and streaming response
     */
    public async *executeRecipeMultimodalStreaming(
        recipe: Recipe,
        userInput: string,
        imageFile?: File,
        options: ExecutionOptions = {}
    ): AsyncGenerator<string, ExecutionResult, unknown> {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();

        try {
            // Validate inputs
            if (!recipe || (!userInput && !imageFile)) {
                throw new PromptExecutorError(
                    'Recipe and at least one input (text or image) are required',
                    'INVALID_INPUTS'
                );
            }

            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError(
                    'AI client is not available. Please ensure Chrome AI API is enabled.',
                    'AI_CLIENT_NOT_AVAILABLE'
                );
            }

            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(
                recipe.prompt,
                userInput || '',
                options.sanitization
            );

            console.log('Executing multimodal recipe with streaming:', recipe.name);

            let fullResponse = '';
            let tokenCount = 0;

            // Execute multimodal streaming prompt
            const stream = this.aiClient.executeMultimodalPromptStreaming(
                interpolatedPrompt,
                imageFile,
                {
                    temperature: options.temperature ?? 0.7,
                    topK: options.topK ?? 40
                }
            );

            for await (const chunk of stream) {
                fullResponse += chunk;
                tokenCount += this.estimateTokenCount(chunk);
                yield chunk;
            }

            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: true,
                response: fullResponse,
                executionTime,
                tokensUsed: tokenCount
            };

            // Store execution history
            this.executionHistory.set(sessionId, result);

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };

            // Store failed execution
            this.executionHistory.set(sessionId, result);

            console.error('Multimodal streaming execution failed:', error);
            throw new PromptExecutorError(
                'Failed to execute multimodal recipe with streaming',
                'MULTIMODAL_STREAMING_EXECUTION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Execute a recipe with streaming response
     */
    public async *executeRecipeStreaming(
        recipe: Recipe,
        userInput: string,
        options: ExecutionOptions = {}
    ): AsyncGenerator<string, ExecutionResult, unknown> {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();

        try {
            // Validate inputs
            if (!recipe || !userInput) {
                throw new PromptExecutorError(
                    'Recipe and user input are required',
                    'INVALID_INPUTS'
                );
            }

            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError(
                    'AI client is not available. Please ensure Chrome AI API is enabled.',
                    'AI_CLIENT_NOT_AVAILABLE'
                );
            }

            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(
                recipe.prompt,
                userInput,
                options.sanitization
            );

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

            const result: ExecutionResult = {
                success: true,
                response: fullResponse,
                executionTime,
                tokensUsed: tokenCount
            };

            // Store execution history
            this.executionHistory.set(sessionId, result);

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };

            // Store failed execution
            this.executionHistory.set(sessionId, result);

            console.error('Streaming execution failed:', error);
            throw new PromptExecutorError(
                'Failed to execute recipe with streaming',
                'STREAMING_EXECUTION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Execute a custom prompt (not from a recipe)
     */
    public async executeCustomPrompt(
        prompt: string,
        options: ExecutionOptions = {}
    ): Promise<ExecutionResult> {
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

            const result: ExecutionResult = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(sanitizedPrompt + response)
            };

            // Store execution history
            this.executionHistory.set(sessionId, result);

            return result;
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const result: ExecutionResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };

            // Store failed execution
            this.executionHistory.set(sessionId, result);

            console.error('Custom prompt execution failed:', error);
            throw new PromptExecutorError(
                'Failed to execute custom prompt',
                'CUSTOM_EXECUTION_FAILED',
                error as Error
            );
        }
    }

    /**
     * Get execution history for a session
     */
    public getExecutionHistory(sessionId: string): ExecutionResult | undefined {
        return this.executionHistory.get(sessionId);
    }

    /**
     * Get all execution history
     */
    public getAllExecutionHistory(): ExecutionResult[] {
        return Array.from(this.executionHistory.values());
    }

    /**
     * Clear execution history
     */
    public clearExecutionHistory(): void {
        this.executionHistory.clear();
    }

    /**
     * Get execution statistics
     */
    public getExecutionStats(): {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        totalTokensUsed: number;
    } {
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
    public async testConnection(): Promise<{
        available: boolean;
        capabilities?: any;
        error?: string;
    }> {
        try {
            return await this.aiClient.testConnection();
        } catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Clean up active sessions
     */
    public async cleanup(): Promise<void> {
        try {
            // Clean up any active sessions
            for (const [sessionId, session] of this.activeSessions) {
                try {
                    if (session && typeof session.destroy === 'function') {
                        session.destroy();
                    }
                } catch (error) {
                    console.warn(`Failed to destroy session ${sessionId}:`, error);
                }
            }
            this.activeSessions.clear();
        } catch (error) {
            console.error('Failed to cleanup sessions:', error);
        }
    }

    /**
     * Generate a unique session ID
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Estimate token count for a text (rough approximation)
     */
    private estimateTokenCount(text: string): number {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
}

/**
 * Utility function to get prompt executor instance
 */
export const getPromptExecutor = (): PromptExecutor => PromptExecutor.getInstance();
