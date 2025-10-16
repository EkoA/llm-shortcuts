/**
 * Chrome Storage API wrapper
 * Provides a clean async/await interface for Chrome extension storage operations
 */

import { Recipe, StorageSchema } from '../models/recipe.model';

/**
 * Storage error types
 */
export class StorageError extends Error {
    constructor(
        message: string,
        public code: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'StorageError';
    }
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
export class StorageService {
    private static instance: StorageService;
    private readonly STORAGE_VERSION = '1.0.0';
    private readonly STORAGE_KEY = 'llm_shortcuts_data';

    private constructor() { }

    /**
     * Get singleton instance of StorageService
     */
    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    /**
     * Check if Chrome storage API is available
     */
    private isStorageAvailable(): boolean {
        return !!(chrome && chrome.storage && chrome.storage.local);
    }

    /**
     * Get all data from storage
     */
    public async getAllData(): Promise<StorageSchema> {
        if (!this.isStorageAvailable()) {
            throw new StorageError(
                'Chrome storage API is not available',
                'STORAGE_NOT_AVAILABLE'
            );
        }

        try {
            const result = await chrome.storage.local.get(this.STORAGE_KEY);
            const data = result[this.STORAGE_KEY];

            if (!data) {
                // Return default schema if no data exists
                return this.getDefaultSchema();
            }

            // Validate and migrate data if needed
            return this.validateAndMigrateData(data);
        } catch (error) {
            throw new StorageError(
                'Failed to retrieve data from storage',
                'GET_DATA_FAILED',
                error as Error
            );
        }
    }

    /**
     * Save all data to storage
     */
    public async saveAllData(data: StorageSchema): Promise<void> {
        if (!this.isStorageAvailable()) {
            throw new StorageError(
                'Chrome storage API is not available',
                'STORAGE_NOT_AVAILABLE'
            );
        }

        try {
            // Update version and timestamp
            const dataToSave = {
                ...data,
                version: {
                    version: this.STORAGE_VERSION,
                    lastUpdated: Date.now()
                }
            };

            await chrome.storage.local.set({
                [this.STORAGE_KEY]: dataToSave
            });
        } catch (error) {
            throw new StorageError(
                'Failed to save data to storage',
                'SAVE_DATA_FAILED',
                error as Error
            );
        }
    }

    /**
     * Get all recipes from storage
     */
    public async getRecipes(): Promise<Recipe[]> {
        const data = await this.getAllData();
        return data.recipes;
    }

    /**
     * Save recipes to storage
     */
    public async saveRecipes(recipes: Recipe[]): Promise<void> {
        const data = await this.getAllData();
        data.recipes = recipes;
        await this.saveAllData(data);
    }

    /**
     * Add a single recipe to storage
     */
    public async addRecipe(recipe: Recipe): Promise<void> {
        const recipes = await this.getRecipes();
        recipes.push(recipe);
        await this.saveRecipes(recipes);
    }

    /**
     * Update a recipe in storage
     */
    public async updateRecipe(recipe: Recipe): Promise<void> {
        const recipes = await this.getRecipes();
        const index = recipes.findIndex(r => r.id === recipe.id);

        if (index === -1) {
            throw new StorageError(
                `Recipe with ID ${recipe.id} not found`,
                'RECIPE_NOT_FOUND'
            );
        }

        recipes[index] = recipe;
        await this.saveRecipes(recipes);
    }

    /**
     * Delete a recipe from storage
     */
    public async deleteRecipe(recipeId: string): Promise<void> {
        const recipes = await this.getRecipes();
        const filteredRecipes = recipes.filter(r => r.id !== recipeId);

        if (filteredRecipes.length === recipes.length) {
            throw new StorageError(
                `Recipe with ID ${recipeId} not found`,
                'RECIPE_NOT_FOUND'
            );
        }

        await this.saveRecipes(filteredRecipes);
    }

    /**
     * Get a single recipe by ID
     */
    public async getRecipe(recipeId: string): Promise<Recipe | null> {
        const recipes = await this.getRecipes();
        return recipes.find(r => r.id === recipeId) || null;
    }

    /**
     * Clear all data from storage
     */
    public async clearAllData(): Promise<void> {
        if (!this.isStorageAvailable()) {
            throw new StorageError(
                'Chrome storage API is not available',
                'STORAGE_NOT_AVAILABLE'
            );
        }

        try {
            await chrome.storage.local.remove(this.STORAGE_KEY);
        } catch (error) {
            throw new StorageError(
                'Failed to clear storage data',
                'CLEAR_DATA_FAILED',
                error as Error
            );
        }
    }

    /**
     * Get storage usage information
     */
    public async getStorageInfo(): Promise<{
        used: number;
        available: number;
        quota: number;
    }> {
        if (!this.isStorageAvailable()) {
            throw new StorageError(
                'Chrome storage API is not available',
                'STORAGE_NOT_AVAILABLE'
            );
        }

        try {
            const usage = await chrome.storage.local.getBytesInUse();
            const quota = chrome.storage.local.QUOTA_BYTES;

            return {
                used: usage,
                available: quota - usage,
                quota: quota
            };
        } catch (error) {
            throw new StorageError(
                'Failed to get storage info',
                'GET_STORAGE_INFO_FAILED',
                error as Error
            );
        }
    }

    /**
     * Export all data as JSON string
     */
    public async exportData(): Promise<string> {
        const data = await this.getAllData();
        return JSON.stringify(data, null, 2);
    }

    /**
     * Import data from JSON string
     */
    public async importData(jsonData: string): Promise<void> {
        try {
            const data = JSON.parse(jsonData) as StorageSchema;

            // Validate imported data
            this.validateStorageSchema(data);

            // Save imported data
            await this.saveAllData(data);
        } catch (error) {
            throw new StorageError(
                'Failed to import data - invalid JSON or schema',
                'IMPORT_DATA_FAILED',
                error as Error
            );
        }
    }

    /**
     * Get user guide from storage
     */
    public async getGuide(): Promise<string> {
        const data = await this.getAllData();
        return data.guide?.content || '';
    }

    /**
     * Save user guide to storage
     */
    public async saveGuide(guideContent: string): Promise<void> {
        const data = await this.getAllData();
        data.guide = {
            content: guideContent,
            updatedAt: Date.now()
        };
        await this.saveAllData(data);
    }

    /**
     * Clear user guide from storage
     */
    public async clearGuide(): Promise<void> {
        const data = await this.getAllData();
        delete data.guide;
        await this.saveAllData(data);
    }

    /**
     * Get default storage schema
     */
    private getDefaultSchema(): StorageSchema {
        return {
            version: {
                version: this.STORAGE_VERSION,
                lastUpdated: Date.now()
            },
            recipes: []
        };
    }

    /**
     * Validate and migrate storage data
     */
    private validateAndMigrateData(data: any): StorageSchema {
        // Check if data has the expected structure
        if (!data || typeof data !== 'object') {
            console.warn('Invalid storage data, returning default schema');
            return this.getDefaultSchema();
        }

        // Ensure version exists
        if (!data.version) {
            data.version = {
                version: this.STORAGE_VERSION,
                lastUpdated: Date.now()
            };
        }

        // Ensure recipes array exists
        if (!Array.isArray(data.recipes)) {
            data.recipes = [];
        }

        // Migrate data if version is different
        if (data.version.version !== this.STORAGE_VERSION) {
            data = this.migrateData(data);
        }

        return data as StorageSchema;
    }

    /**
     * Migrate data between versions
     */
    private migrateData(data: any): StorageSchema {
        console.log(`Migrating data from version ${data.version?.version} to ${this.STORAGE_VERSION}`);

        // For now, just update the version
        // Future migrations can be added here
        data.version = {
            version: this.STORAGE_VERSION,
            lastUpdated: Date.now()
        };

        return data as StorageSchema;
    }

    /**
     * Validate storage schema
     */
    private validateStorageSchema(data: any): void {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data structure');
        }

        if (!data.version || typeof data.version !== 'object') {
            throw new Error('Invalid version structure');
        }

        if (!Array.isArray(data.recipes)) {
            throw new Error('Recipes must be an array');
        }

        // Validate each recipe
        for (const recipe of data.recipes) {
            if (!recipe.id || typeof recipe.id !== 'string') {
                throw new Error('Recipe must have a valid ID');
            }
            if (!recipe.name || typeof recipe.name !== 'string') {
                throw new Error('Recipe must have a valid name');
            }
        }
    }

    /**
     * Listen for storage changes
     */
    public onStorageChanged(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
        if (!this.isStorageAvailable()) {
            throw new StorageError(
                'Chrome storage API is not available',
                'STORAGE_NOT_AVAILABLE'
            );
        }

        chrome.storage.onChanged.addListener(callback);
    }

    /**
     * Remove storage change listener
     */
    public removeStorageListener(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void): void {
        if (chrome.storage.onChanged.hasListener(callback)) {
            chrome.storage.onChanged.removeListener(callback);
        }
    }
}

/**
 * Utility function to get storage service instance
 */
export const getStorageService = (): StorageService => StorageService.getInstance();
