/**
 * Recipe Manager
 * Provides high-level CRUD operations for recipe management
 */
import { Recipe, CreateRecipeData, UpdateRecipeData, RecipeSearchOptions, RecipeSearchResults, RecipeStats } from '../models/recipe.model';
/**
 * Recipe Manager error types
 */
export declare class RecipeManagerError extends Error {
    code: string;
    originalError?: Error | undefined;
    constructor(message: string, code: string, originalError?: Error | undefined);
}
/**
 * Recipe Manager
 * Handles all recipe-related operations with validation and error handling
 */
export declare class RecipeManager {
    private static instance;
    private storageService;
    private constructor();
    /**
     * Get singleton instance of RecipeManager
     */
    static getInstance(): RecipeManager;
    /**
     * Create a new recipe
     */
    createRecipe(data: CreateRecipeData): Promise<Recipe>;
    /**
     * Get a recipe by ID
     */
    getRecipe(recipeId: string): Promise<Recipe | null>;
    /**
     * Get all recipes
     */
    getAllRecipes(): Promise<Recipe[]>;
    /**
     * Update an existing recipe
     */
    updateRecipe(data: UpdateRecipeData): Promise<Recipe>;
    /**
     * Delete a recipe
     */
    deleteRecipe(recipeId: string): Promise<void>;
    /**
     * Search recipes with filters and sorting
     */
    searchRecipes(options?: RecipeSearchOptions): Promise<RecipeSearchResults>;
    /**
     * Get recipe statistics
     */
    getRecipeStats(): Promise<RecipeStats>;
    /**
     * Mark a recipe as used (update lastUsedAt timestamp)
     */
    markRecipeAsUsed(recipeId: string): Promise<void>;
    /**
     * Duplicate a recipe
     */
    duplicateRecipe(recipeId: string, newName?: string): Promise<Recipe>;
    /**
     * Toggle recipe pin status
     */
    toggleRecipePin(recipeId: string): Promise<Recipe>;
    /**
     * Export all recipes as JSON
     */
    exportRecipes(): Promise<string>;
    /**
     * Import recipes from JSON
     */
    importRecipes(jsonData: string): Promise<void>;
    /**
     * Clear all recipes
     */
    clearAllRecipes(): Promise<void>;
    /**
     * Get storage information
     */
    getStorageInfo(): Promise<{
        used: number;
        available: number;
        quota: number;
    }>;
}
/**
 * Utility function to get recipe manager instance
 */
export declare const getRecipeManager: () => RecipeManager;
//# sourceMappingURL=recipe-manager.d.ts.map