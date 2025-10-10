/**
 * Unit tests for Validation utilities
 */

import {
    validateRecipeName,
    validateRecipeDescription,
    validateRecipePrompt,
    validateInputType,
    validateRecipeTags,
    validateRecipe,
    validateCreateRecipeData,
    validateUpdateRecipeData,
    sanitizeUserInput,
    validateSearchOptions
} from '../../src/utils/validation';
import { createMockRecipe } from '../setup';

describe('Validation utilities', () => {
    describe('validateRecipeName', () => {
        it('should validate correct recipe names', () => {
            expect(validateRecipeName('Valid Recipe Name')).toEqual({ isValid: true });
            expect(validateRecipeName('A')).toEqual({ isValid: true });
            expect(validateRecipeName('Recipe with 100 chars '.repeat(4))).toEqual({ isValid: true });
        });

        it('should reject invalid recipe names', () => {
            expect(validateRecipeName('')).toEqual({ isValid: false, error: 'Name is required' });
            expect(validateRecipeName('   ')).toEqual({ isValid: false, error: 'Name must be at least 1 character long' });
            expect(validateRecipeName('Recipe with 100 chars '.repeat(5) + 'x')).toEqual({
                isValid: false,
                error: 'Name must be no more than 100 characters long'
            });
            expect(validateRecipeName('Recipe<with>invalid:chars')).toEqual({
                isValid: false,
                error: 'Name contains invalid characters'
            });
        });
    });

    describe('validateRecipeDescription', () => {
        it('should validate correct descriptions', () => {
            expect(validateRecipeDescription('Valid description')).toEqual({ isValid: true });
            expect(validateRecipeDescription('A short desc')).toEqual({ isValid: true });
        });

        it('should reject invalid descriptions', () => {
            expect(validateRecipeDescription('')).toEqual({ isValid: false, error: 'Description is required' });
            expect(validateRecipeDescription('x'.repeat(501))).toEqual({
                isValid: false,
                error: 'Description must be no more than 500 characters long'
            });
        });
    });

    describe('validateRecipePrompt', () => {
        it('should validate correct prompts', () => {
            expect(validateRecipePrompt('Valid prompt')).toEqual({ isValid: true });
            expect(validateRecipePrompt('A')).toEqual({ isValid: true });
        });

        it('should reject invalid prompts', () => {
            expect(validateRecipePrompt('')).toEqual({ isValid: false, error: 'Prompt is required' });
            expect(validateRecipePrompt('   ')).toEqual({ isValid: false, error: 'Prompt must be at least 1 character long' });
            expect(validateRecipePrompt('x'.repeat(10001))).toEqual({
                isValid: false,
                error: 'Prompt must be no more than 10000 characters long'
            });
        });
    });

    describe('validateInputType', () => {
        it('should validate correct input types', () => {
            expect(validateInputType('text')).toEqual({ isValid: true });
            expect(validateInputType('image')).toEqual({ isValid: true });
            expect(validateInputType('both')).toEqual({ isValid: true });
        });

        it('should reject invalid input types', () => {
            expect(validateInputType('invalid')).toEqual({
                isValid: false,
                error: 'Input type must be one of: text, image, both'
            });
            expect(validateInputType('')).toEqual({
                isValid: false,
                error: 'Input type must be one of: text, image, both'
            });
        });
    });

    describe('validateRecipeTags', () => {
        it('should validate correct tags', () => {
            expect(validateRecipeTags([])).toEqual({ isValid: true });
            expect(validateRecipeTags(['tag1', 'tag2'])).toEqual({ isValid: true });
            expect(validateRecipeTags(['a'.repeat(50)])).toEqual({ isValid: true });
        });

        it('should reject invalid tags', () => {
            expect(validateRecipeTags('not-array' as any)).toEqual({
                isValid: false,
                error: 'Tags must be an array'
            });
            expect(validateRecipeTags(new Array(11).fill('tag'))).toEqual({
                isValid: false,
                error: 'Maximum 10 tags allowed'
            });
            expect(validateRecipeTags(['', 'valid'])).toEqual({
                isValid: false,
                error: 'Tags cannot be empty'
            });
            expect(validateRecipeTags(['a'.repeat(51)])).toEqual({
                isValid: false,
                error: `Tag "${'a'.repeat(51)}" must be no more than 50 characters long`
            });
            expect(validateRecipeTags(['tag<with>invalid:chars'])).toEqual({
                isValid: false,
                error: 'Tag "tag<with>invalid:chars" contains invalid characters'
            });
        });
    });

    describe('validateRecipe', () => {
        it('should validate complete recipe', () => {
            const validRecipe = createMockRecipe();
            const result = validateRecipe(validRecipe);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should identify validation errors', () => {
            const invalidRecipe = {
                id: '',
                name: '',
                description: '',
                prompt: '',
                originalPrompt: '',
                inputType: 'invalid' as any,
                createdAt: -1
            };

            const result = validateRecipe(invalidRecipe);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should identify warnings', () => {
            const recipeWithWarnings = createMockRecipe({
                name: 'A',
                description: 'Short',
                prompt: 'Short',
                tags: []
            });

            const result = validateRecipe(recipeWithWarnings);

            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });

    describe('validateCreateRecipeData', () => {
        it('should validate valid create data', () => {
            const validData = {
                name: 'Test Recipe',
                description: 'A test recipe',
                prompt: 'Test prompt: {user_input}',
                originalPrompt: 'Test prompt: {user_input}',
                inputType: 'text' as const
            };

            const result = validateCreateRecipeData(validData);

            expect(result.isValid).toBe(true);
        });

        it('should identify create data errors', () => {
            const invalidData = {
                name: '',
                description: '',
                prompt: '',
                originalPrompt: '',
                inputType: 'invalid' as any
            };

            const result = validateCreateRecipeData(invalidData);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });

    describe('validateUpdateRecipeData', () => {
        it('should validate valid update data', () => {
            const validData = {
                id: 'recipe-1',
                name: 'Updated Name'
            };

            const result = validateUpdateRecipeData(validData);

            expect(result.isValid).toBe(true);
        });

        it('should require ID for updates', () => {
            const invalidData = {
                name: 'Updated Name'
            };

            const result = validateUpdateRecipeData(invalidData as any);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Recipe ID is required for updates');
        });
    });

    describe('sanitizeUserInput', () => {
        it('should sanitize user input', () => {
            expect(sanitizeUserInput('Normal input')).toBe('Normal input');
            expect(sanitizeUserInput('Input\nwith\rnewlines\tand\ttabs')).toBe('Input with newlines and tabs');
            expect(sanitizeUserInput('Input with <script>alert("xss")</script>')).toBe('Input with scriptalert("xss")/script');
            expect(sanitizeUserInput('javascript:alert("xss")')).toBe('alert("xss")');
            expect(sanitizeUserInput('data:text/html,<script>alert("xss")</script>')).toBe('text/html,scriptalert("xss")/script');
        });

        it('should handle non-string input', () => {
            expect(sanitizeUserInput(null as any)).toBe('');
            expect(sanitizeUserInput(undefined as any)).toBe('');
            expect(sanitizeUserInput(123 as any)).toBe('');
        });
    });

    describe('validateSearchOptions', () => {
        it('should validate correct search options', () => {
            expect(validateSearchOptions({})).toEqual({ isValid: true });
            expect(validateSearchOptions({ searchTerm: 'test' })).toEqual({ isValid: true });
            expect(validateSearchOptions({ inputType: 'text' })).toEqual({ isValid: true });
            expect(validateSearchOptions({ tags: ['tag1', 'tag2'] })).toEqual({ isValid: true });
            expect(validateSearchOptions({ sortBy: 'name', sortDirection: 'asc' })).toEqual({ isValid: true });
            expect(validateSearchOptions({ limit: 10 })).toEqual({ isValid: true });
        });

        it('should reject invalid search options', () => {
            expect(validateSearchOptions(null)).toEqual({ isValid: false, error: 'Search options must be an object' });
            expect(validateSearchOptions({ searchTerm: 123 })).toEqual({
                isValid: false,
                error: 'Search term must be a string'
            });
            expect(validateSearchOptions({ searchTerm: 'x'.repeat(201) })).toEqual({
                isValid: false,
                error: 'Search term must be no more than 200 characters'
            });
            expect(validateSearchOptions({ inputType: 'invalid' })).toEqual({
                isValid: false,
                error: 'Input type filter: Input type must be one of: text, image, both'
            });
            expect(validateSearchOptions({ tags: 'not-array' })).toEqual({
                isValid: false,
                error: 'Tags filter must be an array'
            });
            expect(validateSearchOptions({ sortBy: 'invalid' })).toEqual({
                isValid: false,
                error: 'Sort field must be one of: name, createdAt, lastUsedAt'
            });
            expect(validateSearchOptions({ sortDirection: 'invalid' })).toEqual({
                isValid: false,
                error: 'Sort direction must be one of: asc, desc'
            });
            expect(validateSearchOptions({ limit: 0 })).toEqual({
                isValid: false,
                error: 'Limit must be a number between 1 and 1000'
            });
            expect(validateSearchOptions({ limit: 1001 })).toEqual({
                isValid: false,
                error: 'Limit must be a number between 1 and 1000'
            });
        });
    });
});
