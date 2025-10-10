/**
 * Data validation utilities
 * Provides validation logic for recipes and other data structures
 */
import { Recipe, CreateRecipeData, UpdateRecipeData, RecipeValidationResult } from '../models/recipe.model';
/**
 * Validation error types
 */
export declare class ValidationError extends Error {
    field: string;
    code: string;
    constructor(message: string, field: string, code: string);
}
/**
 * Validate a recipe name
 */
export declare function validateRecipeName(name: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate a recipe description
 */
export declare function validateRecipeDescription(description: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate a recipe prompt
 */
export declare function validateRecipePrompt(prompt: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate input type
 */
export declare function validateInputType(inputType: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate recipe tags
 */
export declare function validateRecipeTags(tags: string[]): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate a complete recipe
 */
export declare function validateRecipe(recipe: Partial<Recipe>): RecipeValidationResult;
/**
 * Validate recipe creation data
 */
export declare function validateCreateRecipeData(data: CreateRecipeData): RecipeValidationResult;
/**
 * Validate recipe update data
 */
export declare function validateUpdateRecipeData(data: UpdateRecipeData): RecipeValidationResult;
/**
 * Sanitize user input to prevent prompt injection
 */
export declare function sanitizeUserInput(input: string): string;
/**
 * Validate search options
 */
export declare function validateSearchOptions(options: any): {
    isValid: boolean;
    error?: string;
};
//# sourceMappingURL=validation.d.ts.map