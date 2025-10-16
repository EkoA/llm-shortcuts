/**
 * Prompt Interpolation Utility
 * Handles replacement of placeholders in prompt templates with user input
 */

/**
 * Error types for prompt interpolation
 */
export class PromptInterpolationError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'PromptInterpolationError';
    }
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
 * Default sanitization options
 */
const DEFAULT_SANITIZATION_OPTIONS: SanitizationOptions = {
    maxLength: 10000,
    allowHtml: false,
    escapeSpecialChars: true
};

/**
 * Sanitize user input to prevent prompt injection attacks
 */
export function sanitizeInput(
    input: string,
    options: SanitizationOptions = {}
): string {
    const opts = { ...DEFAULT_SANITIZATION_OPTIONS, ...options };
    let sanitized = input;

    // Truncate if too long
    if (sanitized.length > opts.maxLength!) {
        sanitized = sanitized.substring(0, opts.maxLength);
        console.warn(`Input truncated to ${opts.maxLength} characters`);
    }

    // Remove or escape HTML if not allowed
    if (!opts.allowHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }

    // Escape special characters that could be used for prompt injection
    if (opts.escapeSpecialChars) {
        // Escape common prompt injection patterns
        sanitized = sanitized
            .replace(/\\/g, '\\\\')  // Escape backslashes
            .replace(/"/g, '\\"')    // Escape quotes
            .replace(/\n/g, '\\n')   // Escape newlines
            .replace(/\r/g, '\\r')   // Escape carriage returns
            .replace(/\t/g, '\\t');  // Escape tabs
    }

    return sanitized;
}

/**
 * Interpolate user input into a prompt template with optional guide prepending
 */
export function interpolatePrompt(
    template: string,
    userInput: string,
    options: SanitizationOptions = {},
    guide?: string
): string {
    try {
        if (!template || typeof template !== 'string') {
            throw new PromptInterpolationError(
                'Invalid prompt template',
                'INVALID_TEMPLATE'
            );
        }

        if (typeof userInput !== 'string') {
            throw new PromptInterpolationError(
                'User input must be a string',
                'INVALID_INPUT'
            );
        }

        // Sanitize user input
        const sanitizedInput = sanitizeInput(userInput, options);

        // Replace common placeholder patterns
        let interpolated = template
            .replace(/\{user_input\}/g, sanitizedInput)
            .replace(/\{userInput\}/g, sanitizedInput)
            .replace(/\{input\}/g, sanitizedInput)
            .replace(/\{text\}/g, sanitizedInput)
            .replace(/\{content\}/g, sanitizedInput);

        // Check if any placeholders remain (warn user)
        const remainingPlaceholders = interpolated.match(/\{[^}]+\}/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            console.warn('Unreplaced placeholders found:', remainingPlaceholders);
        }

        // CRITICAL: If no placeholders were found and replaced, append the user input
        // This ensures user input is always included even if the template has no placeholders
        if (interpolated === template) {
            // No placeholders were replaced, so append the user input
            interpolated = template + ' ' + sanitizedInput;
        }

        // Prepend guide if provided
        if (guide && guide.trim().length > 0) {
            interpolated = guide.trim() + '\n\n' + interpolated;
        }

        return interpolated;
    } catch (error) {
        if (error instanceof PromptInterpolationError) {
            throw error;
        }
        throw new PromptInterpolationError(
            'Failed to interpolate prompt',
            'INTERPOLATION_FAILED',
            error as Error
        );
    }
}

/**
 * Interpolate multiple inputs into a prompt template
 */
export function interpolateMultipleInputs(
    template: string,
    inputs: Record<string, string>,
    options: SanitizationOptions = {}
): string {
    try {
        if (!template || typeof template !== 'string') {
            throw new PromptInterpolationError(
                'Invalid prompt template',
                'INVALID_TEMPLATE'
            );
        }

        if (!inputs || typeof inputs !== 'object') {
            throw new PromptInterpolationError(
                'Inputs must be an object',
                'INVALID_INPUTS'
            );
        }

        let interpolated = template;

        // Replace each input placeholder
        for (const [key, value] of Object.entries(inputs)) {
            if (typeof value !== 'string') {
                console.warn(`Skipping non-string input for key: ${key}`);
                continue;
            }

            const sanitizedValue = sanitizeInput(value, options);
            const placeholder = `{${key}}`;
            interpolated = interpolated.replace(new RegExp(placeholder, 'g'), sanitizedValue);
        }

        // Check for remaining placeholders
        const remainingPlaceholders = interpolated.match(/\{[^}]+\}/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            console.warn('Unreplaced placeholders found:', remainingPlaceholders);
        }

        return interpolated;
    } catch (error) {
        if (error instanceof PromptInterpolationError) {
            throw error;
        }
        throw new PromptInterpolationError(
            'Failed to interpolate multiple inputs',
            'MULTIPLE_INTERPOLATION_FAILED',
            error as Error
        );
    }
}

/**
 * Extract placeholder names from a template
 */
export function extractPlaceholders(template: string): string[] {
    if (!template || typeof template !== 'string') {
        return [];
    }

    const matches = template.match(/\{([^}]+)\}/g);
    if (!matches) {
        return [];
    }

    return matches.map(match => match.slice(1, -1)); // Remove { and }
}

/**
 * Validate that all required placeholders are provided
 */
export function validatePlaceholders(
    template: string,
    providedInputs: string[]
): { isValid: boolean; missing: string[]; extra: string[] } {
    const requiredPlaceholders = extractPlaceholders(template);
    const missing = requiredPlaceholders.filter(placeholder =>
        !providedInputs.includes(placeholder)
    );
    const extra = providedInputs.filter(input =>
        !requiredPlaceholders.includes(input)
    );

    return {
        isValid: missing.length === 0,
        missing,
        extra
    };
}

/**
 * Create a preview of the interpolated prompt without executing
 */
export function previewInterpolation(
    template: string,
    userInput: string,
    options: SanitizationOptions = {}
): {
    original: string;
    interpolated: string;
    placeholders: string[];
    sanitizedInput: string;
} {
    const placeholders = extractPlaceholders(template);
    const sanitizedInput = sanitizeInput(userInput, options);
    const interpolated = interpolatePrompt(template, userInput, options);

    return {
        original: template,
        interpolated,
        placeholders,
        sanitizedInput
    };
}
