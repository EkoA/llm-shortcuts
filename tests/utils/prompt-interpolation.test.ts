/**
 * Unit tests for prompt interpolation utility
 * Tests Phase 4 requirement: Prompt interpolation with sanitization
 */

import {
    interpolatePrompt,
    interpolateMultipleInputs,
    sanitizeInput,
    extractPlaceholders,
    validatePlaceholders,
    previewInterpolation,
    PromptInterpolationError
} from '../../src/utils/prompt-interpolation';

describe('Prompt Interpolation', () => {
    describe('sanitizeInput', () => {
        it('should sanitize HTML tags', () => {
            const input = 'Hello <script>alert("XSS")</script> World';
            const sanitized = sanitizeInput(input);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('</script>');
        });

        it('should truncate long inputs', () => {
            const longInput = 'a'.repeat(15000);
            const sanitized = sanitizeInput(longInput, { maxLength: 10000 });
            expect(sanitized.length).toBe(10000);
        });

        it('should escape special characters when enabled', () => {
            const input = 'Line 1\nLine 2\tTab\r"Quote"';
            const sanitized = sanitizeInput(input, { escapeSpecialChars: true });
            expect(sanitized).toContain('\\n');
            expect(sanitized).toContain('\\t');
            expect(sanitized).toContain('\\r');
            expect(sanitized).toContain('\\"');
        });

        it('should not escape special characters when disabled', () => {
            const input = 'Line 1\nLine 2';
            const sanitized = sanitizeInput(input, { escapeSpecialChars: false });
            expect(sanitized).toBe(input);
        });
    });

    describe('interpolatePrompt', () => {
        it('should replace {user_input} placeholder', () => {
            const template = 'Summarize this: {user_input}';
            const userInput = 'Test content';
            const result = interpolatePrompt(template, userInput, { escapeSpecialChars: false });
            expect(result).toBe('Summarize this: Test content');
        });

        it('should replace multiple placeholder formats', () => {
            const template = '{user_input} {userInput} {input} {text} {content}';
            const userInput = 'X';
            const result = interpolatePrompt(template, userInput, { escapeSpecialChars: false });
            expect(result).toBe('X X X X X');
        });

        it('should sanitize user input by default', () => {
            const template = 'Process: {user_input}';
            const userInput = '<script>alert("XSS")</script>';
            const result = interpolatePrompt(template, userInput);
            expect(result).not.toContain('<script>');
        });

        it('should throw error for invalid template', () => {
            expect(() => interpolatePrompt('', 'input', { escapeSpecialChars: false })).toThrow(PromptInterpolationError);
            expect(() => interpolatePrompt(null as any, 'input', { escapeSpecialChars: false })).toThrow(PromptInterpolationError);
        });

        it('should throw error for invalid input', () => {
            expect(() => interpolatePrompt('template', null as any, { escapeSpecialChars: false })).toThrow(PromptInterpolationError);
            expect(() => interpolatePrompt('template', 123 as any, { escapeSpecialChars: false })).toThrow(PromptInterpolationError);
        });

        it('should warn about unreplaced placeholders', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const template = 'Test {unknown_placeholder}';
            interpolatePrompt(template, 'input', { escapeSpecialChars: false });
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Unreplaced placeholders found:',
                ['{unknown_placeholder}']
            );
            consoleWarnSpy.mockRestore();
        });
    });

    describe('interpolateMultipleInputs', () => {
        it('should replace multiple named placeholders', () => {
            const template = 'Name: {name}, Email: {email}';
            const inputs = {
                name: 'John Doe',
                email: 'john@example.com'
            };
            const result = interpolateMultipleInputs(template, inputs, { escapeSpecialChars: false });
            expect(result).toBe('Name: John Doe, Email: john@example.com');
        });

        it('should sanitize all inputs', () => {
            const template = '{input1} {input2}';
            const inputs = {
                input1: '<script>XSS</script>',
                input2: 'Safe text'
            };
            const result = interpolateMultipleInputs(template, inputs);
            expect(result).not.toContain('<script>');
        });

        it('should skip non-string inputs', () => {
            const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
            const template = '{valid} {invalid}';
            const inputs = {
                valid: 'text',
                invalid: 123 as any
            };
            interpolateMultipleInputs(template, inputs, { escapeSpecialChars: false });
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                'Skipping non-string input for key: invalid'
            );
            consoleWarnSpy.mockRestore();
        });

        it('should throw error for invalid inputs', () => {
            expect(() => interpolateMultipleInputs('template', null as any)).toThrow(PromptInterpolationError);
            expect(() => interpolateMultipleInputs('template', 'string' as any)).toThrow(PromptInterpolationError);
        });
    });

    describe('extractPlaceholders', () => {
        it('should extract placeholder names', () => {
            const template = 'Hello {name}, your email is {email}';
            const placeholders = extractPlaceholders(template);
            expect(placeholders).toEqual(['name', 'email']);
        });

        it('should handle templates with no placeholders', () => {
            const template = 'No placeholders here';
            const placeholders = extractPlaceholders(template);
            expect(placeholders).toEqual([]);
        });

        it('should handle duplicate placeholders', () => {
            const template = '{user} says hello to {user}';
            const placeholders = extractPlaceholders(template);
            expect(placeholders).toEqual(['user', 'user']);
        });

        it('should return empty array for invalid input', () => {
            expect(extractPlaceholders('')).toEqual([]);
            expect(extractPlaceholders(null as any)).toEqual([]);
        });
    });

    describe('validatePlaceholders', () => {
        it('should validate all placeholders are provided', () => {
            const template = 'Name: {name}, Email: {email}';
            const provided = ['name', 'email'];
            const validation = validatePlaceholders(template, provided);
            expect(validation.isValid).toBe(true);
            expect(validation.missing).toEqual([]);
            expect(validation.extra).toEqual([]);
        });

        it('should detect missing placeholders', () => {
            const template = 'Name: {name}, Email: {email}';
            const provided = ['name'];
            const validation = validatePlaceholders(template, provided);
            expect(validation.isValid).toBe(false);
            expect(validation.missing).toEqual(['email']);
        });

        it('should detect extra inputs', () => {
            const template = 'Name: {name}';
            const provided = ['name', 'email', 'phone'];
            const validation = validatePlaceholders(template, provided);
            expect(validation.isValid).toBe(true);
            expect(validation.extra).toEqual(['email', 'phone']);
        });
    });

    describe('previewInterpolation', () => {
        it('should return preview data', () => {
            const template = 'Summarize: {user_input}';
            const userInput = 'Test content';
            const preview = previewInterpolation(template, userInput, { escapeSpecialChars: false });

            expect(preview.original).toBe(template);
            expect(preview.interpolated).toBe('Summarize: Test content');
            expect(preview.placeholders).toContain('user_input');
            expect(preview.sanitizedInput).toBe('Test content');
        });

        it('should include sanitized input', () => {
            const template = '{user_input}';
            const userInput = '<script>XSS</script>';
            const preview = previewInterpolation(template, userInput);

            expect(preview.sanitizedInput).not.toContain('<script>');
            expect(preview.interpolated).not.toContain('<script>');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty user input', () => {
            const template = 'Text: {user_input}';
            const result = interpolatePrompt(template, '', { escapeSpecialChars: false });
            expect(result).toBe('Text: ');
        });

        it('should handle template with only placeholders', () => {
            const template = '{user_input}';
            const result = interpolatePrompt(template, 'content', { escapeSpecialChars: false });
            expect(result).toBe('content');
        });

        it('should handle nested braces', () => {
            const template = 'Code: {user_input}';
            const userInput = 'function() { return {}; }';
            const result = interpolatePrompt(template, userInput, { escapeSpecialChars: false });
            expect(result).toContain('function() { return {}; }');
        });

        it('should handle unicode characters', () => {
            const template = '{user_input}';
            const userInput = '你好 🌍 مرحبا';
            const result = interpolatePrompt(template, userInput, { escapeSpecialChars: false });
            expect(result).toBe(userInput);
        });
    });
});

