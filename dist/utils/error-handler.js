/**
 * Comprehensive Error Handling Utilities
 * Provides centralized error handling, retry logic, and user-friendly error messages
 */
/**
 * Error severity levels
 */
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (ErrorSeverity = {}));
/**
 * Error categories for better error handling
 */
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AI_API"] = "ai_api";
    ErrorCategory["STORAGE"] = "storage";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["PERMISSION"] = "permission";
    ErrorCategory["QUOTA"] = "quota";
    ErrorCategory["TIMEOUT"] = "timeout";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (ErrorCategory = {}));
/**
 * Enhanced error class with additional metadata
 */
export class AppError extends Error {
    constructor(message, code, category, severity, originalError, retryable = false, userMessage) {
        super(message);
        this.code = code;
        this.category = category;
        this.severity = severity;
        this.originalError = originalError;
        this.retryable = retryable;
        this.userMessage = userMessage;
        this.name = 'AppError';
    }
}
/**
 * Default error handling configuration
 */
const DEFAULT_CONFIG = {
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
    constructor(config = {}) {
        this.errorLog = [];
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Get singleton instance
     */
    static getInstance(config) {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler(config);
        }
        return ErrorHandler.instance;
    }
    /**
     * Handle an error with appropriate categorization and user message
     */
    handleError(error, _context) {
        const appError = this.categorizeError(error, _context);
        this.logError(appError);
        return appError;
    }
    /**
     * Categorize error and determine severity
     */
    categorizeError(error, _context) {
        const message = error.message;
        const code = this.extractErrorCode(error);
        const category = this.determineCategory(error);
        const severity = this.determineSeverity(error, category);
        const retryable = this.isRetryable(error);
        const userMessage = this.getUserFriendlyMessage(code);
        return new AppError(message, code, category, severity, error, retryable, userMessage);
    }
    /**
     * Extract error code from error
     */
    extractErrorCode(error) {
        if ('code' in error) {
            return error.code;
        }
        // Extract from message patterns
        if (error.message.includes('not available'))
            return 'API_NOT_AVAILABLE';
        if (error.message.includes('quota'))
            return 'QUOTA_EXCEEDED';
        if (error.message.includes('timeout'))
            return 'TIMEOUT_ERROR';
        if (error.message.includes('network'))
            return 'NETWORK_ERROR';
        if (error.message.includes('permission'))
            return 'PERMISSION_DENIED';
        if (error.message.includes('validation'))
            return 'VALIDATION_ERROR';
        return 'UNKNOWN_ERROR';
    }
    /**
     * Determine error category
     */
    determineCategory(error) {
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
    determineSeverity(error, category) {
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
    isRetryable(error) {
        const code = this.extractErrorCode(error);
        return this.config.retryableErrors.includes(code);
    }
    /**
     * Get user-friendly error message
     */
    getUserFriendlyMessage(code) {
        return this.config.userFriendlyMessages[code] || this.config.userFriendlyMessages['UNKNOWN_ERROR'] || 'An unexpected error occurred';
    }
    /**
     * Log error for debugging
     */
    logError(error) {
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
    async executeWithRetry(fn, context) {
        let lastError = null;
        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            try {
                return await fn();
            }
            catch (error) {
                const appError = this.handleError(error, context);
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
                const delay = Math.min(this.config.baseDelay * Math.pow(2, attempt), this.config.maxDelay);
                console.log(`Retry attempt ${attempt + 1}/${this.config.maxRetries} in ${delay}ms`);
                await this.delay(delay);
            }
        }
        throw lastError;
    }
    /**
     * Execute function with timeout
     */
    async executeWithTimeout(fn, timeoutMs, context) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new AppError(`Operation timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', ErrorCategory.TIMEOUT, ErrorSeverity.MEDIUM, undefined, true, 'Request timed out. Please try again.'));
            }, timeoutMs);
            try {
                const result = await fn();
                clearTimeout(timeoutId);
                resolve(result);
            }
            catch (error) {
                clearTimeout(timeoutId);
                reject(this.handleError(error, context));
            }
        });
    }
    /**
     * Get error statistics
     */
    getErrorStats() {
        const errorsByCategory = {};
        const errorsBySeverity = {};
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
    clearErrorLog() {
        this.errorLog = [];
    }
    /**
     * Create a user-friendly error display
     */
    createErrorDisplay(error) {
        const actions = [];
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
    getErrorTitle(error) {
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
    delay(ms) {
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
export async function handleWithRetry(fn, context) {
    return errorHandler.executeWithRetry(fn, context);
}
/**
 * Utility function to handle errors with timeout
 */
export async function handleWithTimeout(fn, timeoutMs, context) {
    return errorHandler.executeWithTimeout(fn, timeoutMs, context);
}
/**
 * Utility function to create user-friendly error display
 */
export function createErrorDisplay(error) {
    const appError = errorHandler.handleError(error);
    return errorHandler.createErrorDisplay(appError);
}
/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        const error = errorHandler.handleError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
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
function showCriticalError(error) {
    const display = errorHandler.createErrorDisplay(error);
    // Create error modal
    const modal = document.createElement('div');
    modal.className = 'error-modal';
    modal.innerHTML = `
        <div class="error-modal-content">
            <h2>${display.title}</h2>
            <p>${display.message}</p>
            <div class="error-actions">
                ${display.actions.map(action => `<button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="handleErrorAction('${action.action}')">
                        ${action.label}
                    </button>`).join('')}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
/**
 * Handle error action button clicks
 */
window.handleErrorAction = (action) => {
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
//# sourceMappingURL=error-handler.js.map