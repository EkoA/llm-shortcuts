/**
 * Chrome Storage API wrapper
 * Provides a clean async/await interface for Chrome extension storage operations
 */
import { AppError, ErrorCategory, ErrorSeverity, errorHandler } from '../utils/error-handler';
/**
 * Storage error types
 */
export class StorageError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'StorageError';
    }
}
/**
 * Chrome Storage API wrapper with async/await support
 */
export class StorageService {
    constructor() {
        this.STORAGE_VERSION = '1.0.0';
        this.STORAGE_KEY = 'llm_shortcuts_data';
    }
    /**
     * Get singleton instance of StorageService
     */
    static getInstance() {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }
    /**
     * Check if Chrome storage API is available
     */
    isStorageAvailable() {
        return !!(chrome && chrome.storage && chrome.storage.local);
    }
    /**
     * Get all data from storage
     */
    async getAllData() {
        if (!this.isStorageAvailable()) {
            throw new StorageError('Chrome storage API is not available', 'STORAGE_NOT_AVAILABLE');
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
        }
        catch (error) {
            errorHandler.handleError(error, 'Storage get data');
            throw new AppError('Failed to retrieve data from storage', 'GET_DATA_FAILED', ErrorCategory.STORAGE, ErrorSeverity.HIGH, error, true, // retryable
            'Failed to load data. Please try again.');
        }
    }
    /**
     * Save all data to storage
     */
    async saveAllData(data) {
        if (!this.isStorageAvailable()) {
            throw new StorageError('Chrome storage API is not available', 'STORAGE_NOT_AVAILABLE');
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
        }
        catch (error) {
            throw new StorageError('Failed to save data to storage', 'SAVE_DATA_FAILED', error);
        }
    }
    /**
     * Get all recipes from storage
     */
    async getRecipes() {
        const data = await this.getAllData();
        return data.recipes;
    }
    /**
     * Save recipes to storage
     */
    async saveRecipes(recipes) {
        const data = await this.getAllData();
        data.recipes = recipes;
        await this.saveAllData(data);
    }
    /**
     * Add a single recipe to storage
     */
    async addRecipe(recipe) {
        const recipes = await this.getRecipes();
        recipes.push(recipe);
        await this.saveRecipes(recipes);
    }
    /**
     * Update a recipe in storage
     */
    async updateRecipe(recipe) {
        const recipes = await this.getRecipes();
        const index = recipes.findIndex(r => r.id === recipe.id);
        if (index === -1) {
            throw new StorageError(`Recipe with ID ${recipe.id} not found`, 'RECIPE_NOT_FOUND');
        }
        recipes[index] = recipe;
        await this.saveRecipes(recipes);
    }
    /**
     * Delete a recipe from storage
     */
    async deleteRecipe(recipeId) {
        const recipes = await this.getRecipes();
        const filteredRecipes = recipes.filter(r => r.id !== recipeId);
        if (filteredRecipes.length === recipes.length) {
            throw new StorageError(`Recipe with ID ${recipeId} not found`, 'RECIPE_NOT_FOUND');
        }
        await this.saveRecipes(filteredRecipes);
    }
    /**
     * Get a single recipe by ID
     */
    async getRecipe(recipeId) {
        const recipes = await this.getRecipes();
        return recipes.find(r => r.id === recipeId) || null;
    }
    /**
     * Clear all data from storage
     */
    async clearAllData() {
        if (!this.isStorageAvailable()) {
            throw new StorageError('Chrome storage API is not available', 'STORAGE_NOT_AVAILABLE');
        }
        try {
            await chrome.storage.local.remove(this.STORAGE_KEY);
        }
        catch (error) {
            throw new StorageError('Failed to clear storage data', 'CLEAR_DATA_FAILED', error);
        }
    }
    /**
     * Get storage usage information
     */
    async getStorageInfo() {
        if (!this.isStorageAvailable()) {
            throw new StorageError('Chrome storage API is not available', 'STORAGE_NOT_AVAILABLE');
        }
        try {
            const usage = await chrome.storage.local.getBytesInUse();
            const quota = chrome.storage.local.QUOTA_BYTES;
            return {
                used: usage,
                available: quota - usage,
                quota: quota
            };
        }
        catch (error) {
            throw new StorageError('Failed to get storage info', 'GET_STORAGE_INFO_FAILED', error);
        }
    }
    /**
     * Export all data as JSON string
     */
    async exportData() {
        const data = await this.getAllData();
        return JSON.stringify(data, null, 2);
    }
    /**
     * Import data from JSON string
     */
    async importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            // Validate imported data
            this.validateStorageSchema(data);
            // Save imported data
            await this.saveAllData(data);
        }
        catch (error) {
            throw new StorageError('Failed to import data - invalid JSON or schema', 'IMPORT_DATA_FAILED', error);
        }
    }
    /**
     * Get user guide from storage
     */
    async getGuide() {
        const data = await this.getAllData();
        return data.guide?.content || '';
    }
    /**
     * Save user guide to storage
     */
    async saveGuide(guideContent) {
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
    async clearGuide() {
        const data = await this.getAllData();
        delete data.guide;
        await this.saveAllData(data);
    }
    /**
     * Get onboarding state from storage
     */
    async getOnboardingState() {
        const data = await this.getAllData();
        return data.onboarding || {
            completed: false,
            currentStep: 0,
            totalSteps: 5,
            showAgain: true
        };
    }
    /**
     * Update onboarding state in storage
     */
    async updateOnboardingState(onboarding) {
        const data = await this.getAllData();
        data.onboarding = onboarding;
        await this.saveAllData(data);
    }
    /**
     * Mark onboarding as completed
     */
    async completeOnboarding() {
        const data = await this.getAllData();
        if (!data.onboarding) {
            data.onboarding = {
                completed: false,
                currentStep: 0,
                totalSteps: 5,
                showAgain: true
            };
        }
        data.onboarding.completed = true;
        data.onboarding.completedAt = Date.now();
        await this.saveAllData(data);
    }
    /**
     * Reset onboarding state
     */
    async resetOnboarding() {
        const data = await this.getAllData();
        data.onboarding = {
            completed: false,
            currentStep: 0,
            totalSteps: 5,
            showAgain: true
        };
        await this.saveAllData(data);
    }
    /**
     * Get default storage schema
     */
    getDefaultSchema() {
        return {
            version: {
                version: this.STORAGE_VERSION,
                lastUpdated: Date.now()
            },
            recipes: [],
            onboarding: {
                completed: false,
                currentStep: 0,
                totalSteps: 5,
                showAgain: true
            }
        };
    }
    /**
     * Validate and migrate storage data
     */
    validateAndMigrateData(data) {
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
        // Ensure onboarding state exists
        if (!data.onboarding) {
            data.onboarding = {
                completed: false,
                currentStep: 0,
                totalSteps: 5,
                showAgain: true
            };
        }
        // Migrate data if version is different
        if (data.version.version !== this.STORAGE_VERSION) {
            data = this.migrateData(data);
        }
        return data;
    }
    /**
     * Migrate data between versions
     */
    migrateData(data) {
        console.log(`Migrating data from version ${data.version?.version} to ${this.STORAGE_VERSION}`);
        // For now, just update the version
        // Future migrations can be added here
        data.version = {
            version: this.STORAGE_VERSION,
            lastUpdated: Date.now()
        };
        return data;
    }
    /**
     * Validate storage schema
     */
    validateStorageSchema(data) {
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
    onStorageChanged(callback) {
        if (!this.isStorageAvailable()) {
            throw new StorageError('Chrome storage API is not available', 'STORAGE_NOT_AVAILABLE');
        }
        chrome.storage.onChanged.addListener(callback);
    }
    /**
     * Remove storage change listener
     */
    removeStorageListener(callback) {
        if (chrome.storage.onChanged.hasListener(callback)) {
            chrome.storage.onChanged.removeListener(callback);
        }
    }
}
/**
 * Utility function to get storage service instance
 */
export const getStorageService = () => StorageService.getInstance();
//# sourceMappingURL=storage.js.map