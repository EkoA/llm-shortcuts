/**
 * Fallback UI Component
 * Provides emergency UI for catastrophic failures and recovery options
 */

import { AppError, ErrorSeverity, createErrorDisplay } from '../utils/error-handler';

/**
 * Fallback UI state
 */
interface FallbackUIState {
    isActive: boolean;
    error: AppError | null;
    recoveryOptions: RecoveryOption[];
    userActions: UserAction[];
}

/**
 * Recovery option interface
 */
interface RecoveryOption {
    id: string;
    label: string;
    description: string;
    action: () => Promise<void>;
    destructive?: boolean;
}

/**
 * User action interface
 */
interface UserAction {
    id: string;
    label: string;
    action: () => void;
    primary?: boolean;
}

/**
 * Fallback UI Manager
 * Handles catastrophic failures and provides recovery options
 */
export class FallbackUIManager {
    private static instance: FallbackUIManager;
    private state: FallbackUIState;
    private fallbackContainer: HTMLElement | null = null;

    private constructor() {
        this.state = {
            isActive: false,
            error: null,
            recoveryOptions: [],
            userActions: []
        };
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): FallbackUIManager {
        if (!FallbackUIManager.instance) {
            FallbackUIManager.instance = new FallbackUIManager();
        }
        return FallbackUIManager.instance;
    }

    /**
     * Show fallback UI for catastrophic error
     */
    public showFallbackUI(error: AppError): void {
        console.error('Showing fallback UI for catastrophic error:', error);

        this.state.isActive = true;
        this.state.error = error;
        this.state.recoveryOptions = this.getRecoveryOptions(error);
        this.state.userActions = this.getUserActions(error);

        this.renderFallbackUI();
    }

    /**
     * Hide fallback UI
     */
    public hideFallbackUI(): void {
        this.state.isActive = false;
        this.state.error = null;
        this.state.recoveryOptions = [];
        this.state.userActions = [];

        if (this.fallbackContainer) {
            this.fallbackContainer.remove();
            this.fallbackContainer = null;
        }
    }

    /**
     * Get recovery options based on error type
     */
    private getRecoveryOptions(error: AppError): RecoveryOption[] {
        const options: RecoveryOption[] = [];

        // Always include basic recovery options
        options.push({
            id: 'reload',
            label: 'Reload Extension',
            description: 'Reload the extension to reset all state',
            action: async () => {
                try {
                    await this.reloadExtension();
                } catch (reloadError) {
                    console.error('Failed to reload extension:', reloadError);
                }
            }
        });

        // Add specific recovery options based on error category
        switch (error.category) {
            case 'storage':
                options.push({
                    id: 'clear-storage',
                    label: 'Clear Storage',
                    description: 'Clear all stored data and start fresh',
                    action: async () => {
                        try {
                            await this.clearStorage();
                        } catch (clearError) {
                            console.error('Failed to clear storage:', clearError);
                        }
                    },
                    destructive: true
                });
                break;

            case 'ai_api':
                options.push({
                    id: 'check-ai-settings',
                    label: 'Check AI Settings',
                    description: 'Verify Chrome AI settings and flags',
                    action: async () => {
                        try {
                            await this.checkAISettings();
                        } catch (checkError) {
                            console.error('Failed to check AI settings:', checkError);
                        }
                    }
                });
                break;

            case 'validation':
                options.push({
                    id: 'reset-validation',
                    label: 'Reset Validation',
                    description: 'Reset validation rules to defaults',
                    action: async () => {
                        try {
                            await this.resetValidation();
                        } catch (resetError) {
                            console.error('Failed to reset validation:', resetError);
                        }
                    }
                });
                break;
        }

        // Add emergency recovery for critical errors
        if (error.severity === ErrorSeverity.CRITICAL) {
            options.push({
                id: 'emergency-reset',
                label: 'Emergency Reset',
                description: 'Reset everything to factory defaults',
                action: async () => {
                    try {
                        await this.emergencyReset();
                    } catch (resetError) {
                        console.error('Failed to perform emergency reset:', resetError);
                    }
                },
                destructive: true
            });
        }

        return options;
    }

    /**
     * Get user actions based on error type
     */
    private getUserActions(error: AppError): UserAction[] {
        const actions: UserAction[] = [];

        // Always include help action
        actions.push({
            id: 'help',
            label: 'Get Help',
            action: () => this.showHelp(),
            primary: false
        });

        // Add specific actions based on error severity
        if (error.severity === ErrorSeverity.CRITICAL) {
            actions.push({
                id: 'report-bug',
                label: 'Report Bug',
                action: () => this.reportBug(error),
                primary: true
            });
        }

        // Add retry action for retryable errors
        if (error.retryable) {
            actions.push({
                id: 'retry',
                label: 'Retry',
                action: () => this.retryOperation(),
                primary: true
            });
        }

        return actions;
    }

    /**
     * Render fallback UI
     */
    private renderFallbackUI(): void {
        // Remove existing fallback UI if present
        if (this.fallbackContainer) {
            this.fallbackContainer.remove();
        }

        // Create fallback container
        this.fallbackContainer = document.createElement('div');
        this.fallbackContainer.className = 'fallback-ui';
        this.fallbackContainer.innerHTML = this.generateFallbackHTML();

        // Add to document
        document.body.appendChild(this.fallbackContainer);

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * Generate fallback HTML
     */
    private generateFallbackHTML(): string {
        const error = this.state.error!;
        const display = createErrorDisplay(error);

        return `
            <div class="fallback-overlay">
                <div class="fallback-content">
                    <div class="fallback-header">
                        <h1>🚨 Critical Error</h1>
                        <p class="fallback-subtitle">The extension encountered a critical error and needs your attention.</p>
                    </div>

                    <div class="fallback-error">
                        <h2>${display.title}</h2>
                        <p>${display.message}</p>
                        ${error.originalError ? `<details><summary>Technical Details</summary><pre>${error.originalError.message}</pre></details>` : ''}
                    </div>

                    <div class="fallback-recovery">
                        <h3>Recovery Options</h3>
                        <div class="recovery-options">
                            ${this.state.recoveryOptions.map(option => `
                                <div class="recovery-option ${option.destructive ? 'destructive' : ''}">
                                    <h4>${option.label}</h4>
                                    <p>${option.description}</p>
                                    <button class="btn ${option.destructive ? 'btn-danger' : 'btn-primary'}" 
                                            data-action="recovery" 
                                            data-option-id="${option.id}">
                                        ${option.label}
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="fallback-actions">
                        <h3>Actions</h3>
                        <div class="action-buttons">
                            ${this.state.userActions.map(action => `
                                <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'}" 
                                        data-action="user" 
                                        data-action-id="${action.id}">
                                    ${action.label}
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="fallback-footer">
                        <p><small>If this problem persists, please report it to our support team.</small></p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners to fallback UI
     */
    private attachEventListeners(): void {
        if (!this.fallbackContainer) return;

        // Recovery option buttons
        this.fallbackContainer.querySelectorAll('[data-action="recovery"]').forEach(button => {
            button.addEventListener('click', async (event) => {
                const target = event.target as HTMLElement;
                const optionId = target.getAttribute('data-option-id');
                const option = this.state.recoveryOptions.find(opt => opt.id === optionId);

                if (option) {
                    try {
                        await option.action();
                        this.hideFallbackUI();
                    } catch (actionError) {
                        console.error('Recovery action failed:', actionError);
                        this.showActionError(actionError);
                    }
                }
            });
        });

        // User action buttons
        this.fallbackContainer.querySelectorAll('[data-action="user"]').forEach(button => {
            button.addEventListener('click', (event) => {
                const target = event.target as HTMLElement;
                const actionId = target.getAttribute('data-action-id');
                const action = this.state.userActions.find(act => act.id === actionId);

                if (action) {
                    try {
                        action.action();
                    } catch (actionError) {
                        console.error('User action failed:', actionError);
                        this.showActionError(actionError);
                    }
                }
            });
        });
    }

    /**
     * Show action error
     */
    private showActionError(error: any): void {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Action failed: ${errorMessage}`);
    }

    /**
     * Recovery action implementations
     */
    private async reloadExtension(): Promise<void> {
        // Reload the current page/extension
        window.location.reload();
    }

    private async clearStorage(): Promise<void> {
        // Clear Chrome storage
        if (chrome && chrome.storage) {
            await chrome.storage.local.clear();
        }

        // Clear any local storage
        localStorage.clear();
        sessionStorage.clear();

        // Reload after clearing
        window.location.reload();
    }

    private async checkAISettings(): Promise<void> {
        // Open Chrome settings for AI
        if (chrome && chrome.tabs) {
            await chrome.tabs.create({ url: 'chrome://settings/' });
        }
    }

    private async resetValidation(): Promise<void> {
        // Reset validation rules (implementation depends on your validation system)
        console.log('Resetting validation rules...');
        // Add specific validation reset logic here
    }

    private async emergencyReset(): Promise<void> {
        // Perform complete reset
        await this.clearStorage();

        // Reset any other state
        // Add specific emergency reset logic here

        // Reload
        window.location.reload();
    }

    /**
     * User action implementations
     */
    private showHelp(): void {
        // Open help documentation
        if (chrome && chrome.tabs) {
            chrome.tabs.create({
                url: 'https://github.com/your-repo/llm-shortcuts#troubleshooting'
            });
        }
    }

    private reportBug(error: AppError): void {
        // Create bug report
        const bugReport = {
            error: {
                message: error.message,
                code: error.code,
                category: error.category,
                severity: error.severity
            },
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            extensionVersion: chrome.runtime.getManifest().version
        };

        // Open GitHub issues with pre-filled bug report
        const issueUrl = `https://github.com/your-repo/llm-shortcuts/issues/new?title=Bug Report&body=${encodeURIComponent(JSON.stringify(bugReport, null, 2))}`;

        if (chrome && chrome.tabs) {
            chrome.tabs.create({ url: issueUrl });
        }
    }

    private retryOperation(): void {
        // Hide fallback UI and retry
        this.hideFallbackUI();

        // Trigger a retry of the last operation
        // This would need to be implemented based on your specific retry logic
        window.dispatchEvent(new CustomEvent('retry-operation'));
    }
}

/**
 * Global fallback UI instance
 */
export const fallbackUI = FallbackUIManager.getInstance();

/**
 * Show fallback UI for critical errors
 */
export function showCriticalError(error: AppError): void {
    fallbackUI.showFallbackUI(error);
}

/**
 * Hide fallback UI
 */
export function hideFallbackUI(): void {
    fallbackUI.hideFallbackUI();
}
