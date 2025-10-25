/**
 * Comprehensive Error Handling Utilities
 * Provides centralized error handling, retry logic, and user-friendly error messages
 */
/**
 * Error severity levels
 */
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
/**
 * Error categories for better error handling
 */
export declare enum ErrorCategory {
    AI_API = "ai_api",
    STORAGE = "storage",
    VALIDATION = "validation",
    NETWORK = "network",
    PERMISSION = "permission",
    QUOTA = "quota",
    TIMEOUT = "timeout",
    UNKNOWN = "unknown"
}
/**
 * Enhanced error class with additional metadata
 */
export declare class AppError extends Error {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    originalError?: Error | undefined;
    retryable: boolean;
    userMessage?: string | undefined;
    constructor(message: string, code: string, category: ErrorCategory, severity: ErrorSeverity, originalError?: Error | undefined, retryable?: boolean, userMessage?: string | undefined);
}
/**
 * Error handling configuration
 */
interface ErrorHandlingConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryableErrors: string[];
    userFriendlyMessages: {
        [key: string]: string;
    };
}
/**
 * Error Handler Class
 * Provides centralized error handling with retry logic and user-friendly messages
 */
export declare class ErrorHandler {
    private static instance;
    private config;
    private errorLog;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(config?: Partial<ErrorHandlingConfig>): ErrorHandler;
    /**
     * Handle an error with appropriate categorization and user message
     */
    handleError(error: Error, _context?: string): AppError;
    /**
     * Categorize error and determine severity
     */
    private categorizeError;
    /**
     * Extract error code from error
     */
    private extractErrorCode;
    /**
     * Determine error category
     */
    private determineCategory;
    /**
     * Determine error severity
     */
    private determineSeverity;
    /**
     * Check if error is retryable
     */
    private isRetryable;
    /**
     * Get user-friendly error message
     */
    private getUserFriendlyMessage;
    /**
     * Log error for debugging
     */
    private logError;
    /**
     * Execute function with retry logic
     */
    executeWithRetry<T>(fn: () => Promise<T>, context?: string): Promise<T>;
    /**
     * Execute function with timeout
     */
    executeWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number, context?: string): Promise<T>;
    /**
     * Get error statistics
     */
    getErrorStats(): {
        totalErrors: number;
        errorsByCategory: {
            [key: string]: number;
        };
        errorsBySeverity: {
            [key: string]: number;
        };
        recentErrors: AppError[];
    };
    /**
     * Clear error log
     */
    clearErrorLog(): void;
    /**
     * Create a user-friendly error display
     */
    createErrorDisplay(error: AppError): {
        title: string;
        message: string;
        actions: Array<{
            label: string;
            action: string;
            primary?: boolean;
        }>;
    };
    /**
     * Get error title based on severity and category
     */
    private getErrorTitle;
    /**
     * Utility method to delay execution
     */
    private delay;
}
/**
 * Global error handler instance
 */
export declare const errorHandler: ErrorHandler;
/**
 * Utility function to handle errors with retry
 */
export declare function handleWithRetry<T>(fn: () => Promise<T>, context?: string): Promise<T>;
/**
 * Utility function to handle errors with timeout
 */
export declare function handleWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number, context?: string): Promise<T>;
/**
 * Utility function to create user-friendly error display
 */
export declare function createErrorDisplay(error: Error): {
    title: string;
    message: string;
    actions: Array<{
        label: string;
        action: string;
        primary?: boolean;
    }>;
};
/**
 * Global error handler for unhandled errors
 */
export declare function setupGlobalErrorHandling(): void;
export {};
//# sourceMappingURL=error-handler.d.ts.map