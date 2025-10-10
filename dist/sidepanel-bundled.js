/**
 * UUID generation utilities
 * Provides methods for generating unique identifiers for recipes
 */
/**
 * Generate a UUID v4 (random UUID)
 * Uses crypto.randomUUID() if available, falls back to manual generation
 */
function generateUUID() {
    // Use native crypto.randomUUID() if available (modern browsers)
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback implementation for older browsers
    return generateUUIDFallback();
}
/**
 * Fallback UUID generation for browsers without crypto.randomUUID()
 * Based on RFC 4122 version 4
 */
function generateUUIDFallback() {
    // Generate 16 random bytes
    const array = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(array);
    }
    else {
        // Fallback to Math.random() if crypto is not available
        for (let i = 0; i < 16; i++) {
            array[i] = Math.floor(Math.random() * 256);
        }
    }
    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant bits
    // Convert to hex string with dashes
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return [
        hex.substring(0, 8),
        hex.substring(8, 12),
        hex.substring(12, 16),
        hex.substring(16, 20),
        hex.substring(20, 32)
    ].join('-');
}
/**
 * Generate a short UUID (8 characters)
 * Useful for display purposes where full UUIDs are too long
 */
function generateShortUUID() {
    const uuid = generateUUID();
    return uuid.replace(/-/g, '').substring(0, 8);
}
/**
 * Validate if a string is a valid UUID
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * Generate a recipe-specific ID
 * Combines timestamp with random component for better uniqueness
 */
function generateRecipeId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `recipe_${timestamp}_${random}`;
}
/**
 * Generate a session ID for tracking recipe executions
 */
function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
}
//# sourceMappingURL=uuid.js.map

/**
 * Data validation utilities
 * Provides validation logic for recipes and other data structures
 */
/**
 * Validation error types
 */
class ValidationError extends Error {
    constructor(message, field, code) {
        super(message);
        this.field = field;
        this.code = code;
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
    MAX_TAGS: 10
};
/**
 * Validate a recipe name
 */
function validateRecipeName(name) {
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
function validateRecipeDescription(description) {
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
function validateRecipePrompt(prompt) {
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
function validateInputType(inputType) {
    const validTypes = ['text', 'image', 'both'];
    if (!validTypes.includes(inputType)) {
        return { isValid: false, error: `Input type must be one of: ${validTypes.join(', ')}` };
    }
    return { isValid: true };
}
/**
 * Validate recipe tags
 */
function validateRecipeTags(tags) {
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
function validateRecipe(recipe) {
    const errors = [];
    const warnings = [];
    // Validate required fields
    if (!recipe.id) {
        errors.push('Recipe ID is required');
    }
    else if (typeof recipe.id !== 'string' || recipe.id.trim().length === 0) {
        errors.push('Recipe ID must be a non-empty string');
    }
    // Validate name
    if (recipe.name !== undefined) {
        const nameValidation = validateRecipeName(recipe.name);
        if (!nameValidation.isValid) {
            errors.push(`Name: ${nameValidation.error}`);
        }
    }
    else {
        errors.push('Recipe name is required');
    }
    // Validate description
    if (recipe.description !== undefined) {
        const descriptionValidation = validateRecipeDescription(recipe.description);
        if (!descriptionValidation.isValid) {
            errors.push(`Description: ${descriptionValidation.error}`);
        }
    }
    else {
        errors.push('Recipe description is required');
    }
    // Validate prompt
    if (recipe.prompt !== undefined) {
        const promptValidation = validateRecipePrompt(recipe.prompt);
        if (!promptValidation.isValid) {
            errors.push(`Prompt: ${promptValidation.error}`);
        }
    }
    else {
        errors.push('Recipe prompt is required');
    }
    // Validate original prompt
    if (recipe.originalPrompt !== undefined) {
        const originalPromptValidation = validateRecipePrompt(recipe.originalPrompt);
        if (!originalPromptValidation.isValid) {
            errors.push(`Original prompt: ${originalPromptValidation.error}`);
        }
    }
    else {
        errors.push('Original prompt is required');
    }
    // Validate input type
    if (recipe.inputType !== undefined) {
        const inputTypeValidation = validateInputType(recipe.inputType);
        if (!inputTypeValidation.isValid) {
            errors.push(`Input type: ${inputTypeValidation.error}`);
        }
    }
    else {
        errors.push('Input type is required');
    }
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
function validateCreateRecipeData(data) {
    const recipe = {
        id: 'temp', // Will be generated later
        name: data.name,
        description: data.description,
        prompt: data.prompt,
        originalPrompt: data.originalPrompt,
        inputType: data.inputType,
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
function validateUpdateRecipeData(data) {
    if (!data.id) {
        return {
            isValid: false,
            errors: ['Recipe ID is required for updates'],
            warnings: []
        };
    }
    const recipe = {
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
function sanitizeUserInput(input) {
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
 * Validate search options
 */
function validateSearchOptions(options) {
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
//# sourceMappingURL=validation.js.map

/**
 * Prompt Interpolation Utility
 * Handles replacement of placeholders in prompt templates with user input
 */
/**
 * Error types for prompt interpolation
 */
class PromptInterpolationError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'PromptInterpolationError';
    }
}
/**
 * Default sanitization options
 */
const DEFAULT_SANITIZATION_OPTIONS = {
    maxLength: 10000,
    allowHtml: false,
    escapeSpecialChars: true
};
/**
 * Sanitize user input to prevent prompt injection attacks
 */
function sanitizeInput(input, options = {}) {
    const opts = { ...DEFAULT_SANITIZATION_OPTIONS, ...options };
    let sanitized = input;
    // Truncate if too long
    if (sanitized.length > opts.maxLength) {
        sanitized = sanitized.substring(0, opts.maxLength);
        console.warn(`Input truncated to ${opts.maxLength} characters`);
    }
    // Remove or escape HTML if not allowed
    if (!opts.allowHtml) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    // Escape special characters that could be used for prompt injection
    if (opts.escapeSpecialChars) {
        // Escape common prompt injection patterns
        sanitized = sanitized
            .replace(/\\/g, '\\\\') // Escape backslashes
            .replace(/"/g, '\\"') // Escape quotes
            .replace(/\n/g, '\\n') // Escape newlines
            .replace(/\r/g, '\\r') // Escape carriage returns
            .replace(/\t/g, '\\t'); // Escape tabs
    }
    return sanitized;
}
/**
 * Interpolate user input into a prompt template
 */
function interpolatePrompt(template, userInput, options = {}) {
    try {
        if (!template || typeof template !== 'string') {
            throw new PromptInterpolationError('Invalid prompt template', 'INVALID_TEMPLATE');
        }
        if (typeof userInput !== 'string') {
            throw new PromptInterpolationError('User input must be a string', 'INVALID_INPUT');
        }
        // Sanitize user input
        const sanitizedInput = sanitizeInput(userInput, options);
        // Replace common placeholder patterns
        let interpolated = template
            .replace(/\{user_input\}/g, sanitizedInput)
            .replace(/\{userInput\}/g, sanitizedInput)
            .replace(/\{input\}/g, sanitizedInput)
            .replace(/\{text\}/g, sanitizedInput)
            .replace(/\{content\}/g, sanitizedInput);
        // Check if any placeholders remain (warn user)
        const remainingPlaceholders = interpolated.match(/\{[^}]+\}/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            console.warn('Unreplaced placeholders found:', remainingPlaceholders);
        }
        return interpolated;
    }
    catch (error) {
        if (error instanceof PromptInterpolationError) {
            throw error;
        }
        throw new PromptInterpolationError('Failed to interpolate prompt', 'INTERPOLATION_FAILED', error);
    }
}
/**
 * Interpolate multiple inputs into a prompt template
 */
function interpolateMultipleInputs(template, inputs, options = {}) {
    try {
        if (!template || typeof template !== 'string') {
            throw new PromptInterpolationError('Invalid prompt template', 'INVALID_TEMPLATE');
        }
        if (!inputs || typeof inputs !== 'object') {
            throw new PromptInterpolationError('Inputs must be an object', 'INVALID_INPUTS');
        }
        let interpolated = template;
        // Replace each input placeholder
        for (const [key, value] of Object.entries(inputs)) {
            if (typeof value !== 'string') {
                console.warn(`Skipping non-string input for key: ${key}`);
                continue;
            }
            const sanitizedValue = sanitizeInput(value, options);
            const placeholder = `{${key}}`;
            interpolated = interpolated.replace(new RegExp(placeholder, 'g'), sanitizedValue);
        }
        // Check for remaining placeholders
        const remainingPlaceholders = interpolated.match(/\{[^}]+\}/g);
        if (remainingPlaceholders && remainingPlaceholders.length > 0) {
            console.warn('Unreplaced placeholders found:', remainingPlaceholders);
        }
        return interpolated;
    }
    catch (error) {
        if (error instanceof PromptInterpolationError) {
            throw error;
        }
        throw new PromptInterpolationError('Failed to interpolate multiple inputs', 'MULTIPLE_INTERPOLATION_FAILED', error);
    }
}
/**
 * Extract placeholder names from a template
 */
function extractPlaceholders(template) {
    if (!template || typeof template !== 'string') {
        return [];
    }
    const matches = template.match(/\{([^}]+)\}/g);
    if (!matches) {
        return [];
    }
    return matches.map(match => match.slice(1, -1)); // Remove { and }
}
/**
 * Validate that all required placeholders are provided
 */
function validatePlaceholders(template, providedInputs) {
    const requiredPlaceholders = extractPlaceholders(template);
    const missing = requiredPlaceholders.filter(placeholder => !providedInputs.includes(placeholder));
    const extra = providedInputs.filter(input => !requiredPlaceholders.includes(input));
    return {
        isValid: missing.length === 0,
        missing,
        extra
    };
}
/**
 * Create a preview of the interpolated prompt without executing
 */
function previewInterpolation(template, userInput, options = {}) {
    const placeholders = extractPlaceholders(template);
    const sanitizedInput = sanitizeInput(userInput, options);
    const interpolated = interpolatePrompt(template, userInput, options);
    return {
        original: template,
        interpolated,
        placeholders,
        sanitizedInput
    };
}
//# sourceMappingURL=prompt-interpolation.js.map

/**
 * Recipe model interfaces and types
 * Defines the data structure for LLM prompt templates
 */

//# sourceMappingURL=recipe.model.js.map

/**
 * Chrome Storage API wrapper
 * Provides a clean async/await interface for Chrome extension storage operations
 */
/**
 * Storage error types
 */
class StorageError extends Error {
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
class StorageService {
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
            throw new StorageError('Failed to retrieve data from storage', 'GET_DATA_FAILED', error);
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
     * Get default storage schema
     */
    getDefaultSchema() {
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
const getStorageService = () => StorageService.getInstance();
//# sourceMappingURL=storage.js.map

/**
 * Recipe Manager
 * Provides high-level CRUD operations for recipe management
 */



/**
 * Recipe Manager error types
 */
class RecipeManagerError extends Error {
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
class RecipeManager {
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
                inputType: data.inputType,
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
                stats.recipesByInputType[recipe.inputType]++;
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
                inputType: originalRecipe.inputType,
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
const getRecipeManager = () => RecipeManager.getInstance();
//# sourceMappingURL=recipe-manager.js.map

/**
 * Chrome Built-in AI Prompt API wrapper
 * Provides a clean interface for interacting with Chrome's on-device AI model
 */
/**
 * Error types for AI API operations
 */
class AIError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'AIError';
    }
}
/**
 * Chrome AI API Client
 * Handles all interactions with Chrome's built-in AI capabilities
 */
class AIClient {
    constructor() {
        this.capabilities = null;
        this.isInitialized = false;
    }
    /**
     * Get singleton instance of AIClient
     */
    static getInstance() {
        if (!AIClient.instance) {
            AIClient.instance = new AIClient();
        }
        return AIClient.instance;
    }
    /**
     * Check if Chrome AI API is available and initialize capabilities
     */
    async initialize() {
        if (this.isInitialized && this.capabilities) {
            return this.capabilities;
        }
        try {
            // Check if window.ai is available
            if (!window.ai || !window.ai.languageModel) {
                console.error('Chrome AI API not available. Debug info:');
                console.error('- window.ai:', !!window.ai);
                console.error('- window.ai.languageModel:', !!(window.ai && window.ai.languageModel));
                console.error('- User agent:', navigator.userAgent);
                console.error('- Chrome version check:', this.getChromeVersion());
                throw new AIError('Chrome AI API is not available. Please ensure you are using Chrome 127+ with AI features enabled. Check chrome://flags/#optimization-guide-on-device-model and chrome://flags/#prompt-api-for-gemini-nano', 'API_NOT_AVAILABLE');
            }
            // Check AI availability status
            const availability = await window.ai.languageModel.availability();
            console.log('AI availability status:', availability);
            if (availability === 'unavailable') {
                throw new AIError('AI model is not available on this device. Please check Chrome flags and ensure you are using Chrome 127+', 'MODEL_UNAVAILABLE');
            }
            if (availability === 'downloadable') {
                console.log('AI model needs to be downloaded. This may take some time...');
                // The model will be downloaded when we create a session
            }
            if (availability === 'downloading') {
                console.log('AI model is currently downloading. Please wait...');
                // Wait for download to complete
                let downloadStatus = availability;
                while (downloadStatus === 'downloading') {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    downloadStatus = await window.ai.languageModel.availability();
                }
                if (downloadStatus !== 'available') {
                    throw new AIError('AI model download failed or is not available', 'DOWNLOAD_FAILED');
                }
            }
            // Get capabilities
            this.capabilities = await window.ai.languageModel.capabilities();
            this.isInitialized = true;
            console.log('AI Client initialized with capabilities:', this.capabilities);
            return this.capabilities;
        }
        catch (error) {
            const aiError = new AIError('Failed to initialize AI client', 'INITIALIZATION_FAILED', error);
            console.error('AI Client initialization failed:', aiError);
            throw aiError;
        }
    }
    /**
     * Check if AI API is available without full initialization
     */
    async isAvailable() {
        try {
            if (!window.ai || !window.ai.languageModel) {
                return false;
            }
            const availability = await window.ai.languageModel.availability();
            return availability === 'available';
        }
        catch (error) {
            console.error('Error checking AI availability:', error);
            return false;
        }
    }
    /**
     * Get current capabilities (requires initialization)
     */
    getCapabilities() {
        return this.capabilities;
    }
    /**
     * Create a new AI session for prompt execution
     */
    async createSession(options) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        if (!window.ai?.languageModel) {
            throw new AIError('AI API not available', 'API_NOT_AVAILABLE');
        }
        try {
            const session = await window.ai.languageModel.create({
                temperature: options?.temperature ?? 0.7,
                topK: options?.topK ?? 40
            });
            return session;
        }
        catch (error) {
            throw new AIError('Failed to create AI session', 'SESSION_CREATION_FAILED', error);
        }
    }
    /**
     * Execute a prompt and get the response
     */
    async executePrompt(prompt, options) {
        const session = await this.createSession(options);
        try {
            const response = await session.prompt(prompt);
            session.destroy();
            return response;
        }
        catch (error) {
            session.destroy();
            if (error instanceof AIError) {
                throw error;
            }
            throw new AIError('Failed to execute prompt', 'PROMPT_EXECUTION_FAILED', error);
        }
    }
    /**
     * Execute a prompt with streaming response
     */
    async *executePromptStreaming(prompt, options) {
        const session = await this.createSession(options);
        try {
            const stream = session.promptStreaming(prompt);
            for await (const chunk of stream) {
                yield chunk;
            }
            session.destroy();
        }
        catch (error) {
            session.destroy();
            if (error instanceof AIError) {
                throw error;
            }
            throw new AIError('Failed to execute streaming prompt', 'STREAMING_EXECUTION_FAILED', error);
        }
    }
    /**
     * Test AI API availability and basic functionality
     */
    async testConnection() {
        try {
            const capabilities = await this.initialize();
            // Test basic prompt execution
            const testPrompt = "Say 'Hello, AI is working!'";
            await this.executePrompt(testPrompt);
            return {
                available: true,
                capabilities
            };
        }
        catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Get Chrome version from user agent
     */
    getChromeVersion() {
        const userAgent = navigator.userAgent;
        const chromeMatch = userAgent.match(/Chrome\/(\d+)/);
        return chromeMatch?.[1] || 'Unknown';
    }
}
/**
 * Utility function to get AI client instance
 */
const getAIClient = () => AIClient.getInstance();
/**
 * Check if Chrome AI API is available in the current environment
 */
const isAIAvailable = async () => {
    try {
        if (!window.ai || !window.ai.languageModel) {
            return false;
        }
        const availability = await window.ai.languageModel.availability();
        return availability === 'available';
    }
    catch (error) {
        console.error('Error checking AI availability:', error);
        return false;
    }
};
// Make functions available globally for browser environment
if (typeof window !== 'undefined') {
    window.getAIClient = getAIClient;
    window.isAIAvailable = isAIAvailable;
    console.log('AI Client: Functions exposed globally');
}
//# sourceMappingURL=ai-client.js.map

/**
 * Prompt Executor Service
 * Handles AI session management and prompt execution with streaming support
 */


/**
 * Error types for prompt execution
 */
class PromptExecutorError extends Error {
    constructor(message, code, originalError) {
        super(message);
        this.code = code;
        this.originalError = originalError;
        this.name = 'PromptExecutorError';
    }
}
/**
 * Prompt Executor Service
 * Manages AI session lifecycle and prompt execution
 */
class PromptExecutor {
    constructor() {
        this.activeSessions = new Map();
        this.executionHistory = new Map();
        this.aiClient = AIClient.getInstance();
    }
    /**
     * Get singleton instance of PromptExecutor
     */
    static getInstance() {
        if (!PromptExecutor.instance) {
            PromptExecutor.instance = new PromptExecutor();
        }
        return PromptExecutor.instance;
    }
    /**
     * Execute a recipe with user input
     */
    async executeRecipe(recipe, userInput, options = {}) {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        try {
            // Validate inputs
            if (!recipe || !userInput) {
                throw new PromptExecutorError('Recipe and user input are required', 'INVALID_INPUTS');
            }
            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError('AI client is not available. Please ensure Chrome AI API is enabled.', 'AI_CLIENT_NOT_AVAILABLE');
            }
            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, options.sanitization);
            console.log('Executing recipe:', recipe.name);
            console.log('Interpolated prompt:', interpolatedPrompt);
            // Execute prompt
            const response = await this.aiClient.executePrompt(interpolatedPrompt, {
                temperature: options.temperature ?? 0.7,
                topK: options.topK ?? 40
            });
            const executionTime = Date.now() - startTime;
            const result = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(interpolatedPrompt + response)
            };
            // Store execution history
            this.executionHistory.set(sessionId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };
            // Store failed execution
            this.executionHistory.set(sessionId, result);
            console.error('Recipe execution failed:', error);
            throw new PromptExecutorError('Failed to execute recipe', 'EXECUTION_FAILED', error);
        }
    }
    /**
     * Execute a recipe with streaming response
     */
    async *executeRecipeStreaming(recipe, userInput, options = {}) {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        try {
            // Validate inputs
            if (!recipe || !userInput) {
                throw new PromptExecutorError('Recipe and user input are required', 'INVALID_INPUTS');
            }
            // Check if AI client is available
            if (!(await this.aiClient.isAvailable())) {
                throw new PromptExecutorError('AI client is not available. Please ensure Chrome AI API is enabled.', 'AI_CLIENT_NOT_AVAILABLE');
            }
            // Interpolate prompt with user input
            const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, options.sanitization);
            console.log('Executing recipe with streaming:', recipe.name);
            let fullResponse = '';
            let tokenCount = 0;
            // Execute streaming prompt
            const stream = this.aiClient.executePromptStreaming(interpolatedPrompt, {
                temperature: options.temperature ?? 0.7,
                topK: options.topK ?? 40
            });
            for await (const chunk of stream) {
                fullResponse += chunk;
                tokenCount += this.estimateTokenCount(chunk);
                yield chunk;
            }
            const executionTime = Date.now() - startTime;
            const result = {
                success: true,
                response: fullResponse,
                executionTime,
                tokensUsed: tokenCount
            };
            // Store execution history
            this.executionHistory.set(sessionId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };
            // Store failed execution
            this.executionHistory.set(sessionId, result);
            console.error('Streaming execution failed:', error);
            throw new PromptExecutorError('Failed to execute recipe with streaming', 'STREAMING_EXECUTION_FAILED', error);
        }
    }
    /**
     * Execute a custom prompt (not from a recipe)
     */
    async executeCustomPrompt(prompt, options = {}) {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        try {
            // Sanitize prompt if needed
            const sanitizedPrompt = options.sanitization
                ? sanitizeInput(prompt, options.sanitization)
                : prompt;
            console.log('Executing custom prompt');
            // Execute prompt
            const response = await this.aiClient.executePrompt(sanitizedPrompt, {
                temperature: options.temperature ?? 0.7,
                topK: options.topK ?? 40
            });
            const executionTime = Date.now() - startTime;
            const result = {
                success: true,
                response,
                executionTime,
                tokensUsed: this.estimateTokenCount(sanitizedPrompt + response)
            };
            // Store execution history
            this.executionHistory.set(sessionId, result);
            return result;
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime
            };
            // Store failed execution
            this.executionHistory.set(sessionId, result);
            console.error('Custom prompt execution failed:', error);
            throw new PromptExecutorError('Failed to execute custom prompt', 'CUSTOM_EXECUTION_FAILED', error);
        }
    }
    /**
     * Get execution history for a session
     */
    getExecutionHistory(sessionId) {
        return this.executionHistory.get(sessionId);
    }
    /**
     * Get all execution history
     */
    getAllExecutionHistory() {
        return Array.from(this.executionHistory.values());
    }
    /**
     * Clear execution history
     */
    clearExecutionHistory() {
        this.executionHistory.clear();
    }
    /**
     * Get execution statistics
     */
    getExecutionStats() {
        const executions = this.getAllExecutionHistory();
        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(e => e.success).length;
        const failedExecutions = totalExecutions - successfulExecutions;
        const averageExecutionTime = executions.length > 0
            ? executions.reduce((sum, e) => sum + e.executionTime, 0) / executions.length
            : 0;
        const totalTokensUsed = executions.reduce((sum, e) => sum + (e.tokensUsed || 0), 0);
        return {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            averageExecutionTime,
            totalTokensUsed
        };
    }
    /**
     * Test AI connection and basic functionality
     */
    async testConnection() {
        try {
            return await this.aiClient.testConnection();
        }
        catch (error) {
            return {
                available: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Clean up active sessions
     */
    async cleanup() {
        try {
            // Clean up any active sessions
            for (const [sessionId, session] of this.activeSessions) {
                try {
                    if (session && typeof session.destroy === 'function') {
                        session.destroy();
                    }
                }
                catch (error) {
                    console.warn(`Failed to destroy session ${sessionId}:`, error);
                }
            }
            this.activeSessions.clear();
        }
        catch (error) {
            console.error('Failed to cleanup sessions:', error);
        }
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Estimate token count for a text (rough approximation)
     */
    estimateTokenCount(text) {
        // Rough estimation: 1 token ≈ 4 characters for English text
        return Math.ceil(text.length / 4);
    }
}
/**
 * Utility function to get prompt executor instance
 */
const getPromptExecutor = () => PromptExecutor.getInstance();
//# sourceMappingURL=prompt-executor.js.map


/**
 * Side Panel Controller for LLM Shortcuts
 * Handles UI interactions and AI API integration
 */
// DOM Elements
const aiStatusEl = document.getElementById('ai-status');
const recipeListEl = document.getElementById('recipe-list');
const recipeFormEl = document.getElementById('recipe-form');
const recipeExecutionEl = document.getElementById('recipe-execution');
// Buttons
const createRecipeBtn = document.getElementById('create-recipe-btn');
const cancelRecipeBtn = document.getElementById('cancel-recipe');
const backToListBtn = document.getElementById('back-to-list');
const executeRecipeBtn = document.getElementById('execute-recipe');
const copyResultBtn = document.getElementById('copy-result');
const clearResultBtn = document.getElementById('clear-result');
// Form elements
const recipeForm = document.getElementById('recipe-form-element');
const userInputEl = document.getElementById('user-input');
const resultContentEl = document.getElementById('result-content');
// Search elements
let searchInput = null;
let sortSelect = null;
// State
let aiClient = null;
let recipeManager = null;
let promptExecutor = null;
let currentRecipes = [];
let currentRecipe = null;
let isExecuting = false;
/**
 * Initialize the side panel
 */
async function initialize() {
    console.log('Initializing LLM Shortcuts side panel');
    // Initialize recipe manager
    recipeManager = new RecipeManager();
    // Initialize prompt executor
    promptExecutor = getPromptExecutor();
    // Debug: Check if AI client functions are loaded
    console.log('AI Client loaded. Functions available:');
    console.log('isAIAvailable:', typeof isAIAvailable);
    console.log('getAIClient:', typeof getAIClient);
    console.log('window.ai:', window.ai);
    // Check AI availability
    await checkAIAvailability();
    // Set up event listeners
    setupEventListeners();
    // Load initial state
    await loadInitialState();
}
/**
 * Check if Chrome AI API is available
 */
async function checkAIAvailability() {
    const statusEl = aiStatusEl.querySelector('.loading');
    try {
        const isAvailable = await isAIAvailable();
        // if (!isAvailable) {
        //     throw new Error('Chrome AI API is not available. Please ensure you are using Chrome 127+ with AI features enabled.');
        // }
        aiClient = getAIClient();
        const testResult = await aiClient.testConnection();
        if (testResult.available) {
            statusEl.innerHTML = `
        <div class="success">
          ✅ AI is available and working
        </div>
      `;
            aiStatusEl.className = 'ai-status success';
            // Show recipe list
            recipeListEl.style.display = 'block';
        }
        else {
            throw new Error(testResult.error || 'AI test failed');
        }
    }
    catch (error) {
        console.error('AI availability check failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        statusEl.innerHTML = `
      <div class="error">
        ❌ AI not available: ${errorMessage}
        <br><small>Current Chrome version: ${chromeVersion}</small>
        <br><small>Required: Chrome 127+ with AI features enabled</small>
        <br><small>Please check these Chrome flags:</small>
        <br><small>• chrome://flags/#optimization-guide-on-device-model</small>
        <br><small>• chrome://flags/#prompt-api-for-gemini-nano</small>
      </div>
    `;
        aiStatusEl.className = 'ai-status error';
    }
}
/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Recipe creation
    createRecipeBtn?.addEventListener('click', showRecipeForm);
    cancelRecipeBtn?.addEventListener('click', hideRecipeForm);
    // Navigation
    backToListBtn?.addEventListener('click', showRecipeList);
    // Form submission
    recipeForm?.addEventListener('submit', handleRecipeSubmit);
    // Recipe execution
    executeRecipeBtn?.addEventListener('click', handleRecipeExecution);
    copyResultBtn?.addEventListener('click', copyResult);
    clearResultBtn?.addEventListener('click', clearResult);
    // Input type change
    const inputTypeSelect = document.getElementById('recipe-input-type');
    inputTypeSelect?.addEventListener('change', handleInputTypeChange);
    // Search functionality
    searchInput?.addEventListener('input', debounce(handleSearch, 300));
    sortSelect?.addEventListener('change', handleSortChange);
    // Recipe list interactions (event delegation)
    recipeListEl?.addEventListener('click', handleRecipeListClick);
}
/**
 * Load initial state
 */
async function loadInitialState() {
    try {
        // Load recipes from storage
        await loadRecipes();
        // Show recipe list
        showRecipeList();
    }
    catch (error) {
        console.error('Failed to load initial state:', error);
        showRecipeList(); // Show empty state on error
    }
}
/**
 * Show recipe list view
 */
function showRecipeList() {
    recipeListEl.style.display = 'block';
    recipeFormEl.style.display = 'none';
    recipeExecutionEl.style.display = 'none';
}
/**
 * Show recipe creation form
 */
function showRecipeForm() {
    recipeListEl.style.display = 'none';
    recipeFormEl.style.display = 'block';
    recipeExecutionEl.style.display = 'none';
    // Reset form
    recipeForm.reset();
}
/**
 * Hide recipe creation form
 */
function hideRecipeForm() {
    showRecipeList();
}
/**
 * Handle recipe form submission
 */
async function handleRecipeSubmit(event) {
    event.preventDefault();
    const formData = new FormData(recipeForm);
    const recipeData = {
        name: formData.get('name'),
        description: formData.get('description'),
        prompt: formData.get('prompt'),
        originalPrompt: formData.get('prompt'), // Same as prompt for now
        inputType: formData.get('inputType')
    };
    try {
        console.log('Creating recipe:', recipeData);
        // Create recipe using recipe manager
        const recipe = await recipeManager.createRecipe(recipeData);
        console.log('Recipe created successfully:', recipe.id);
        // Reload recipes and show list
        await loadRecipes();
        showRecipeList();
        // Show success message
        alert('Recipe created successfully!');
    }
    catch (error) {
        console.error('Failed to create recipe:', error);
        alert(`Failed to create recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Handle input type change
 */
function handleInputTypeChange(event) {
    const select = event.target;
    const imageSection = document.getElementById('image-input-section');
    if (select.value === 'image' || select.value === 'both') {
        imageSection.style.display = 'block';
    }
    else {
        imageSection.style.display = 'none';
    }
}
/**
 * Handle recipe execution
 */
async function handleRecipeExecution() {
    if (!promptExecutor) {
        alert('Prompt executor not available');
        return;
    }
    if (!currentRecipe) {
        alert('No recipe selected');
        return;
    }
    const userInput = userInputEl.value.trim();
    if (!userInput) {
        alert('Please enter some input');
        return;
    }
    if (isExecuting) {
        alert('Recipe is already executing');
        return;
    }
    // Show loading state
    isExecuting = true;
    executeRecipeBtn.disabled = true;
    executeRecipeBtn.textContent = 'Executing...';
    // Clear previous result
    resultContentEl.textContent = '';
    document.getElementById('execution-result').style.display = 'none';
    try {
        console.log('Executing recipe:', currentRecipe.name);
        // Execute recipe with streaming
        const result = await executeRecipeWithStreaming(currentRecipe, userInput);
        if (result.success) {
            // Show result
            resultContentEl.textContent = result.response || '';
            document.getElementById('execution-result').style.display = 'block';
            // Mark recipe as used
            try {
                await recipeManager.markRecipeAsUsed(currentRecipe.id);
                console.log('Recipe marked as used');
            }
            catch (error) {
                console.warn('Failed to mark recipe as used:', error);
                // Don't show error to user as this is not critical
            }
        }
        else {
            throw new Error(result.error || 'Execution failed');
        }
    }
    catch (error) {
        console.error('Recipe execution failed:', error);
        showExecutionError(error instanceof Error ? error.message : 'Unknown error');
    }
    finally {
        isExecuting = false;
        executeRecipeBtn.disabled = false;
        executeRecipeBtn.textContent = 'Execute Recipe';
    }
}
/**
 * Execute recipe with streaming response
 */
async function executeRecipeWithStreaming(recipe, userInput) {
    try {
        // Check if streaming is supported
        const streamingSupported = true; // Assume streaming is supported for now
        if (streamingSupported) {
            return await executeWithStreaming(recipe, userInput);
        }
        else {
            return await executeWithoutStreaming(recipe, userInput);
        }
    }
    catch (error) {
        console.error('Streaming execution failed, falling back to non-streaming:', error);
        return await executeWithoutStreaming(recipe, userInput);
    }
}
/**
 * Execute recipe with streaming
 */
async function executeWithStreaming(recipe, userInput) {
    const resultContent = resultContentEl;
    let fullResponse = '';
    try {
        const stream = promptExecutor.executeRecipeStreaming(recipe, userInput, {
            streaming: true,
            sanitization: {
                maxLength: 10000,
                allowHtml: false,
                escapeSpecialChars: true
            }
        });
        // Show result container
        document.getElementById('execution-result').style.display = 'block';
        resultContent.textContent = '';
        // Process streaming response
        for await (const chunk of stream) {
            fullResponse += chunk;
            resultContent.textContent = fullResponse;
            // Scroll to bottom to show new content
            resultContent.scrollTop = resultContent.scrollHeight;
        }
        return {
            success: true,
            response: fullResponse
        };
    }
    catch (error) {
        console.error('Streaming execution failed:', error);
        throw error;
    }
}
/**
 * Execute recipe without streaming
 */
async function executeWithoutStreaming(recipe, userInput) {
    return await promptExecutor.executeRecipe(recipe, userInput, {
        streaming: false,
        sanitization: {
            maxLength: 10000,
            allowHtml: false,
            escapeSpecialChars: true
        }
    });
}
/**
 * Show execution error
 */
function showExecutionError(errorMessage) {
    const errorHtml = `
        <div class="error-message">
            <h4>Execution Failed</h4>
            <p>${escapeHtml(errorMessage)}</p>
            <button onclick="retryExecution()" class="btn btn-secondary">Retry</button>
        </div>
    `;
    resultContentEl.innerHTML = errorHtml;
    document.getElementById('execution-result').style.display = 'block';
}
/**
 * Retry execution (called from error message)
 */
function retryExecution() {
    if (currentRecipe && !isExecuting) {
        handleRecipeExecution();
    }
}
/**
 * Copy result to clipboard
 */
async function copyResult() {
    try {
        const resultText = resultContentEl.textContent || '';
        if (!resultText.trim()) {
            alert('No result to copy');
            return;
        }
        await navigator.clipboard.writeText(resultText);
        copyResultBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyResultBtn.textContent = 'Copy Result';
        }, 2000);
    }
    catch (error) {
        console.error('Failed to copy result:', error);
        alert('Failed to copy result');
    }
}
/**
 * Clear result
 */
function clearResult() {
    resultContentEl.textContent = '';
    document.getElementById('execution-result').style.display = 'none';
    document.getElementById('execution-stats').style.display = 'none';
}
/**
 * Load recipes from storage
 */
async function loadRecipes() {
    try {
        currentRecipes = await recipeManager.getAllRecipes();
        renderRecipeList();
    }
    catch (error) {
        console.error('Failed to load recipes:', error);
        currentRecipes = [];
        renderRecipeList();
    }
}
/**
 * Render the recipe list
 */
function renderRecipeList() {
    if (!recipeListEl)
        return;
    if (currentRecipes.length === 0) {
        recipeListEl.innerHTML = `
            <div class="empty-state">
                <h3>No recipes yet</h3>
                <p>Create your first recipe to get started!</p>
                <button id="create-recipe-btn" class="btn btn-primary">Create Recipe</button>
            </div>
        `;
        // Re-attach event listener for the new button
        const newCreateBtn = document.getElementById('create-recipe-btn');
        newCreateBtn?.addEventListener('click', showRecipeForm);
        return;
    }
    const recipesHtml = currentRecipes.map(recipe => `
        <div class="recipe-item" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
                <div class="recipe-actions">
                    <button class="btn-icon" data-action="execute" title="Execute Recipe">
                        ▶️
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        ✏️
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        🗑️
                    </button>
                </div>
            </div>
            <p class="recipe-description">${escapeHtml(recipe.description || 'No description')}</p>
            <div class="recipe-meta">
                <span class="recipe-type">${recipe.inputType}</span>
                ${recipe.lastUsedAt ? `<span class="recipe-last-used">Last used: ${formatDate(recipe.lastUsedAt)}</span>` : ''}
                <span class="recipe-created">Created: ${formatDate(recipe.createdAt)}</span>
            </div>
        </div>
    `).join('');
    recipeListEl.innerHTML = `
        <div class="recipe-list-header">
            <div class="search-container">
                <input type="text" id="search-recipes" placeholder="Search recipes..." class="search-input">
            </div>
            <div class="sort-container">
                <select id="sort-recipes" class="sort-select">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="created-desc">Newest First</option>
                    <option value="created-asc">Oldest First</option>
                    <option value="lastUsed-desc">Recently Used</option>
                </select>
            </div>
        </div>
        <div class="recipe-list-content">
            ${recipesHtml}
        </div>
    `;
    // Re-attach event listeners for search and sort
    const newSearchInput = document.getElementById('search-recipes');
    const newSortSelect = document.getElementById('sort-recipes');
    if (newSearchInput) {
        searchInput = newSearchInput;
        newSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    if (newSortSelect) {
        sortSelect = newSortSelect;
        newSortSelect.addEventListener('change', handleSortChange);
    }
}
/**
 * Handle recipe list click events (event delegation)
 */
function handleRecipeListClick(event) {
    const target = event.target;
    const recipeItem = target.closest('.recipe-item');
    if (!recipeItem)
        return;
    const recipeId = recipeItem.dataset['recipeId'];
    if (!recipeId)
        return;
    const action = target.dataset['action'];
    switch (action) {
        case 'execute':
            executeRecipe(recipeId);
            break;
        case 'edit':
            editRecipe(recipeId);
            break;
        case 'delete':
            deleteRecipe(recipeId);
            break;
        default:
            // Click on recipe item itself - execute it
            executeRecipe(recipeId);
            break;
    }
}
/**
 * Handle search input
 */
function handleSearch() {
    if (!searchInput)
        return;
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        // Show all recipes if no search term
        renderRecipeList();
        return;
    }
    // Filter recipes based on search term
    const filteredRecipes = currentRecipes.filter(recipe => recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm) ||
        recipe.prompt.toLowerCase().includes(searchTerm));
    renderFilteredRecipeList(filteredRecipes);
}
/**
 * Handle sort change
 */
function handleSortChange() {
    if (!sortSelect)
        return;
    const sortValue = sortSelect.value;
    const [sortBy, direction] = sortValue.split('-');
    const sortedRecipes = [...currentRecipes].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'created':
                comparison = a.createdAt - b.createdAt;
                break;
            case 'lastUsed':
                const aLastUsed = a.lastUsedAt || 0;
                const bLastUsed = b.lastUsedAt || 0;
                comparison = aLastUsed - bLastUsed;
                break;
        }
        return direction === 'desc' ? -comparison : comparison;
    });
    renderFilteredRecipeList(sortedRecipes);
}
/**
 * Render filtered recipe list
 */
function renderFilteredRecipeList(recipes) {
    if (!recipeListEl)
        return;
    const recipeListContent = recipeListEl.querySelector('.recipe-list-content');
    if (!recipeListContent)
        return;
    if (recipes.length === 0) {
        recipeListContent.innerHTML = `
            <div class="empty-state">
                <h3>No recipes found</h3>
                <p>Try adjusting your search terms.</p>
            </div>
        `;
        return;
    }
    const recipesHtml = recipes.map(recipe => `
        <div class="recipe-item" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
                <div class="recipe-actions">
                    <button class="btn-icon" data-action="execute" title="Execute Recipe">
                        ▶️
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        ✏️
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        🗑️
                    </button>
                </div>
            </div>
            <p class="recipe-description">${escapeHtml(recipe.description || 'No description')}</p>
            <div class="recipe-meta">
                <span class="recipe-type">${recipe.inputType}</span>
                ${recipe.lastUsedAt ? `<span class="recipe-last-used">Last used: ${formatDate(recipe.lastUsedAt)}</span>` : ''}
                <span class="recipe-created">Created: ${formatDate(recipe.createdAt)}</span>
            </div>
        </div>
    `).join('');
    recipeListContent.innerHTML = recipesHtml;
}
/**
 * Execute a recipe
 */
async function executeRecipe(recipeId) {
    try {
        const recipe = await recipeManager.getRecipe(recipeId);
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        currentRecipe = recipe;
        showRecipeExecution();
    }
    catch (error) {
        console.error('Failed to load recipe:', error);
        alert('Failed to load recipe');
    }
}
/**
 * Edit a recipe
 */
async function editRecipe(recipeId) {
    try {
        const recipe = await recipeManager.getRecipe(recipeId);
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        // TODO: Implement edit functionality in Phase 5
        alert('Edit functionality will be implemented in Phase 5');
    }
    catch (error) {
        console.error('Failed to load recipe for editing:', error);
        alert('Failed to load recipe for editing');
    }
}
/**
 * Delete a recipe
 */
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return;
    }
    try {
        await recipeManager.deleteRecipe(recipeId);
        await loadRecipes(); // Reload the list
    }
    catch (error) {
        console.error('Failed to delete recipe:', error);
        alert('Failed to delete recipe');
    }
}
/**
 * Show recipe execution view
 */
function showRecipeExecution() {
    if (!currentRecipe)
        return;
    recipeListEl.style.display = 'none';
    recipeFormEl.style.display = 'none';
    recipeExecutionEl.style.display = 'block';
    // Update execution view with recipe details
    const executionRecipeName = document.getElementById('execution-recipe-name');
    const executionRecipeDescription = document.getElementById('execution-recipe-description');
    if (executionRecipeName) {
        executionRecipeName.textContent = currentRecipe.name;
    }
    if (executionRecipeDescription) {
        executionRecipeDescription.textContent = currentRecipe.description || 'No description';
    }
    // Show/hide image input based on recipe type
    const imageSection = document.getElementById('image-input-section');
    if (imageSection) {
        if (currentRecipe.inputType === 'image' || currentRecipe.inputType === 'both') {
            imageSection.style.display = 'block';
        }
        else {
            imageSection.style.display = 'none';
        }
    }
    // Clear previous input
    if (userInputEl) {
        userInputEl.value = '';
    }
    // Hide previous result
    const executionResult = document.getElementById('execution-result');
    if (executionResult) {
        executionResult.style.display = 'none';
    }
}
/**
 * Utility function to escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Utility function to format dates
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return 'Today';
    }
    else if (diffDays === 1) {
        return 'Yesterday';
    }
    else if (diffDays < 7) {
        return `${diffDays} days ago`;
    }
    else {
        return date.toLocaleDateString();
    }
}
/**
 * Debounce utility function
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
}
else {
    initialize();
}
//# sourceMappingURL=sidepanel.js.map