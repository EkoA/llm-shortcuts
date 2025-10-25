/**
 * Comprehensive Error Handling Utilities
 * Provides centralized error handling, retry logic, and user-friendly error messages
 */

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

/**
 * Error categories for better error handling
 */
export enum ErrorCategory {
    AI_API = 'ai_api',
    STORAGE = 'storage',
    VALIDATION = 'validation',
    NETWORK = 'network',
    PERMISSION = 'permission',
    QUOTA = 'quota',
    TIMEOUT = 'timeout',
    UNKNOWN = 'unknown'
}

/**
 * Enhanced error class with additional metadata
 */
export class AppError extends Error {
    constructor(
        message: string,
        public code: string,
        public category: ErrorCategory,
        public severity: ErrorSeverity,
        public originalError?: Error,
        public retryable: boolean = false,
        public userMessage?: string
    ) {
        super(message);
        this.name = 'AppError';
    }
}

/**
 * Error handling configuration
 */
interface ErrorHandlingConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    retryableErrors: string[];
    userFriendlyMessages: { [key: string]: string };
}

/**
 * Default error handling configuration
 */
const DEFAULT_CONFIG: ErrorHandlingConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryableErrors: [
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
        'QUOTA_EXCEEDED',
        'RATE_LIMITED',
        'TEMPORARY_FAILURE'
    ],
    userFriendlyMessages: {
        'API_NOT_AVAILABLE': 'AI features are not available. Please ensure Chrome 127+ with AI flags enabled.',
        'MODEL_UNAVAILABLE': 'AI model is not available. Please check your Chrome settings.',
        'DOWNLOAD_FAILED': 'Failed to download AI model. Please check your internet connection and storage space.',
        'STORAGE_NOT_AVAILABLE': 'Storage is not available. Please check your browser permissions.',
        'QUOTA_EXCEEDED': 'You have reached the usage limit. Please try again later.',
        'RATE_LIMITED': 'Too many requests. Please wait a moment before trying again.',
        'TIMEOUT_ERROR': 'Request timed out. Please try again.',
        'NETWORK_ERROR': 'Network error. Please check your internet connection.',
        'VALIDATION_ERROR': 'Invalid input provided. Please check your data.',
        'PERMISSION_DENIED': 'Permission denied. Please check your browser settings.',
        'UNKNOWN_ERROR': 'An unexpected error occurred. Please try again.'
    }
};

/**
 * Error Handler Class
 * Provides centralized error handling with retry logic and user-friendly messages
 */
export class ErrorHandler {
    private static instance: ErrorHandler;
    private config: ErrorHandlingConfig;
    private errorLog: AppError[] = [];

    private constructor(config: Partial<ErrorHandlingConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Get singleton instance
     */
    public static getInstance(config?: Partial<ErrorHandlingConfig>): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler(config);
        }
        return ErrorHandler.instance;
    }

    /**
     * Handle an error with appropriate categorization and user message
     */
    public handleError(error: Error, _context?: string): AppError {
        const appError = this.categorizeError(error, _context);
        this.logError(appError);
        return appError;
    }

    /**
     * Categorize error and determine severity
     */
    private categorizeError(error: Error, _context?: string): AppError {
        const message = error.message;
        const code = this.extractErrorCode(error);
        const category = this.determineCategory(error);
        const severity = this.determineSeverity(error, category);
        const retryable = this.isRetryable(error);
        const userMessage = this.getUserFriendlyMessage(code);

        return new AppError(
            message,
            code,
            category,
            severity,
            error,
            retryable,
            userMessage
        );
    }

    /**
     * Extract error code from error
     */
    private extractErrorCode(error: Error): string {
        if ('code' in error) {
            return (error as any).code;
        }

        // Extract from message patterns
        if (error.message.includes('not available')) return 'API_NOT_AVAILABLE';
        if (error.message.includes('quota')) return 'QUOTA_EXCEEDED';
        if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
        if (error.message.includes('network')) return 'NETWORK_ERROR';
        if (error.message.includes('permission')) return 'PERMISSION_DENIED';
        if (error.message.includes('validation')) return 'VALIDATION_ERROR';

        return 'UNKNOWN_ERROR';
    }

    /**
     * Determine error category
     */
    private determineCategory(error: Error): ErrorCategory {
        const message = error.message.toLowerCase();

        if (message.includes('ai') || message.includes('model') || message.includes('language')) {
            return ErrorCategory.AI_API;
        }
        if (message.includes('storage') || message.includes('save') || message.includes('load')) {
            return ErrorCategory.STORAGE;
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return ErrorCategory.VALIDATION;
        }
        if (message.includes('network') || message.includes('connection')) {
            return ErrorCategory.NETWORK;
        }
        if (message.includes('permission') || message.includes('access')) {
            return ErrorCategory.PERMISSION;
        }
        if (message.includes('quota') || message.includes('limit')) {
            return ErrorCategory.QUOTA;
        }
        if (message.includes('timeout')) {
            return ErrorCategory.TIMEOUT;
        }

        return ErrorCategory.UNKNOWN;
    }

    /**
     * Determine error severity
     */
    private determineSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
        const message = error.message.toLowerCase();

        // Critical errors
        if (category === ErrorCategory.AI_API && message.includes('not available')) {
            return ErrorSeverity.CRITICAL;
        }
        if (category === ErrorCategory.STORAGE && message.includes('corrupted')) {
            return ErrorSeverity.CRITICAL;
        }

        // High severity errors
        if (category === ErrorCategory.QUOTA) {
            return ErrorSeverity.HIGH;
        }
        if (category === ErrorCategory.PERMISSION) {
            return ErrorSeverity.HIGH;
        }

        // Medium severity errors
        if (category === ErrorCategory.NETWORK) {
            return ErrorSeverity.MEDIUM;
        }
        if (category === ErrorCategory.TIMEOUT) {
            return ErrorSeverity.MEDIUM;
        }

        // Low severity errors
        if (category === ErrorCategory.VALIDATION) {
            return ErrorSeverity.LOW;
        }

        return ErrorSeverity.MEDIUM;
    }

    /**
     * Check if error is retryable
     */
    private isRetryable(error: Error): boolean {
        const code = this.extractErrorCode(error);
        return this.config.retryableErrors.includes(code);
    }

    /**
     * Get user-friendly error message
     */
    private getUserFriendlyMessage(code: string): string {
        return this.config.userFriendlyMessages[code] || this.config.userFriendlyMessages['UNKNOWN_ERROR'] || 'An unexpected error occurred';
    }

    /**
     * Log error for debugging
     */
    private logError(error: AppError): void {
        this.errorLog.push(error);

        // Keep only last 100 errors to prevent memory issues
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-100);
        }

        console.error('Error logged:', {
            message: error.message,
            code: error.code,
            category: error.category,
            severity: error.severity,
            retryable: error.retryable,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Execute function with retry logic
     */
    public async executeWithRetry<T>(
        fn: () => Promise<T>,
        context?: string
    ): Promise<T> {
        let lastError: AppError | null = null;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                const appError = this.handleError(error as Error, context);
                lastError = appError;

                // Don't retry if error is not retryable
                if (!appError.retryable) {
                    throw appError;
                }

                // Don't retry on last attempt
                if (attempt === this.config.maxRetries) {
                    throw appError;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    this.config.baseDelay * Math.pow(2, attempt),
                    this.config.maxDelay
                );

                console.log(`Retry attempt ${attempt + 1}/${this.config.maxRetries} in ${delay}ms`);
                await this.delay(delay);
            }
        }

        throw lastError!;
    }

    /**
     * Execute function with timeout
     */
    public async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeoutMs: number,
        context?: string
    ): Promise<T> {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new AppError(
                    `Operation timed out after ${timeoutMs}ms`,
                    'TIMEOUT_ERROR',
                    ErrorCategory.TIMEOUT,
                    ErrorSeverity.MEDIUM,
                    undefined,
                    true,
                    'Request timed out. Please try again.'
                ));
            }, timeoutMs);

            try {
                const result = await fn();
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(this.handleError(error as Error, context));
            }
        });
    }

    /**
     * Get error statistics
     */
    public getErrorStats(): {
        totalErrors: number;
        errorsByCategory: { [key: string]: number };
        errorsBySeverity: { [key: string]: number };
        recentErrors: AppError[];
    } {
        const errorsByCategory: { [key: string]: number } = {};
        const errorsBySeverity: { [key: string]: number } = {};

        for (const error of this.errorLog) {
            errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
            errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
        }

        return {
            totalErrors: this.errorLog.length,
            errorsByCategory,
            errorsBySeverity,
            recentErrors: this.errorLog.slice(-10)
        };
    }

    /**
     * Clear error log
     */
    public clearErrorLog(): void {
        this.errorLog = [];
    }

    /**
     * Create a user-friendly error display
     */
    public createErrorDisplay(error: AppError): {
        title: string;
        message: string;
        actions: Array<{ label: string; action: string; primary?: boolean }>;
    } {
        const actions: Array<{ label: string; action: string; primary?: boolean }> = [];

        // Add retry action if retryable
        if (error.retryable) {
            actions.push({ label: 'Retry', action: 'retry', primary: true });
        }

        // Add specific actions based on error category
        switch (error.category) {
            case ErrorCategory.AI_API:
                actions.push({ label: 'Check Settings', action: 'check-settings' });
                break;
            case ErrorCategory.STORAGE:
                actions.push({ label: 'Clear Storage', action: 'clear-storage' });
                break;
            case ErrorCategory.QUOTA:
                actions.push({ label: 'Wait & Retry', action: 'wait-retry' });
                break;
        }

        // Always add help action
        actions.push({ label: 'Get Help', action: 'help' });

        return {
            title: this.getErrorTitle(error),
            message: error.userMessage || error.message,
            actions
        };
    }

    /**
     * Get error title based on severity and category
     */
    private getErrorTitle(error: AppError): string {
        switch (error.severity) {
            case ErrorSeverity.CRITICAL:
                return 'Critical Error';
            case ErrorSeverity.HIGH:
                return 'Error';
            case ErrorSeverity.MEDIUM:
                return 'Warning';
            case ErrorSeverity.LOW:
                return 'Notice';
            default:
                return 'Error';
        }
    }

    /**
     * Utility method to delay execution
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Global error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Utility function to handle errors with retry
 */
export async function handleWithRetry<T>(
    fn: () => Promise<T>,
    context?: string
): Promise<T> {
    return errorHandler.executeWithRetry(fn, context);
}

/**
 * Utility function to handle errors with timeout
 */
export async function handleWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number,
    context?: string
): Promise<T> {
    return errorHandler.executeWithTimeout(fn, timeoutMs, context);
}

/**
 * Utility function to create user-friendly error display
 */
export function createErrorDisplay(error: Error): {
    title: string;
    message: string;
    actions: Array<{ label: string; action: string; primary?: boolean }>;
} {
    const appError = errorHandler.handleError(error);
    return errorHandler.createErrorDisplay(appError);
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        const error = errorHandler.handleError(
            event.reason instanceof Error ? event.reason : new Error(String(event.reason))
        );

        // Show user-friendly error if critical
        if (error.severity === ErrorSeverity.CRITICAL) {
            showCriticalError(error);
        }

        event.preventDefault();
    });

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        const error = errorHandler.handleError(event.error);

        // Show user-friendly error if critical
        if (error.severity === ErrorSeverity.CRITICAL) {
            showCriticalError(error);
        }
    });
}

/**
 * Show critical error to user
 */
function showCriticalError(error: AppError): void {
    const display = errorHandler.createErrorDisplay(error);

    // Create error modal
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.innerHTML = `
        <div class="error-modal-content">
            <h2>${display.title}</h2>
            <p>${display.message}</p>
            <div class="error-actions">
                ${display.actions.map(action =>
        `<button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="handleErrorAction('${action.action}')">
                        ${action.label}
                    </button>`
    ).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

/**
 * Handle error action button clicks
 */
(window as any).handleErrorAction = (action: string) => {
    switch (action) {
        case 'retry':
            // Retry the last operation
            location.reload();
            break;
        case 'check-settings':
            // Open Chrome settings
            chrome.tabs.create({ url: 'chrome://settings/' });
            break;
        case 'clear-storage':
            // Clear extension storage
            chrome.storage.local.clear();
            location.reload();
            break;
        case 'wait-retry':
            // Wait and retry
            setTimeout(() => location.reload(), 5000);
            break;
        case 'help':
            // Open help documentation
            chrome.tabs.create({ url: 'https://github.com/your-repo/llm-shortcuts#troubleshooting' });
            break;
    }
};
