/**
 * Data validation utilities
 * Provides validation logic for recipes and other data structures
 */

import { Recipe, CreateRecipeData, UpdateRecipeData, RecipeValidationResult, RecipeInputType } from '../models/recipe.model';
// Validation utilities don't need error handler imports

/**
 * Validation error types
 */
export class ValidationError extends Error {
    constructor(
        message: string,
        public field: string,
        public code: string
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}

/**
 * Validation constants
 */
const VALIDATION_LIMITS = {
    NAME_MIN_LENGTH: 1,
    NAME_MAX_LENGTH: 100,
    DESCRIPTION_MAX_LENGTH: 500,
    PROMPT_MIN_LENGTH: 1,
    PROMPT_MAX_LENGTH: 10000,
    TAG_MAX_LENGTH: 50,
    MAX_TAGS: 10,
    // Edge case limits
    MAX_SPECIAL_CHARS_RATIO: 0.3, // Max 30% special characters
    MAX_CONSECUTIVE_SPECIAL: 3, // Max 3 consecutive special characters
    MAX_EMPTY_LINES: 5, // Max 5 consecutive empty lines
    MAX_REPEATED_CHARS: 5 // Max 5 consecutive repeated characters
} as const;

/**
 * Validate a recipe name
 */
export function validateRecipeName(name: string): { isValid: boolean; error?: string } {
    if (!name || typeof name !== 'string') {
        return { isValid: false, error: 'Name is required' };
    }

    const trimmedName = name.trim();

    if (trimmedName.length < VALIDATION_LIMITS.NAME_MIN_LENGTH) {
        return { isValid: false, error: 'Name must be at least 1 character long' };
    }

    if (trimmedName.length > VALIDATION_LIMITS.NAME_MAX_LENGTH) {
        return { isValid: false, error: `Name must be no more than ${VALIDATION_LIMITS.NAME_MAX_LENGTH} characters long` };
    }

    // Check for invalid characters
    if (/[<>:"/\\|?*]/.test(trimmedName)) {
        return { isValid: false, error: 'Name contains invalid characters' };
    }

    return { isValid: true };
}

/**
 * Validate a recipe description
 */
export function validateRecipeDescription(description: string): { isValid: boolean; error?: string } {
    if (!description || typeof description !== 'string') {
        return { isValid: false, error: 'Description is required' };
    }

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
        return { isValid: false, error: `Description must be no more than ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters long` };
    }

    return { isValid: true };
}

/**
 * Validate a recipe prompt
 */
export function validateRecipePrompt(prompt: string): { isValid: boolean; error?: string } {
    if (!prompt || typeof prompt !== 'string') {
        return { isValid: false, error: 'Prompt is required' };
    }

    const trimmedPrompt = prompt.trim();

    if (trimmedPrompt.length < VALIDATION_LIMITS.PROMPT_MIN_LENGTH) {
        return { isValid: false, error: 'Prompt must be at least 1 character long' };
    }

    if (trimmedPrompt.length > VALIDATION_LIMITS.PROMPT_MAX_LENGTH) {
        return { isValid: false, error: `Prompt must be no more than ${VALIDATION_LIMITS.PROMPT_MAX_LENGTH} characters long` };
    }

    return { isValid: true };
}

/**
 * Validate input type
 */
export function validateInputType(inputType: string): { isValid: boolean; error?: string } {
    const validTypes: RecipeInputType[] = ['text', 'image', 'both'];

    if (!validTypes.includes(inputType as RecipeInputType)) {
        return { isValid: false, error: `Input type must be one of: ${validTypes.join(', ')}` };
    }

    return { isValid: true };
}

/**
 * Validate recipe tags
 */
export function validateRecipeTags(tags: string[]): { isValid: boolean; error?: string } {
    if (!Array.isArray(tags)) {
        return { isValid: false, error: 'Tags must be an array' };
    }

    if (tags.length > VALIDATION_LIMITS.MAX_TAGS) {
        return { isValid: false, error: `Maximum ${VALIDATION_LIMITS.MAX_TAGS} tags allowed` };
    }

    for (const tag of tags) {
        if (typeof tag !== 'string') {
            return { isValid: false, error: 'All tags must be strings' };
        }

        const trimmedTag = tag.trim();

        if (trimmedTag.length === 0) {
            return { isValid: false, error: 'Tags cannot be empty' };
        }

        if (trimmedTag.length > VALIDATION_LIMITS.TAG_MAX_LENGTH) {
            return { isValid: false, error: `Tag "${trimmedTag}" must be no more than ${VALIDATION_LIMITS.TAG_MAX_LENGTH} characters long` };
        }

        // Check for invalid characters in tags
        if (/[<>:"/\\|?*]/.test(trimmedTag)) {
            return { isValid: false, error: `Tag "${trimmedTag}" contains invalid characters` };
        }
    }

    return { isValid: true };
}

/**
 * Validate a complete recipe
 */
export function validateRecipe(recipe: Partial<Recipe>): RecipeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!recipe.id) {
        errors.push('Recipe ID is required');
    } else if (typeof recipe.id !== 'string' || recipe.id.trim().length === 0) {
        errors.push('Recipe ID must be a non-empty string');
    }

    // Validate name
    if (recipe.name !== undefined) {
        const nameValidation = validateRecipeName(recipe.name);
        if (!nameValidation.isValid) {
            errors.push(`Name: ${nameValidation.error}`);
        }
    } else {
        errors.push('Recipe name is required');
    }

    // Validate description
    if (recipe.description !== undefined) {
        const descriptionValidation = validateRecipeDescription(recipe.description);
        if (!descriptionValidation.isValid) {
            errors.push(`Description: ${descriptionValidation.error}`);
        }
    } else {
        errors.push('Recipe description is required');
    }

    // Validate prompt
    if (recipe.prompt !== undefined) {
        const promptValidation = validateRecipePrompt(recipe.prompt);
        if (!promptValidation.isValid) {
            errors.push(`Prompt: ${promptValidation.error}`);
        }
    } else {
        errors.push('Recipe prompt is required');
    }

    // Validate original prompt
    if (recipe.originalPrompt !== undefined) {
        const originalPromptValidation = validateRecipePrompt(recipe.originalPrompt);
        if (!originalPromptValidation.isValid) {
            errors.push(`Original prompt: ${originalPromptValidation.error}`);
        }
    } else {
        errors.push('Original prompt is required');
    }

    // Input type is now optional - will be determined dynamically during execution

    // Validate tags (optional)
    if (recipe.tags !== undefined) {
        const tagsValidation = validateRecipeTags(recipe.tags);
        if (!tagsValidation.isValid) {
            errors.push(`Tags: ${tagsValidation.error}`);
        }
    }

    // Validate timestamps
    if (recipe.createdAt !== undefined) {
        if (typeof recipe.createdAt !== 'number' || recipe.createdAt <= 0) {
            errors.push('Created timestamp must be a positive number');
        }
    }

    if (recipe.lastUsedAt !== undefined && recipe.lastUsedAt !== null) {
        if (typeof recipe.lastUsedAt !== 'number' || recipe.lastUsedAt <= 0) {
            errors.push('Last used timestamp must be a positive number or null');
        }
    }

    // Add warnings for potential issues
    if (recipe.name && recipe.name.length < 3) {
        warnings.push('Recipe name is very short - consider a more descriptive name');
    }

    if (recipe.description && recipe.description.length < 10) {
        warnings.push('Recipe description is very short - consider adding more detail');
    }

    if (recipe.prompt && recipe.prompt.length < 10) {
        warnings.push('Recipe prompt is very short - consider adding more context');
    }

    if (recipe.tags && recipe.tags.length === 0) {
        warnings.push('Consider adding tags to help organize your recipes');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Validate recipe creation data
 */
export function validateCreateRecipeData(data: CreateRecipeData): RecipeValidationResult {
    const recipe: Partial<Recipe> = {
        id: 'temp', // Will be generated later
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        originalPrompt: data.originalPrompt,
        ...(data.inputType && { inputType: data.inputType }),
        tags: data.tags || [],
        pinned: data.pinned || false,
        createdAt: Date.now(),
        lastUsedAt: null
    };

    return validateRecipe(recipe);
}

/**
 * Validate recipe update data
 */
export function validateUpdateRecipeData(data: UpdateRecipeData): RecipeValidationResult {
    if (!data.id) {
        return {
            isValid: false,
            errors: ['Recipe ID is required for updates'],
            warnings: []
        };
    }

    const recipe: Partial<Recipe> = {
        id: data.id,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.prompt !== undefined && { prompt: data.prompt }),
        ...(data.originalPrompt !== undefined && { originalPrompt: data.originalPrompt }),
        ...(data.inputType !== undefined && { inputType: data.inputType }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.pinned !== undefined && { pinned: data.pinned })
    };

    return validateRecipe(recipe);
}

/**
 * Sanitize user input to prevent prompt injection
 */
export function sanitizeUserInput(input: string): string {
    if (typeof input !== 'string') {
        return '';
    }

    // Remove or escape potentially dangerous characters
    return input
        .replace(/[\r\n\t]/g, ' ') // Replace newlines and tabs with spaces
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .trim();
}

/**
 * Validate edge cases for text input
 */
export function validateEdgeCases(text: string, fieldName: string): { isValid: boolean; error?: string; warning?: string } {
    if (!text || typeof text !== 'string') {
        return { isValid: false, error: `${fieldName} is required` };
    }

    const trimmedText = text.trim();

    // Check for empty or whitespace-only input
    if (trimmedText.length === 0) {
        return { isValid: false, error: `${fieldName} cannot be empty` };
    }

    // Check for excessive special characters
    const specialCharCount = (trimmedText.match(/[^a-zA-Z0-9\s]/g) || []).length;
    const specialCharRatio = specialCharCount / trimmedText.length;

    if (specialCharRatio > VALIDATION_LIMITS.MAX_SPECIAL_CHARS_RATIO) {
        return {
            isValid: false,
            error: `${fieldName} contains too many special characters (${Math.round(specialCharRatio * 100)}%)`
        };
    }

    // Check for excessive consecutive special characters
    const consecutiveSpecial = trimmedText.match(/[^a-zA-Z0-9\s]{4,}/g);
    if (consecutiveSpecial) {
        return {
            isValid: false,
            error: `${fieldName} contains too many consecutive special characters`
        };
    }

    // Check for excessive repeated characters
    const repeatedChars = trimmedText.match(/(.)\1{4,}/g);
    if (repeatedChars) {
        return {
            isValid: false,
            error: `${fieldName} contains too many repeated characters`
        };
    }

    // Check for excessive empty lines
    const emptyLines = trimmedText.split('\n').filter(line => line.trim().length === 0).length;
    if (emptyLines > VALIDATION_LIMITS.MAX_EMPTY_LINES) {
        return {
            isValid: false,
            error: `${fieldName} contains too many empty lines`
        };
    }

    // Check for potential prompt injection patterns
    const injectionPatterns = [
        /ignore\s+previous\s+instructions/gi,
        /forget\s+everything/gi,
        /you\s+are\s+now/gi,
        /system\s+prompt/gi,
        /act\s+as\s+if/gi
    ];

    for (const pattern of injectionPatterns) {
        if (pattern.test(trimmedText)) {
            return {
                isValid: false,
                error: `${fieldName} contains potentially malicious content`
            };
        }
    }

    // Check for very long single words (potential data dumps)
    const words = trimmedText.split(/\s+/);
    const longWords = words.filter(word => word.length > 50);
    if (longWords.length > 0) {
        return {
            isValid: false,
            error: `${fieldName} contains unusually long words (${longWords.length} found)`
        };
    }

    // Check for excessive repetition of the same word
    const wordCounts: { [key: string]: number } = {};
    words.forEach(word => {
        const normalizedWord = word.toLowerCase();
        wordCounts[normalizedWord] = (wordCounts[normalizedWord] || 0) + 1;
    });

    const maxWordCount = Math.max(...Object.values(wordCounts));
    if (maxWordCount > words.length * 0.5) {
        return {
            isValid: false,
            error: `${fieldName} contains excessive repetition of the same word`
        };
    }

    // Check for potential encoding issues
    const encodingIssues = trimmedText.match(/[^\x00-\x7F]/g);
    if (encodingIssues && encodingIssues.length > trimmedText.length * 0.1) {
        return {
            isValid: false,
            error: `${fieldName} contains unusual characters that may cause encoding issues`
        };
    }

    return { isValid: true };
}

/**
 * Validate prompt length and complexity
 */
export function validatePromptComplexity(prompt: string): { isValid: boolean; error?: string; warning?: string } {
    if (!prompt || typeof prompt !== 'string') {
        return { isValid: false, error: 'Prompt is required' };
    }

    const trimmedPrompt = prompt.trim();

    // Check basic length
    if (trimmedPrompt.length < VALIDATION_LIMITS.PROMPT_MIN_LENGTH) {
        return { isValid: false, error: 'Prompt must be at least 1 character long' };
    }

    if (trimmedPrompt.length > VALIDATION_LIMITS.PROMPT_MAX_LENGTH) {
        return { isValid: false, error: `Prompt must be no more than ${VALIDATION_LIMITS.PROMPT_MAX_LENGTH} characters long` };
    }

    // Check for edge cases
    const edgeCaseResult = validateEdgeCases(trimmedPrompt, 'Prompt');
    if (!edgeCaseResult.isValid) {
        return edgeCaseResult;
    }

    // Check for prompt engineering best practices
    const warnings: string[] = [];

    // Check for placeholder usage
    if (!trimmedPrompt.includes('{user_input}') && !trimmedPrompt.includes('{input}') && !trimmedPrompt.includes('{text}')) {
        warnings.push('Consider adding a placeholder like {user_input} for dynamic content');
    }

    // Check for clear instructions
    const instructionWords = ['please', 'analyze', 'summarize', 'explain', 'create', 'write', 'generate'];
    const hasInstructions = instructionWords.some(word => trimmedPrompt.toLowerCase().includes(word));
    if (!hasInstructions) {
        warnings.push('Consider adding clear instructions for better AI responses');
    }

    // Check for context
    if (trimmedPrompt.length < 20) {
        warnings.push('Very short prompts may not provide enough context for good results');
    }

    return {
        isValid: true,
        ...(warnings.length > 0 && { warning: warnings.join('; ') })
    };
}

/**
 * Validate input for potential security issues
 */
export function validateSecurityInput(input: string): { isValid: boolean; error?: string } {
    if (!input || typeof input !== 'string') {
        return { isValid: false, error: 'Input is required' };
    }

    const trimmedInput = input.trim();

    // Check for script injection patterns
    const scriptPatterns = [
        /<script[^>]*>/gi,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /function\s*\(/gi
    ];

    for (const pattern of scriptPatterns) {
        if (pattern.test(trimmedInput)) {
            return { isValid: false, error: 'Input contains potentially malicious script content' };
        }
    }

    // Check for data URI patterns
    if (/data:/gi.test(trimmedInput)) {
        return { isValid: false, error: 'Input contains data URI which may be unsafe' };
    }

    // Check for excessive URL patterns
    const urlCount = (trimmedInput.match(/https?:\/\/[^\s]+/g) || []).length;
    if (urlCount > 5) {
        return { isValid: false, error: 'Input contains too many URLs' };
    }

    return { isValid: true };
}

/**
 * Validate search options
 */
export function validateSearchOptions(options: any): { isValid: boolean; error?: string } {
    if (typeof options !== 'object' || options === null) {
        return { isValid: false, error: 'Search options must be an object' };
    }

    // Validate search term
    if (options.searchTerm !== undefined) {
        if (typeof options.searchTerm !== 'string') {
            return { isValid: false, error: 'Search term must be a string' };
        }
        if (options.searchTerm.length > 200) {
            return { isValid: false, error: 'Search term must be no more than 200 characters' };
        }
    }

    // Validate input type filter
    if (options.inputType !== undefined) {
        const inputTypeValidation = validateInputType(options.inputType);
        if (!inputTypeValidation.isValid) {
            return { isValid: false, error: `Input type filter: ${inputTypeValidation.error}` };
        }
    }

    // Validate tags filter
    if (options.tags !== undefined) {
        if (!Array.isArray(options.tags)) {
            return { isValid: false, error: 'Tags filter must be an array' };
        }
        for (const tag of options.tags) {
            if (typeof tag !== 'string') {
                return { isValid: false, error: 'All tag filters must be strings' };
            }
        }
    }

    // Validate sort options
    if (options.sortBy !== undefined) {
        const validSortFields = ['name', 'createdAt', 'lastUsedAt'];
        if (!validSortFields.includes(options.sortBy)) {
            return { isValid: false, error: `Sort field must be one of: ${validSortFields.join(', ')}` };
        }
    }

    if (options.sortDirection !== undefined) {
        const validDirections = ['asc', 'desc'];
        if (!validDirections.includes(options.sortDirection)) {
            return { isValid: false, error: `Sort direction must be one of: ${validDirections.join(', ')}` };
        }
    }

    // Validate limit
    if (options.limit !== undefined) {
        if (typeof options.limit !== 'number' || options.limit < 1 || options.limit > 1000) {
            return { isValid: false, error: 'Limit must be a number between 1 and 1000' };
        }
    }

    return { isValid: true };
}
