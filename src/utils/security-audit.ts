/**
 * Security Audit Utilities
 * Provides security validation and vulnerability detection
 */

// Security audit utilities don't need error handler imports

/**
 * Security vulnerability types
 */
export enum SecurityVulnerability {
    PROMPT_INJECTION = 'prompt_injection',
    XSS = 'xss',
    DATA_EXPOSURE = 'data_exposure',
    UNSAFE_EVAL = 'unsafe_eval',
    UNSAFE_INLINE = 'unsafe_inline',
    CSRF = 'csrf',
    CLICKJACKING = 'clickjacking',
    DATA_LEAKAGE = 'data_leakage'
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
export class SecurityAuditManager {
    private static instance: SecurityAuditManager;

    private constructor() { }

    /**
     * Get singleton instance
     */
    public static getInstance(): SecurityAuditManager {
        if (!SecurityAuditManager.instance) {
            SecurityAuditManager.instance = new SecurityAuditManager();
        }
        return SecurityAuditManager.instance;
    }

    /**
     * Perform comprehensive security audit
     */
    public async performSecurityAudit(): Promise<SecurityAuditResult> {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for prompt injection vulnerabilities
        const promptInjectionResult = this.checkPromptInjectionVulnerabilities();
        if (promptInjectionResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...promptInjectionResult.vulnerabilities);
        }
        warnings.push(...promptInjectionResult.warnings);
        recommendations.push(...promptInjectionResult.recommendations);

        // Check for XSS vulnerabilities
        const xssResult = this.checkXSSVulnerabilities();
        if (xssResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...xssResult.vulnerabilities);
        }
        warnings.push(...xssResult.warnings);
        recommendations.push(...xssResult.recommendations);

        // Check for data exposure vulnerabilities
        const dataExposureResult = this.checkDataExposureVulnerabilities();
        if (dataExposureResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...dataExposureResult.vulnerabilities);
        }
        warnings.push(...dataExposureResult.warnings);
        recommendations.push(...dataExposureResult.recommendations);

        // Check for unsafe eval usage
        const unsafeEvalResult = this.checkUnsafeEvalVulnerabilities();
        if (unsafeEvalResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...unsafeEvalResult.vulnerabilities);
        }
        warnings.push(...unsafeEvalResult.warnings);
        recommendations.push(...unsafeEvalResult.recommendations);

        // Check for CSRF vulnerabilities
        const csrfResult = this.checkCSRFVulnerabilities();
        if (csrfResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...csrfResult.vulnerabilities);
        }
        warnings.push(...csrfResult.warnings);
        recommendations.push(...csrfResult.recommendations);

        // Check for clickjacking vulnerabilities
        const clickjackingResult = this.checkClickjackingVulnerabilities();
        if (clickjackingResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...clickjackingResult.vulnerabilities);
        }
        warnings.push(...clickjackingResult.warnings);
        recommendations.push(...clickjackingResult.recommendations);

        // Check for data leakage vulnerabilities
        const dataLeakageResult = this.checkDataLeakageVulnerabilities();
        if (dataLeakageResult.vulnerabilities.length > 0) {
            vulnerabilities.push(...dataLeakageResult.vulnerabilities);
        }
        warnings.push(...dataLeakageResult.warnings);
        recommendations.push(...dataLeakageResult.recommendations);

        return {
            isSecure: vulnerabilities.length === 0,
            vulnerabilities,
            warnings,
            recommendations
        };
    }

    /**
     * Check for prompt injection vulnerabilities
     */
    private checkPromptInjectionVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check if user input is properly sanitized before being used in prompts
        const userInputElements = document.querySelectorAll('input, textarea');
        for (const element of userInputElements) {
            const input = element as HTMLInputElement | HTMLTextAreaElement;
            if (input.value && this.containsPromptInjectionPatterns(input.value)) {
                vulnerabilities.push(SecurityVulnerability.PROMPT_INJECTION);
                warnings.push(`Potential prompt injection detected in ${input.id || input.name || 'input'}`);
            }
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to validate and sanitize all user inputs before prompt interpolation');
        } else {
            recommendations.push('Implement stricter input validation and sanitization');
            recommendations.push('Add prompt injection detection patterns');
            recommendations.push('Use allowlists for valid input patterns');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check for XSS vulnerabilities
     */
    private checkXSSVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for innerHTML usage without sanitization
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || '';
            if (content.includes('innerHTML') && !content.includes('sanitize')) {
                vulnerabilities.push(SecurityVulnerability.XSS);
                warnings.push('Potential XSS vulnerability: innerHTML usage without sanitization');
            }
        }

        // Check for dangerous HTML attributes
        const elementsWithOnClick = document.querySelectorAll('[onclick]');
        if (elementsWithOnClick.length > 0) {
            warnings.push('Elements with onclick attributes found - consider using event listeners instead');
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to sanitize all HTML content before rendering');
            recommendations.push('Use textContent instead of innerHTML when possible');
        } else {
            recommendations.push('Implement HTML sanitization library');
            recommendations.push('Use CSP (Content Security Policy) headers');
            recommendations.push('Replace innerHTML with safer alternatives');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check for data exposure vulnerabilities
     */
    private checkDataExposureVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for sensitive data in console logs
        const consoleLogs = this.getConsoleLogs();
        for (const log of consoleLogs) {
            if (this.containsSensitiveData(log)) {
                vulnerabilities.push(SecurityVulnerability.DATA_EXPOSURE);
                warnings.push('Sensitive data found in console logs');
            }
        }

        // Check for sensitive data in localStorage
        const localStorageData = this.getLocalStorageData();
        for (const [key, value] of Object.entries(localStorageData)) {
            if (this.containsSensitiveData(value)) {
                warnings.push(`Sensitive data found in localStorage: ${key}`);
            }
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to avoid logging sensitive data');
            recommendations.push('Implement data classification and handling policies');
        } else {
            recommendations.push('Remove sensitive data from console logs');
            recommendations.push('Implement data masking for sensitive information');
            recommendations.push('Use secure storage for sensitive data');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check for unsafe eval usage
     */
    private checkUnsafeEvalVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for eval usage in the codebase
        const scripts = document.querySelectorAll('script');
        for (const script of scripts) {
            const content = script.textContent || '';
            if (content.includes('eval(') || content.includes('Function(')) {
                vulnerabilities.push(SecurityVulnerability.UNSAFE_EVAL);
                warnings.push('Unsafe eval usage detected');
            }
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to avoid eval and Function constructor');
        } else {
            recommendations.push('Replace eval usage with safer alternatives');
            recommendations.push('Implement CSP to prevent eval usage');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check for CSRF vulnerabilities
     */
    private checkCSRFVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for forms without CSRF protection
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const csrfToken = form.querySelector('input[name*="csrf"], input[name*="token"]');
            if (!csrfToken) {
                warnings.push('Form without CSRF protection found');
            }
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to implement CSRF protection for all forms');
        } else {
            recommendations.push('Implement CSRF tokens for all forms');
            recommendations.push('Use SameSite cookies');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check for clickjacking vulnerabilities
     */
    private checkClickjackingVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for X-Frame-Options header
        const metaTags = document.querySelectorAll('meta[http-equiv="X-Frame-Options"]');
        if (metaTags.length === 0) {
            warnings.push('X-Frame-Options header not found - potential clickjacking vulnerability');
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to implement X-Frame-Options header');
            recommendations.push('Consider using CSP frame-ancestors directive');
        } else {
            recommendations.push('Implement X-Frame-Options: DENY or SAMEORIGIN');
            recommendations.push('Use CSP frame-ancestors directive');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check for data leakage vulnerabilities
     */
    private checkDataLeakageVulnerabilities(): SecurityAuditResult {
        const vulnerabilities: SecurityVulnerability[] = [];
        const warnings: string[] = [];
        const recommendations: string[] = [];

        // Check for data in URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams) {
            if (this.containsSensitiveData(value)) {
                warnings.push(`Sensitive data found in URL parameter: ${key}`);
            }
        }

        // Check for data in referrer
        if (document.referrer && this.containsSensitiveData(document.referrer)) {
            warnings.push('Sensitive data found in referrer');
        }

        if (vulnerabilities.length === 0) {
            recommendations.push('Continue to avoid sensitive data in URLs');
            recommendations.push('Implement proper data handling policies');
        } else {
            recommendations.push('Remove sensitive data from URLs');
            recommendations.push('Use POST requests for sensitive data');
            recommendations.push('Implement proper data encryption');
        }

        return { isSecure: vulnerabilities.length === 0, vulnerabilities, warnings, recommendations };
    }

    /**
     * Check if text contains prompt injection patterns
     */
    private containsPromptInjectionPatterns(text: string): boolean {
        const injectionPatterns = [
            /ignore\s+previous\s+instructions/gi,
            /forget\s+everything/gi,
            /you\s+are\s+now/gi,
            /system\s+prompt/gi,
            /act\s+as\s+if/gi,
            /pretend\s+to\s+be/gi,
            /roleplay/gi,
            /jailbreak/gi
        ];

        return injectionPatterns.some(pattern => pattern.test(text));
    }

    /**
     * Check if text contains sensitive data
     */
    private containsSensitiveData(text: string): boolean {
        const sensitivePatterns = [
            /password/gi,
            /secret/gi,
            /token/gi,
            /key/gi,
            /api[_-]?key/gi,
            /private[_-]?key/gi,
            /access[_-]?token/gi,
            /bearer[_-]?token/gi,
            /session[_-]?id/gi,
            /cookie/gi,
            /credit[_-]?card/gi,
            /ssn/gi,
            /social[_-]?security/gi
        ];

        return sensitivePatterns.some(pattern => pattern.test(text));
    }

    /**
     * Get console logs (simplified - in real implementation, this would be more complex)
     */
    private getConsoleLogs(): string[] {
        // This is a simplified implementation
        // In a real scenario, you'd need to capture console logs
        return [];
    }

    /**
     * Get localStorage data
     */
    private getLocalStorageData(): { [key: string]: string } {
        const data: { [key: string]: string } = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
                data[key] = localStorage.getItem(key) || '';
            }
        }
        return data;
    }

    /**
     * Generate security report
     */
    public generateSecurityReport(auditResult: SecurityAuditResult): string {
        let report = '# Security Audit Report\n\n';

        report += `**Overall Security Status:** ${auditResult.isSecure ? '✅ Secure' : '❌ Vulnerabilities Found'}\n\n`;

        if (auditResult.vulnerabilities.length > 0) {
            report += '## 🚨 Critical Vulnerabilities\n\n';
            auditResult.vulnerabilities.forEach(vuln => {
                report += `- ${vuln}\n`;
            });
            report += '\n';
        }

        if (auditResult.warnings.length > 0) {
            report += '## ⚠️ Warnings\n\n';
            auditResult.warnings.forEach(warning => {
                report += `- ${warning}\n`;
            });
            report += '\n';
        }

        if (auditResult.recommendations.length > 0) {
            report += '## 💡 Recommendations\n\n';
            auditResult.recommendations.forEach(rec => {
                report += `- ${rec}\n`;
            });
            report += '\n';
        }

        return report;
    }
}

/**
 * Global security audit manager
 */
export const securityAudit = SecurityAuditManager.getInstance();

/**
 * Perform security audit and return results
 */
export async function performSecurityAudit(): Promise<SecurityAuditResult> {
    return securityAudit.performSecurityAudit();
}

/**
 * Generate security report
 */
export function generateSecurityReport(auditResult: SecurityAuditResult): string {
    return securityAudit.generateSecurityReport(auditResult);
}
