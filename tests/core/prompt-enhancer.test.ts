/**
 * Tests for Prompt Enhancer Service
 */

import { PromptEnhancer } from '../../src/core/prompt-enhancer';

// Mock the AI client
jest.mock('../../src/core/ai-client', () => ({
    getAIClient: jest.fn(() => ({
        isAvailable: jest.fn(() => Promise.resolve(true)),
        initialize: jest.fn(() => Promise.resolve({})),
        executePrompt: jest.fn((prompt: string) => {
            // Mock enhancement based on input
            if (prompt.includes('Make this better')) {
                return Promise.resolve('Please provide more specific instructions and context for better results. Specify the desired output format and any constraints.');
            }
            if (prompt.includes('{user_input}')) {
                return Promise.resolve('Analyze the following text and provide a detailed summary: {user_input}');
            }
            return Promise.resolve('Enhanced: ' + prompt);
        })
    }))
}));

describe('PromptEnhancer', () => {
    let enhancer: PromptEnhancer;

    beforeEach(() => {
        enhancer = PromptEnhancer.getInstance();
    });

    describe('enhancePrompt', () => {
        it('should enhance a simple prompt', async () => {
            const originalPrompt = 'Make this better';
            const result = await enhancer.enhancePrompt(originalPrompt);

            expect(result.success).toBe(true);
            expect(result.originalPrompt).toBe(originalPrompt);
            expect(result.enhancedPrompt).toBeDefined();
            expect(result.enhancedPrompt).not.toBe(originalPrompt);
            expect(result.improvements).toBeDefined();
            expect(Array.isArray(result.improvements)).toBe(true);
        });

        it('should preserve placeholders in enhanced prompts', async () => {
            const originalPrompt = 'Summarize this: {user_input}';
            const result = await enhancer.enhancePrompt(originalPrompt);

            expect(result.success).toBe(true);
            expect(result.enhancedPrompt).toContain('{user_input}');
        });

        it('should handle empty prompts', async () => {
            const result = await enhancer.enhancePrompt('');

            expect(result.success).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('should handle whitespace-only prompts', async () => {
            const result = await enhancer.enhancePrompt('   ');

            expect(result.success).toBe(false);
            expect(result.error).toContain('empty');
        });

        it('should extract improvements correctly', async () => {
            const originalPrompt = 'Make this better';
            const result = await enhancer.enhancePrompt(originalPrompt);

            expect(result.success).toBe(true);
            expect(result.improvements).toBeDefined();
            expect(result.improvements!.length).toBeGreaterThan(0);
        });

        it('should handle enhancement failures gracefully', async () => {
            // Create a new enhancer instance to avoid singleton issues
            const newEnhancer = new (PromptEnhancer as any)();

            // Mock the AI client to throw an error
            const mockAIClient = {
                isAvailable: jest.fn(() => Promise.resolve(true)),
                executePrompt: jest.fn(() => Promise.reject(new Error('AI service unavailable')))
            };

            // Replace the AI client in the enhancer
            (newEnhancer as any).aiClient = mockAIClient;

            const result = await newEnhancer.enhancePrompt('Test prompt');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Failed to initialize AI client');
            expect(result.originalPrompt).toBe('Test prompt');
        });
    });

    describe('extractPlaceholders', () => {
        it('should extract single placeholder', () => {
            const prompt = 'Analyze this: {user_input}';
            const placeholders = (enhancer as any).extractPlaceholders(prompt);

            expect(placeholders).toEqual(['user_input']);
        });

        it('should extract multiple placeholders', () => {
            const prompt = 'Convert {input} to {output} format';
            const placeholders = (enhancer as any).extractPlaceholders(prompt);

            expect(placeholders).toEqual(['input', 'output']);
        });

        it('should handle prompts without placeholders', () => {
            const prompt = 'This is a simple prompt';
            const placeholders = (enhancer as any).extractPlaceholders(prompt);

            expect(placeholders).toEqual([]);
        });
    });

    describe('cleanEnhancedPrompt', () => {
        it('should remove surrounding quotes', () => {
            const enhanced = '"This is an enhanced prompt"';
            const original = 'Original prompt';
            const cleaned = (enhancer as any).cleanEnhancedPrompt(enhanced, original);

            expect(cleaned).toBe('This is an enhanced prompt');
        });

        it('should preserve placeholders', () => {
            const enhanced = '"Analyze this: {user_input}"';
            const original = 'Analyze: {user_input}';
            const cleaned = (enhancer as any).cleanEnhancedPrompt(enhanced, original);

            expect(cleaned).toContain('{user_input}');
        });
    });

    describe('testEnhancement', () => {
        it('should test enhancement functionality', async () => {
            const result = await enhancer.testEnhancement();
            expect(typeof result).toBe('boolean');
        });
    });
});
