/**
 * Prompt Executor Service
 * Handles AI session management and prompt execution with streaming support
 */
import { SanitizationOptions } from '../utils/prompt-interpolation';
import { Recipe } from '../models/recipe.model';
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
export declare class PromptExecutorError extends Error {
    code: string;
    originalError?: Error | undefined;
    constructor(message: string, code: string, originalError?: Error | undefined);
}
/**
 * Prompt Executor Service
 * Manages AI session lifecycle and prompt execution
 */
export declare class PromptExecutor {
    private static instance;
    private aiClient;
    private activeSessions;
    private executionHistory;
    private constructor();
    /**
     * Get singleton instance of PromptExecutor
     */
    static getInstance(): PromptExecutor;
    /**
     * Execute a recipe with user input
     */
    executeRecipe(recipe: Recipe, userInput: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    /**
     * Execute a recipe with streaming response
     */
    executeRecipeStreaming(recipe: Recipe, userInput: string, options?: ExecutionOptions): AsyncGenerator<string, ExecutionResult, unknown>;
    /**
     * Execute a custom prompt (not from a recipe)
     */
    executeCustomPrompt(prompt: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    /**
     * Get execution history for a session
     */
    getExecutionHistory(sessionId: string): ExecutionResult | undefined;
    /**
     * Get all execution history
     */
    getAllExecutionHistory(): ExecutionResult[];
    /**
     * Clear execution history
     */
    clearExecutionHistory(): void;
    /**
     * Get execution statistics
     */
    getExecutionStats(): {
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        averageExecutionTime: number;
        totalTokensUsed: number;
    };
    /**
     * Test AI connection and basic functionality
     */
    testConnection(): Promise<{
        available: boolean;
        capabilities?: any;
        error?: string;
    }>;
    /**
     * Clean up active sessions
     */
    cleanup(): Promise<void>;
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Estimate token count for a text (rough approximation)
     */
    private estimateTokenCount;
}
/**
 * Utility function to get prompt executor instance
 */
export declare const getPromptExecutor: () => PromptExecutor;
//# sourceMappingURL=prompt-executor.d.ts.map