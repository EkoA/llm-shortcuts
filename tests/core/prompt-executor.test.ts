/**
 * Unit tests for Prompt Executor
 * Tests Phase 4 requirement: Recipe execution with streaming and error handling
 */

import { PromptExecutor, PromptExecutorError, ExecutionOptions } from '../../src/core/prompt-executor';
import { Recipe } from '../../src/models/recipe.model';

// Mock AIClient
jest.mock('../../src/core/ai-client', () => {
    const mockExecutePrompt = jest.fn();
    const mockExecutePromptStreaming = jest.fn();
    const mockIsAvailable = jest.fn();
    const mockTestConnection = jest.fn();

    return {
        AIClient: {
            getInstance: jest.fn(() => ({
                isAvailable: mockIsAvailable,
                executePrompt: mockExecutePrompt,
                executePromptStreaming: mockExecutePromptStreaming,
                testConnection: mockTestConnection
            }))
        },
        // Export mock functions for test access
        __mockExecutePrompt: mockExecutePrompt,
        __mockExecutePromptStreaming: mockExecutePromptStreaming,
        __mockIsAvailable: mockIsAvailable,
        __mockTestConnection: mockTestConnection
    };
});

describe('PromptExecutor', () => {
    let promptExecutor: PromptExecutor;
    let mockExecutePrompt: jest.Mock;
    let mockExecutePromptStreaming: jest.Mock;
    let mockIsAvailable: jest.Mock;
    let mockTestConnection: jest.Mock;

    // Sample recipe for testing
    const sampleRecipe: Recipe = {
        id: 'test-recipe-1',
        name: 'Test Recipe',
        description: 'A test recipe',
        prompt: 'Summarize this: {user_input}',
        originalPrompt: 'Summarize this: {user_input}',
        inputType: 'text',
        tags: [],
        pinned: false,
        createdAt: Date.now(),
        lastUsedAt: null
    };

    beforeEach(() => {
        // Get mock functions from the mocked module
        const aiClientModule = require('../../src/core/ai-client');
        mockExecutePrompt = aiClientModule.__mockExecutePrompt;
        mockExecutePromptStreaming = aiClientModule.__mockExecutePromptStreaming;
        mockIsAvailable = aiClientModule.__mockIsAvailable;
        mockTestConnection = aiClientModule.__mockTestConnection;

        // Reset all mocks
        mockExecutePrompt.mockReset();
        mockExecutePromptStreaming.mockReset();
        mockIsAvailable.mockReset();
        mockTestConnection.mockReset();

        // Set default mock implementations
        mockIsAvailable.mockResolvedValue(true);
        mockExecutePrompt.mockResolvedValue('Mocked AI response');
        mockTestConnection.mockResolvedValue({ available: true, capabilities: {} });

        // Reset singleton instance
        (PromptExecutor as any).instance = undefined;
        promptExecutor = PromptExecutor.getInstance();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = PromptExecutor.getInstance();
            const instance2 = PromptExecutor.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('executeRecipe', () => {
        it('should execute a recipe successfully', async () => {
            const userInput = 'This is test content to summarize';
            const result = await promptExecutor.executeRecipe(sampleRecipe, userInput);

            expect(result.success).toBe(true);
            expect(result.response).toBe('Mocked AI response');
            expect(result.executionTime).toBeGreaterThan(0);
            expect(result.tokensUsed).toBeGreaterThan(0);
        });

        it('should interpolate user input into prompt', async () => {
            const userInput = 'Test content';
            await promptExecutor.executeRecipe(sampleRecipe, userInput);

            expect(mockExecutePrompt).toHaveBeenCalledWith(
                expect.stringContaining('Test content'),
                expect.any(Object)
            );
        });

        it('should use provided execution options', async () => {
            const userInput = 'Test content';
            const options: ExecutionOptions = {
                temperature: 0.9,
                topK: 50
            };

            await promptExecutor.executeRecipe(sampleRecipe, userInput, options);

            expect(mockExecutePrompt).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    temperature: 0.9,
                    topK: 50
                })
            );
        });

        it('should throw error when AI client is not available', async () => {
            mockIsAvailable.mockResolvedValue(false);

            await expect(
                promptExecutor.executeRecipe(sampleRecipe, 'Test input')
            ).rejects.toThrow(PromptExecutorError);
        });

        it('should throw error for missing recipe', async () => {
            await expect(
                promptExecutor.executeRecipe(null as any, 'Test input')
            ).rejects.toThrow(PromptExecutorError);
        });

        it('should throw error for missing user input', async () => {
            await expect(
                promptExecutor.executeRecipe(sampleRecipe, '')
            ).rejects.toThrow(PromptExecutorError);
        });

        it('should handle AI execution errors', async () => {
            mockExecutePrompt.mockRejectedValue(new Error('API Error'));

            await expect(
                promptExecutor.executeRecipe(sampleRecipe, 'Test input')
            ).rejects.toThrow(PromptExecutorError);
        });

        it('should store execution in history', async () => {
            await promptExecutor.executeRecipe(sampleRecipe, 'Test input');

            const history = promptExecutor.getAllExecutionHistory();
            expect(history.length).toBeGreaterThan(0);
            const lastExecution = history[history.length - 1];
            expect(lastExecution).toBeDefined();
            expect(lastExecution!.success).toBe(true);
        });
    });

    describe('executeRecipeStreaming', () => {
        it('should execute with streaming', async () => {
            // Mock streaming response
            const mockChunks = ['Hello', ' ', 'World', '!'];
            mockExecutePromptStreaming.mockReturnValue(
                (async function* () {
                    for (const chunk of mockChunks) {
                        yield chunk;
                    }
                })()
            );

            const chunks: string[] = [];
            const stream = promptExecutor.executeRecipeStreaming(sampleRecipe, 'Test input');

            for await (const chunk of stream) {
                chunks.push(chunk);
            }

            expect(chunks).toEqual(mockChunks);
        });

        it('should throw error when AI is not available', async () => {
            mockIsAvailable.mockResolvedValue(false);

            const stream = promptExecutor.executeRecipeStreaming(sampleRecipe, 'Test input');

            await expect(async () => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for await (const _chunk of stream) {
                    // Should throw before yielding any chunks
                }
            }).rejects.toThrow(PromptExecutorError);
        });

        it('should handle streaming errors', async () => {
            mockExecutePromptStreaming.mockReturnValue(
                (async function* () {
                    yield 'First chunk';
                    throw new Error('Streaming failed');
                })()
            );

            const stream = promptExecutor.executeRecipeStreaming(sampleRecipe, 'Test input');

            await expect(async () => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                for await (const _chunk of stream) {
                    // Should throw during iteration
                }
            }).rejects.toThrow();
        });
    });

    describe('executeCustomPrompt', () => {
        it('should execute a custom prompt', async () => {
            const customPrompt = 'What is 2 + 2?';
            const result = await promptExecutor.executeCustomPrompt(customPrompt);

            expect(result.success).toBe(true);
            expect(result.response).toBe('Mocked AI response');
            expect(mockExecutePrompt).toHaveBeenCalledWith(
                customPrompt,
                expect.any(Object)
            );
        });

        it('should sanitize custom prompt if requested', async () => {
            const customPrompt = '<script>alert("XSS")</script>';
            const result = await promptExecutor.executeCustomPrompt(customPrompt, {
                sanitization: {
                    allowHtml: false
                }
            });

            expect(result.success).toBe(true);
            // The actual prompt sent should not contain script tags
            expect(mockExecutePrompt).toHaveBeenCalled();
            const calls = mockExecutePrompt.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            const calledPrompt = calls[0]?.[0];
            expect(calledPrompt).toBeDefined();
            expect(calledPrompt).not.toContain('<script>');
        });
    });

    describe('Execution Statistics', () => {
        beforeEach(() => {
            promptExecutor.clearExecutionHistory();
        });

        it('should track execution statistics', async () => {
            // Execute multiple recipes
            await promptExecutor.executeRecipe(sampleRecipe, 'Input 1');
            await promptExecutor.executeRecipe(sampleRecipe, 'Input 2');

            const stats = promptExecutor.getExecutionStats();

            expect(stats.totalExecutions).toBe(2);
            expect(stats.successfulExecutions).toBe(2);
            expect(stats.failedExecutions).toBe(0);
            expect(stats.averageExecutionTime).toBeGreaterThanOrEqual(0);
        });

        it('should track failed executions', async () => {
            mockExecutePrompt.mockRejectedValue(new Error('API Error'));

            try {
                await promptExecutor.executeRecipe(sampleRecipe, 'Test input');
            } catch (error) {
                // Expected to fail
            }

            const stats = promptExecutor.getExecutionStats();

            expect(stats.totalExecutions).toBe(1);
            expect(stats.successfulExecutions).toBe(0);
            expect(stats.failedExecutions).toBe(1);
        });

        it('should clear execution history', async () => {
            await promptExecutor.executeRecipe(sampleRecipe, 'Test input');

            promptExecutor.clearExecutionHistory();

            const history = promptExecutor.getAllExecutionHistory();
            expect(history).toHaveLength(0);
        });
    });

    describe('testConnection', () => {
        it('should test AI connection successfully', async () => {
            mockTestConnection.mockResolvedValue({
                available: true,
                capabilities: { canUseAI: true }
            });

            const result = await promptExecutor.testConnection();

            expect(result.available).toBe(true);
            expect(result.capabilities).toBeDefined();
        });

        it('should handle connection test failure', async () => {
            mockTestConnection.mockResolvedValue({
                available: false,
                error: 'AI not available'
            });

            const result = await promptExecutor.testConnection();

            expect(result.available).toBe(false);
            expect(result.error).toBe('AI not available');
        });
    });

    describe('cleanup', () => {
        it('should cleanup active sessions', async () => {
            await promptExecutor.cleanup();
            // Should not throw any errors
            expect(true).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very long user input', async () => {
            const longInput = 'a'.repeat(20000);
            const result = await promptExecutor.executeRecipe(sampleRecipe, longInput, {
                sanitization: {
                    maxLength: 10000
                }
            });

            expect(result.success).toBe(true);
        });

        it('should handle special characters in input', async () => {
            const specialInput = '!@#$%^&*()_+-={}[]|:";\'<>?,./';
            const result = await promptExecutor.executeRecipe(sampleRecipe, specialInput);

            expect(result.success).toBe(true);
        });

        it('should handle unicode in input', async () => {
            const unicodeInput = '你好 🌍 مرحبا';
            const result = await promptExecutor.executeRecipe(sampleRecipe, unicodeInput);

            expect(result.success).toBe(true);
        });

        it('should estimate token count reasonably', async () => {
            const result = await promptExecutor.executeRecipe(sampleRecipe, 'Test input');

            expect(result.tokensUsed).toBeGreaterThan(0);
            // Rough check: tokens should be less than character count
            expect(result.tokensUsed).toBeLessThan(
                (sampleRecipe.prompt.length + 'Test input'.length + 'Mocked AI response'.length)
            );
        });
    });
});

