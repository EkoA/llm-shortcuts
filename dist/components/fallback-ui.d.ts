/**
 * Fallback UI Component
 * Provides emergency UI for catastrophic failures and recovery options
 */
import { AppError } from '../utils/error-handler';
/**
 * Fallback UI Manager
 * Handles catastrophic failures and provides recovery options
 */
export declare class FallbackUIManager {
    private static instance;
    private state;
    private fallbackContainer;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): FallbackUIManager;
    /**
     * Show fallback UI for catastrophic error
     */
    showFallbackUI(error: AppError): void;
    /**
     * Hide fallback UI
     */
    hideFallbackUI(): void;
    /**
     * Get recovery options based on error type
     */
    private getRecoveryOptions;
    /**
     * Get user actions based on error type
     */
    private getUserActions;
    /**
     * Render fallback UI
     */
    private renderFallbackUI;
    /**
     * Generate fallback HTML
     */
    private generateFallbackHTML;
    /**
     * Attach event listeners to fallback UI
     */
    private attachEventListeners;
    /**
     * Show action error
     */
    private showActionError;
    /**
     * Recovery action implementations
     */
    private reloadExtension;
    private clearStorage;
    private checkAISettings;
    private resetValidation;
    private emergencyReset;
    /**
     * User action implementations
     */
    private showHelp;
    private reportBug;
    private retryOperation;
}
/**
 * Global fallback UI instance
 */
export declare const fallbackUI: FallbackUIManager;
/**
 * Show fallback UI for critical errors
 */
export declare function showCriticalError(error: AppError): void;
/**
 * Hide fallback UI
 */
export declare function hideFallbackUI(): void;
//# sourceMappingURL=fallback-ui.d.ts.map