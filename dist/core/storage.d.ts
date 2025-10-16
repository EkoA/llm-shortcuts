/**
 * Chrome Storage API wrapper
 * Provides a clean async/await interface for Chrome extension storage operations
 */
import { Recipe, StorageSchema } from '../models/recipe.model';
/**
 * Storage error types
 */
export declare class StorageError extends Error {
    code: string;
    originalError?: Error | undefined;
    constructor(message: string, code: string, originalError?: Error | undefined);
}
/**
 * Storage operation result
 */
export interface StorageResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}
/**
 * Chrome Storage API wrapper with async/await support
 */
export declare class StorageService {
    private static instance;
    private readonly STORAGE_VERSION;
    private readonly STORAGE_KEY;
    private constructor();
    /**
     * Get singleton instance of StorageService
     */
    static getInstance(): StorageService;
    /**
     * Check if Chrome storage API is available
     */
    private isStorageAvailable;
    /**
     * Get all data from storage
     */
    getAllData(): Promise<StorageSchema>;
    /**
     * Save all data to storage
     */
    saveAllData(data: StorageSchema): Promise<void>;
    /**
     * Get all recipes from storage
     */
    getRecipes(): Promise<Recipe[]>;
    /**
     * Save recipes to storage
     */
    saveRecipes(recipes: Recipe[]): Promise<void>;
    /**
     * Add a single recipe to storage
     */
    addRecipe(recipe: Recipe): Promise<void>;
    /**
     * Update a recipe in storage
     */
    updateRecipe(recipe: Recipe): Promise<void>;
    /**
     * Delete a recipe from storage
     */
    deleteRecipe(recipeId: string): Promise<void>;
    /**
     * Get a single recipe by ID
     */
    getRecipe(recipeId: string): Promise<Recipe | null>;
    /**
     * Clear all data from storage
     */
    clearAllData(): Promise<void>;
    /**
     * Get storage usage information
     */
    getStorageInfo(): Promise<{
        used: number;
        available: number;
        quota: number;
    }>;
    /**
     * Export all data as JSON string
     */
    exportData(): Promise<string>;
    /**
     * Import data from JSON string
     */
    importData(jsonData: string): Promise<void>;
    /**
     * Get user guide from storage
     */
    getGuide(): Promise<string>;
    /**
     * Save user guide to storage
     */
    saveGuide(guideContent: string): Promise<void>;
    /**
     * Clear user guide from storage
     */
    clearGuide(): Promise<void>;
    /**
     * Get default storage schema
     */
    private getDefaultSchema;
    /**
     * Validate and migrate storage data
     */
    private validateAndMigrateData;
    /**
     * Migrate data between versions
     */
    private migrateData;
    /**
     * Validate storage schema
     */
    private validateStorageSchema;
    /**
     * Listen for storage changes
     */
    onStorageChanged(callback: (changes: {
        [key: string]: chrome.storage.StorageChange;
    }) => void): void;
    /**
     * Remove storage change listener
     */
    removeStorageListener(callback: (changes: {
        [key: string]: chrome.storage.StorageChange;
    }) => void): void;
}
/**
 * Utility function to get storage service instance
 */
export declare const getStorageService: () => StorageService;
//# sourceMappingURL=storage.d.ts.map