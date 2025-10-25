/**
 * Security Audit Utilities
 * Provides security validation and vulnerability detection
 */
/**
 * Security vulnerability types
 */
export declare enum SecurityVulnerability {
    PROMPT_INJECTION = "prompt_injection",
    XSS = "xss",
    DATA_EXPOSURE = "data_exposure",
    UNSAFE_EVAL = "unsafe_eval",
    UNSAFE_INLINE = "unsafe_inline",
    CSRF = "csrf",
    CLICKJACKING = "clickjacking",
    DATA_LEAKAGE = "data_leakage"
}
/**
 * Security audit result
 */
export interface SecurityAuditResult {
    isSecure: boolean;
    vulnerabilities: SecurityVulnerability[];
    warnings: string[];
    recommendations: string[];
}
/**
 * Security Audit Manager
 * Performs comprehensive security audits of the application
 */
export declare class SecurityAuditManager {
    private static instance;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): SecurityAuditManager;
    /**
     * Perform comprehensive security audit
     */
    performSecurityAudit(): Promise<SecurityAuditResult>;
    /**
     * Check for prompt injection vulnerabilities
     */
    private checkPromptInjectionVulnerabilities;
    /**
     * Check for XSS vulnerabilities
     */
    private checkXSSVulnerabilities;
    /**
     * Check for data exposure vulnerabilities
     */
    private checkDataExposureVulnerabilities;
    /**
     * Check for unsafe eval usage
     */
    private checkUnsafeEvalVulnerabilities;
    /**
     * Check for CSRF vulnerabilities
     */
    private checkCSRFVulnerabilities;
    /**
     * Check for clickjacking vulnerabilities
     */
    private checkClickjackingVulnerabilities;
    /**
     * Check for data leakage vulnerabilities
     */
    private checkDataLeakageVulnerabilities;
    /**
     * Check if text contains prompt injection patterns
     */
    private containsPromptInjectionPatterns;
    /**
     * Check if text contains sensitive data
     */
    private containsSensitiveData;
    /**
     * Get console logs (simplified - in real implementation, this would be more complex)
     */
    private getConsoleLogs;
    /**
     * Get localStorage data
     */
    private getLocalStorageData;
    /**
     * Generate security report
     */
    generateSecurityReport(auditResult: SecurityAuditResult): string;
}
/**
 * Global security audit manager
 */
export declare const securityAudit: SecurityAuditManager;
/**
 * Perform security audit and return results
 */
export declare function performSecurityAudit(): Promise<SecurityAuditResult>;
/**
 * Generate security report
 */
export declare function generateSecurityReport(auditResult: SecurityAuditResult): string;
//# sourceMappingURL=security-audit.d.ts.map