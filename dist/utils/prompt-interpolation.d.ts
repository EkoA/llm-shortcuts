/**
 * Prompt Interpolation Utility
 * Handles replacement of placeholders in prompt templates with user input
 */
/**
 * Error types for prompt interpolation
 */
export declare class PromptInterpolationError extends Error {
    code: string;
    originalError?: Error | undefined;
    constructor(message: string, code: string, originalError?: Error | undefined);
}
/**
 * Input sanitization options
 */
export interface SanitizationOptions {
    maxLength?: number;
    allowHtml?: boolean;
    escapeSpecialChars?: boolean;
}
/**
 * Sanitize user input to prevent prompt injection attacks
 */
export declare function sanitizeInput(input: string, options?: SanitizationOptions): string;
/**
 * Interpolate user input into a prompt template with optional guide prepending
 */
export declare function interpolatePrompt(template: string, userInput: string, options?: SanitizationOptions, guide?: string): string;
/**
 * Interpolate multiple inputs into a prompt template
 */
export declare function interpolateMultipleInputs(template: string, inputs: Record<string, string>, options?: SanitizationOptions): string;
/**
 * Extract placeholder names from a template
 */
export declare function extractPlaceholders(template: string): string[];
/**
 * Validate that all required placeholders are provided
 */
export declare function validatePlaceholders(template: string, providedInputs: string[]): {
    isValid: boolean;
    missing: string[];
    extra: string[];
};
/**
 * Create a preview of the interpolated prompt without executing
 */
export declare function previewInterpolation(template: string, userInput: string, options?: SanitizationOptions): {
    original: string;
    interpolated: string;
    placeholders: string[];
    sanitizedInput: string;
};
//# sourceMappingURL=prompt-interpolation.d.ts.map