/**
 * Recipe Manager
 * Provides high-level CRUD operations for recipe management
 */
import { StorageService } from './storage';
import { generateUUID } from '../utils/uuid';
import { validateCreateRecipeData, validateUpdateRecipeData, validateSearchOptions } from '../utils/validation';
/**
 * Recipe Manager error types
 */
export class RecipeManagerError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'RecipeManagerError';
    }
}
/**
 * Recipe Manager
 * Handles all recipe-related operations with validation and error handling
 */
export class RecipeManager {
    constructor() {
        this.storageService = StorageService.getInstance();
    }
    /**
     * Get singleton instance of RecipeManager
     */
    static getInstance() {
        if (!RecipeManager.instance) {
            RecipeManager.instance = new RecipeManager();
        }
        return RecipeManager.instance;
    }
    /**
     * Create a new recipe
     */
    async createRecipe(data) {
        try {
            // Validate input data
            const validation = validateCreateRecipeData(data);
            if (!validation.isValid) {
                throw new RecipeManagerError(`Validation failed: ${validation.errors.join(', ')}`, 'VALIDATION_FAILED');
            }
            // Log warnings if any
            if (validation.warnings.length > 0) {
                console.warn('Recipe creation warnings:', validation.warnings);
            }
            // Create recipe object
            const recipe = {
                id: generateUUID(),
                name: data.name.trim(),
                description: data.description.trim(),
                prompt: data.prompt.trim(),
                originalPrompt: data.originalPrompt.trim(),
                inputType: data.inputType || 'text', // Default to text if not specified
                tags: data.tags || [],
                pinned: data.pinned || false,
                createdAt: Date.now(),
                lastUsedAt: null
            };
            // Save to storage
            await this.storageService.addRecipe(recipe);
            console.log('Recipe created successfully:', recipe.id);
            return recipe;
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to create recipe', 'CREATE_FAILED', error);
        }
    }
    /**
     * Get a recipe by ID
     */
    async getRecipe(recipeId) {
        try {
            if (!recipeId || typeof recipeId !== 'string') {
                throw new RecipeManagerError('Invalid recipe ID', 'INVALID_ID');
            }
            const recipe = await this.storageService.getRecipe(recipeId);
            return recipe;
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to get recipe', 'GET_FAILED', error);
        }
    }
    /**
     * Get all recipes
     */
    async getAllRecipes() {
        try {
            const recipes = await this.storageService.getRecipes();
            return recipes;
        }
        catch (error) {
            throw new RecipeManagerError('Failed to get recipes', 'GET_ALL_FAILED', error);
        }
    }
    /**
     * Update an existing recipe
     */
    async updateRecipe(data) {
        try {
            // Validate input data
            const validation = validateUpdateRecipeData(data);
            if (!validation.isValid) {
                throw new RecipeManagerError(`Validation failed: ${validation.errors.join(', ')}`, 'VALIDATION_FAILED');
            }
            // Get existing recipe
            const existingRecipe = await this.getRecipe(data.id);
            if (!existingRecipe) {
                throw new RecipeManagerError(`Recipe with ID ${data.id} not found`, 'RECIPE_NOT_FOUND');
            }
            // Create updated recipe
            const updatedRecipe = {
                ...existingRecipe,
                ...(data.name !== undefined && { name: data.name.trim() }),
                ...(data.description !== undefined && { description: data.description.trim() }),
                ...(data.prompt !== undefined && { prompt: data.prompt.trim() }),
                ...(data.originalPrompt !== undefined && { originalPrompt: data.originalPrompt.trim() }),
                ...(data.inputType !== undefined && { inputType: data.inputType }),
                ...(data.tags !== undefined && { tags: data.tags }),
                ...(data.pinned !== undefined && { pinned: data.pinned })
            };
            // Save updated recipe
            await this.storageService.updateRecipe(updatedRecipe);
            console.log('Recipe updated successfully:', updatedRecipe.id);
            return updatedRecipe;
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to update recipe', 'UPDATE_FAILED', error);
        }
    }
    /**
     * Delete a recipe
     */
    async deleteRecipe(recipeId) {
        try {
            if (!recipeId || typeof recipeId !== 'string') {
                throw new RecipeManagerError('Invalid recipe ID', 'INVALID_ID');
            }
            // Check if recipe exists
            const existingRecipe = await this.getRecipe(recipeId);
            if (!existingRecipe) {
                throw new RecipeManagerError(`Recipe with ID ${recipeId} not found`, 'RECIPE_NOT_FOUND');
            }
            // Delete recipe
            await this.storageService.deleteRecipe(recipeId);
            console.log('Recipe deleted successfully:', recipeId);
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to delete recipe', 'DELETE_FAILED', error);
        }
    }
    /**
     * Search recipes with filters and sorting
     */
    async searchRecipes(options = {}) {
        try {
            // Validate search options
            const validation = validateSearchOptions(options);
            if (!validation.isValid) {
                throw new RecipeManagerError(`Invalid search options: ${validation.error}`, 'INVALID_SEARCH_OPTIONS');
            }
            // Get all recipes
            let recipes = await this.getAllRecipes();
            // Apply filters
            if (options.searchTerm) {
                const searchTerm = options.searchTerm.toLowerCase();
                recipes = recipes.filter(recipe => recipe.name.toLowerCase().includes(searchTerm) ||
                    recipe.description.toLowerCase().includes(searchTerm) ||
                    recipe.prompt.toLowerCase().includes(searchTerm));
            }
            if (options.inputType) {
                recipes = recipes.filter(recipe => recipe.inputType === options.inputType);
            }
            if (options.tags && options.tags.length > 0) {
                recipes = recipes.filter(recipe => recipe.tags && options.tags.some(tag => recipe.tags.includes(tag)));
            }
            if (options.pinnedOnly) {
                recipes = recipes.filter(recipe => recipe.pinned === true);
            }
            // Apply sorting
            const sortBy = options.sortBy || 'name';
            const sortDirection = options.sortDirection || 'asc';
            recipes.sort((a, b) => {
                let comparison = 0;
                switch (sortBy) {
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'createdAt':
                        comparison = a.createdAt - b.createdAt;
                        break;
                    case 'lastUsedAt':
                        const aLastUsed = a.lastUsedAt || 0;
                        const bLastUsed = b.lastUsedAt || 0;
                        comparison = aLastUsed - bLastUsed;
                        break;
                }
                return sortDirection === 'desc' ? -comparison : comparison;
            });
            // Apply limit
            if (options.limit && options.limit > 0) {
                recipes = recipes.slice(0, options.limit);
            }
            return {
                recipes,
                total: recipes.length,
                searchOptions: options
            };
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to search recipes', 'SEARCH_FAILED', error);
        }
    }
    /**
     * Get recipe statistics
     */
    async getRecipeStats() {
        try {
            const recipes = await this.getAllRecipes();
            const stats = {
                totalRecipes: recipes.length,
                recipesByInputType: {
                    text: 0,
                    image: 0,
                    both: 0
                },
                pinnedRecipes: 0,
                mostRecentRecipe: null,
                oldestRecipe: null
            };
            if (recipes.length === 0) {
                return stats;
            }
            // Calculate statistics
            for (const recipe of recipes) {
                const inputType = recipe.inputType || 'text'; // Default to text if not specified
                stats.recipesByInputType[inputType]++;
                if (recipe.pinned) {
                    stats.pinnedRecipes++;
                }
            }
            // Find most recent and oldest recipes
            const sortedByCreated = [...recipes].sort((a, b) => b.createdAt - a.createdAt);
            stats.oldestRecipe = sortedByCreated[sortedByCreated.length - 1] || null;
            stats.mostRecentRecipe = sortedByCreated[0] || null;
            return stats;
        }
        catch (error) {
            throw new RecipeManagerError('Failed to get recipe statistics', 'STATS_FAILED', error);
        }
    }
    /**
     * Mark a recipe as used (update lastUsedAt timestamp)
     */
    async markRecipeAsUsed(recipeId) {
        try {
            const recipe = await this.getRecipe(recipeId);
            if (!recipe) {
                throw new RecipeManagerError(`Recipe with ID ${recipeId} not found`, 'RECIPE_NOT_FOUND');
            }
            const updatedRecipe = {
                ...recipe,
                lastUsedAt: Date.now()
            };
            await this.storageService.updateRecipe(updatedRecipe);
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to mark recipe as used', 'MARK_USED_FAILED', error);
        }
    }
    /**
     * Duplicate a recipe
     */
    async duplicateRecipe(recipeId, newName) {
        try {
            const originalRecipe = await this.getRecipe(recipeId);
            if (!originalRecipe) {
                throw new RecipeManagerError(`Recipe with ID ${recipeId} not found`, 'RECIPE_NOT_FOUND');
            }
            const duplicateData = {
                name: newName || `${originalRecipe.name} (Copy)`,
                description: originalRecipe.description,
                prompt: originalRecipe.prompt,
                originalPrompt: originalRecipe.originalPrompt,
                inputType: originalRecipe.inputType || 'text',
                tags: [...(originalRecipe.tags || [])],
                pinned: false
            };
            return await this.createRecipe(duplicateData);
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to duplicate recipe', 'DUPLICATE_FAILED', error);
        }
    }
    /**
     * Toggle recipe pin status
     */
    async toggleRecipePin(recipeId) {
        try {
            const recipe = await this.getRecipe(recipeId);
            if (!recipe) {
                throw new RecipeManagerError(`Recipe with ID ${recipeId} not found`, 'RECIPE_NOT_FOUND');
            }
            const updatedRecipe = {
                ...recipe,
                pinned: !recipe.pinned
            };
            await this.storageService.updateRecipe(updatedRecipe);
            return updatedRecipe;
        }
        catch (error) {
            if (error instanceof RecipeManagerError) {
                throw error;
            }
            throw new RecipeManagerError('Failed to toggle recipe pin', 'TOGGLE_PIN_FAILED', error);
        }
    }
    /**
     * Export all recipes as JSON
     */
    async exportRecipes() {
        try {
            return await this.storageService.exportData();
        }
        catch (error) {
            throw new RecipeManagerError('Failed to export recipes', 'EXPORT_FAILED', error);
        }
    }
    /**
     * Import recipes from JSON
     */
    async importRecipes(jsonData) {
        try {
            await this.storageService.importData(jsonData);
        }
        catch (error) {
            throw new RecipeManagerError('Failed to import recipes', 'IMPORT_FAILED', error);
        }
    }
    /**
     * Clear all recipes
     */
    async clearAllRecipes() {
        try {
            await this.storageService.clearAllData();
        }
        catch (error) {
            throw new RecipeManagerError('Failed to clear all recipes', 'CLEAR_FAILED', error);
        }
    }
    /**
     * Get storage information
     */
    async getStorageInfo() {
        try {
            return await this.storageService.getStorageInfo();
        }
        catch (error) {
            throw new RecipeManagerError('Failed to get storage info', 'STORAGE_INFO_FAILED', error);
        }
    }
}
/**
 * Utility function to get recipe manager instance
 */
export const getRecipeManager = () => RecipeManager.getInstance();
//# sourceMappingURL=recipe-manager.js.map