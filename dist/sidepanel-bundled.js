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
function validateCreateRecipeData(data) {
    const recipe = {
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
 * Interpolate user input into a prompt template with optional guide prepending
 */
function interpolatePrompt(template, userInput, options = {}, guide) {
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
        // CRITICAL: If no placeholders were found and replaced, append the user input
        // This ensures user input is always included even if the template has no placeholders
        if (interpolated === template) {
            // No placeholders were replaced, so append the user input
            interpolated = template + ' ' + sanitizedInput;
        }
        // Prepend guide if provided
        if (guide && guide.trim().length > 0) {
            interpolated = guide.trim() + '\n\n' + interpolated;
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
            // Check if LanguageModel is available
            if (!window.LanguageModel) {
                console.error('Chrome AI API not available. Debug info:');
                console.error('- LanguageModel:', !!window.LanguageModel);
                console.error('- User agent:', navigator.userAgent);
                console.error('- Chrome version check:', this.getChromeVersion());
                throw new AIError('Chrome AI API is not available. Please ensure you are using Chrome 127+ with AI features enabled. Check chrome://flags/#optimization-guide-on-device-model and chrome://flags/#prompt-api-for-gemini-nano', 'API_NOT_AVAILABLE');
            }
            // Check AI availability status
            const availability = await window.LanguageModel.availability();
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
                    downloadStatus = await window.LanguageModel.availability();
                }
                if (downloadStatus !== 'available') {
                    throw new AIError('AI model download failed or is not available', 'DOWNLOAD_FAILED');
                }
            }
            // Get capabilities (if available)
            try {
                if (typeof window.LanguageModel.capabilities === 'function') {
                    this.capabilities = await window.LanguageModel.capabilities();
                    console.log('AI Client initialized with capabilities:', this.capabilities);
                }
                else {
                    console.log('AI capabilities not available, using basic AI functionality');
                    this.capabilities = {
                        canUseAI: true,
                        model: 'chrome-ai',
                        features: ['prompt', 'streaming']
                    };
                }
                this.isInitialized = true;
                return this.capabilities;
            }
            catch (capabilitiesError) {
                console.error('Failed to get AI capabilities:', capabilitiesError);
                // Don't fail initialization if capabilities are not available
                console.log('Proceeding without capabilities, using basic AI functionality');
                this.capabilities = {
                    canUseAI: true,
                    model: 'chrome-ai',
                    features: ['prompt', 'streaming']
                };
                this.isInitialized = true;
                return this.capabilities;
            }
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
            if (!window.LanguageModel) {
                return false;
            }
            const availability = await window.LanguageModel.availability();
            // Accept both 'available' and 'downloadable' as valid states
            // The model will be downloaded automatically on first use if needed
            return availability === 'available' || availability === 'downloadable';
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
        if (!window.LanguageModel) {
            throw new AIError('AI API not available', 'API_NOT_AVAILABLE');
        }
        try {
            const session = await window.LanguageModel.create({
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
        if (!window.LanguageModel) {
            return false;
        }
        const availability = await window.LanguageModel.availability();
        // Accept both 'available' and 'downloadable' as valid states
        // The model will be downloaded automatically on first use if needed
        return availability === 'available' || availability === 'downloadable';
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
 * Prompt Enhancer Service
 * Automatically improves user-written prompts using LLM
 */

/**
 * Prompt Enhancer Service
 * Uses AI to automatically improve user-provided prompts
 */
class PromptEnhancer {
    constructor() {
        this.aiClient = getAIClient();
    }
    /**
     * Get singleton instance of PromptEnhancer
     */
    static getInstance() {
        if (!PromptEnhancer.instance) {
            PromptEnhancer.instance = new PromptEnhancer();
        }
        return PromptEnhancer.instance;
    }
    /**
     * Enhance a user's prompt to be more effective
     */
    async enhancePrompt(originalPrompt, options = {}) {
        try {
            // Validate input
            if (!originalPrompt || originalPrompt.trim().length === 0) {
                return {
                    success: false,
                    error: 'Original prompt cannot be empty',
                    originalPrompt
                };
            }
            // Check if AI client is available and initialize if needed
            if (!(await this.aiClient.isAvailable())) {
                return {
                    success: false,
                    error: 'AI client is not available. Please ensure Chrome AI API is enabled.',
                    originalPrompt
                };
            }
            // Ensure AI client is initialized with timeout
            try {
                const initPromise = this.aiClient.initialize();
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('AI client initialization timeout')), 10000));
                await Promise.race([initPromise, timeoutPromise]);
            }
            catch (initError) {
                console.error('Failed to initialize AI client for enhancement:', initError);
                // Try to use direct AI access as fallback
                console.log('Attempting fallback to direct AI access...');
                try {
                    const enhancedPrompt = await this.enhancePromptDirectly(originalPrompt);
                    return {
                        success: true,
                        enhancedPrompt,
                        originalPrompt,
                        improvements: ['Enhanced using direct AI access']
                    };
                }
                catch (fallbackError) {
                    console.error('Fallback enhancement also failed:', fallbackError);
                    return {
                        success: false,
                        error: 'Failed to initialize AI client. Please try again.',
                        originalPrompt
                    };
                }
            }
            console.log('Enhancing prompt:', originalPrompt);
            // Create enhancement meta-prompt
            const metaPrompt = this.createEnhancementMetaPrompt(originalPrompt);
            // Execute enhancement with timeout
            const executePromise = this.aiClient.executePrompt(metaPrompt, {
                temperature: options.temperature ?? 0.3, // Lower temperature for more consistent results
                topK: options.topK ?? 40
            });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Enhancement timeout')), 30000));
            const enhancedPrompt = await Promise.race([executePromise, timeoutPromise]);
            // Validate and clean the enhanced prompt
            const cleanedPrompt = this.cleanEnhancedPrompt(enhancedPrompt, originalPrompt);
            // Extract improvements for user feedback
            const improvements = this.extractImprovements(originalPrompt, cleanedPrompt);
            console.log('Prompt enhanced successfully');
            console.log('Original:', originalPrompt);
            console.log('Enhanced:', cleanedPrompt);
            return {
                success: true,
                enhancedPrompt: cleanedPrompt,
                originalPrompt,
                improvements
            };
        }
        catch (error) {
            console.error('Prompt enhancement failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred during enhancement',
                originalPrompt
            };
        }
    }
    /**
     * Create the meta-prompt for enhancing user prompts
     */
    createEnhancementMetaPrompt(originalPrompt) {
        return `You are an expert prompt engineer. Your task is to improve the following user prompt to make it more effective, clear, and specific while maintaining its original intent.

IMPORTANT RULES:
1. Preserve the original intent and purpose of the prompt
2. If the prompt contains placeholders like {user_input}, {input}, or similar, keep them exactly as they are
3. If the prompt does NOT contain any placeholder for user input, you MUST add {user_input} in the appropriate place where the user's input should be inserted
4. Make the prompt more specific and actionable
5. Add context and constraints that will improve results
6. Use clear, direct language
7. Structure the prompt for better AI understanding
8. Keep the enhanced prompt concise but comprehensive
9. Do not change the core functionality or expected output format
10. ALWAYS ensure the enhanced prompt includes {user_input} placeholder for user input

Original prompt to enhance:
"${originalPrompt}"

Enhanced prompt:`;
    }
    /**
     * Clean and validate the enhanced prompt
     */
    cleanEnhancedPrompt(enhancedPrompt, originalPrompt) {
        // Remove any quotes that might have been added
        let cleaned = enhancedPrompt.trim();
        // Remove leading/trailing quotes if present
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.slice(1, -1);
        }
        if (cleaned.startsWith("'") && cleaned.endsWith("'")) {
            cleaned = cleaned.slice(1, -1);
        }
        // Ensure placeholder syntax is preserved
        const originalPlaceholders = this.extractPlaceholders(originalPrompt);
        const enhancedPlaceholders = this.extractPlaceholders(cleaned);
        // If original had placeholders but enhanced doesn't, try to preserve them
        if (originalPlaceholders.length > 0 && enhancedPlaceholders.length === 0) {
            // Try to add back the most common placeholder
            if (originalPrompt.includes('{user_input}') && !cleaned.includes('{user_input}')) {
                // Add {user_input} if it seems like it should be there
                if (cleaned.toLowerCase().includes('input') || cleaned.toLowerCase().includes('text') || cleaned.toLowerCase().includes('content')) {
                    cleaned = cleaned.replace(/(\b(?:input|text|content|data)\b)/gi, '$1: {user_input}');
                }
            }
        }
        // CRITICAL: Ensure {user_input} placeholder is always present
        // If no user input placeholder exists, add it at the end
        if (!cleaned.includes('{user_input}') && !cleaned.includes('{input}') && !cleaned.includes('{text}') && !cleaned.includes('{content}')) {
            // Add {user_input} at the end of the prompt
            cleaned = cleaned + ' {user_input}';
        }
        return cleaned;
    }
    /**
     * Extract placeholder variables from a prompt
     */
    extractPlaceholders(prompt) {
        const placeholderRegex = /\{([^}]+)\}/g;
        const placeholders = [];
        let match;
        while ((match = placeholderRegex.exec(prompt)) !== null) {
            if (match[1]) {
                placeholders.push(match[1]);
            }
        }
        return placeholders;
    }
    /**
     * Extract improvements made to the prompt for user feedback
     */
    extractImprovements(original, enhanced) {
        const improvements = [];
        // Check for common improvements
        if (original.length < enhanced.length && enhanced.length > original.length * 1.2) {
            improvements.push('Added more specific instructions and context');
        }
        if (enhanced.includes('Please') || enhanced.includes('please')) {
            improvements.push('Added polite and clear language');
        }
        if (enhanced.includes('format') || enhanced.includes('structure')) {
            improvements.push('Specified output format requirements');
        }
        if (enhanced.includes('specific') || enhanced.includes('detailed')) {
            improvements.push('Made instructions more specific and actionable');
        }
        if (enhanced.includes('context') || enhanced.includes('background')) {
            improvements.push('Added helpful context for better results');
        }
        // If no specific improvements detected, add a generic one
        if (improvements.length === 0) {
            improvements.push('Improved clarity and effectiveness');
        }
        return improvements;
    }
    /**
     * Fallback method to enhance prompt using direct AI access
     */
    async enhancePromptDirectly(originalPrompt) {
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API not available');
        }
        // Create AI session directly
        const session = await aiWindow.LanguageModel.create({
            temperature: 0.3,
            topK: 40
        });
        try {
            // Create enhancement meta-prompt
            const metaPrompt = this.createEnhancementMetaPrompt(originalPrompt);
            // Execute enhancement with timeout
            const promptPromise = session.prompt(metaPrompt);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Direct enhancement timeout')), 30000));
            const enhancedPrompt = await Promise.race([promptPromise, timeoutPromise]);
            // Clean up session
            session.destroy();
            // Clean and validate the enhanced prompt
            return this.cleanEnhancedPrompt(enhancedPrompt, originalPrompt);
        }
        catch (error) {
            session.destroy();
            throw error;
        }
    }
    /**
     * Test the enhancement functionality
     */
    async testEnhancement() {
        try {
            const testPrompt = "Make this better";
            const result = await this.enhancePrompt(testPrompt);
            return result.success;
        }
        catch (error) {
            console.error('Enhancement test failed:', error);
            return false;
        }
    }
}
/**
 * Utility function to get Prompt Enhancer instance
 */
const getPromptEnhancer = () => {
    return PromptEnhancer.getInstance();
};
//# sourceMappingURL=prompt-enhancer.js.map


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
const rerunResultBtn = document.getElementById('rerun-result');
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
let promptEnhancer = null;
let storageService = null;
let currentRecipes = [];
let currentRecipe = null;
let isExecuting = false;
let editingRecipeId = null;
let formValidationState = {};
let isEnhancing = false;
let currentEnhancement = null;
let userGuide = '';
// Response history state
let responseHistory = new Map();
let currentHistoryIndex = -1;
// Performance optimization state
let responseCache = new Map();
let streamingAnimationFrame = null;
/**
 * Initialize the side panel
 */
async function initialize() {
    console.log('Initializing LLM Shortcuts side panel');
    // Initialize recipe manager
    recipeManager = new RecipeManager();
    // Initialize prompt executor
    promptExecutor = getPromptExecutor();
    // Initialize prompt enhancer
    promptEnhancer = getPromptEnhancer();
    // Initialize storage service
    storageService = getStorageService();
    // Debug: Check if AI client functions are loaded
    console.log('AI Client loaded. Functions available:');
    console.log('isAIAvailable:', typeof isAIAvailable);
    console.log('getAIClient:', typeof getAIClient);
    console.log('window.ai:', window.ai);
    // Check AI availability
    await checkAIAvailabilityDirect();
    // Set up event listeners
    setupEventListeners();
    // Load initial state
    await loadInitialState();
    // Load user guide
    await loadGuide();
}
/**
 * Check if Chrome AI API is available directly in sidepanel
 */
async function checkAIAvailabilityDirect() {
    const statusEl = aiStatusEl.querySelector('.loading');
    try {
        console.log('=== AI Availability Debug ===');
        console.log('Checking AI availability in sidepanel...');
        console.log('LanguageModel exists:', !!window.LanguageModel);
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API (LanguageModel) not found. Please ensure Chrome flags are enabled:\n• chrome://flags/#optimization-guide-on-device-model\n• chrome://flags/#prompt-api-for-gemini-nano');
        }
        // Check AI availability using the correct method
        const availability = await aiWindow.LanguageModel.availability();
        console.log('AI availability status:', availability);
        // Check if AI is available or downloadable
        const isAvailable = availability === 'available' || availability === 'downloadable';
        if (!isAvailable) {
            throw new Error(`AI model availability: ${availability}`);
        }
        console.log('✓ AI is available in sidepanel!');
        statusEl.innerHTML = `
        <div class="success">
          AI is available and working
        </div>
      `;
        aiStatusEl.className = 'ai-status success';
        // Show recipe list
        recipeListEl.style.display = 'block';
    }
    catch (error) {
        console.error('AI availability check failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        statusEl.innerHTML = `
      <div class="error">
        AI not available: ${errorMessage}
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
    executeRecipeBtn?.addEventListener('click', () => handleRecipeExecution());
    copyResultBtn?.addEventListener('click', copyResult);
    rerunResultBtn?.addEventListener('click', handleRerunResult);
    clearResultBtn?.addEventListener('click', clearResult);
    // Search functionality
    searchInput?.addEventListener('input', debounce(handleSearch, 300));
    sortSelect?.addEventListener('change', handleSortChange);
    // Recipe list interactions (event delegation)
    recipeListEl?.addEventListener('click', handleRecipeListClick);
    // Enhancement functionality
    const enhancePromptBtn = document.getElementById('enhance-prompt-btn');
    const closeEnhancementBtn = document.getElementById('close-enhancement');
    const acceptEnhancementBtn = document.getElementById('accept-enhancement');
    const rejectEnhancementBtn = document.getElementById('reject-enhancement');
    // Ensure enhance prompt button is visible
    if (enhancePromptBtn) {
        if (window.getComputedStyle(enhancePromptBtn).display === 'none') {
            enhancePromptBtn.style.display = 'block';
        }
    }
    enhancePromptBtn?.addEventListener('click', handleEnhancePrompt);
    closeEnhancementBtn?.addEventListener('click', hideEnhancementUI);
    acceptEnhancementBtn?.addEventListener('click', acceptEnhancement);
    rejectEnhancementBtn?.addEventListener('click', rejectEnhancement);
    // Guide management
    const toggleGuideBtn = document.getElementById('toggle-guide-btn');
    const closeGuideModalBtn = document.getElementById('close-guide-modal');
    const saveGuideBtn = document.getElementById('save-guide-btn');
    const clearGuideBtn = document.getElementById('clear-guide-btn');
    const guideContentInput = document.getElementById('guide-content');
    toggleGuideBtn?.addEventListener('click', showGuideModal);
    closeGuideModalBtn?.addEventListener('click', hideGuideModal);
    saveGuideBtn?.addEventListener('click', handleSaveGuide);
    clearGuideBtn?.addEventListener('click', handleClearGuide);
    guideContentInput?.addEventListener('input', updateGuideCharCount);
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
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
    // Reset form and state
    editingRecipeId = null;
    formValidationState = {};
    recipeForm.reset();
    // Update form title
    const formTitle = document.querySelector('#recipe-form h2');
    if (formTitle) {
        formTitle.textContent = 'Create New Recipe';
    }
    // Update submit button
    const submitBtn = recipeForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Save Recipe';
    }
    // Clear any validation errors
    clearFormValidationErrors();
    // Set up real-time validation
    setupFormValidation();
    // Initialize submit button state
    updateSubmitButtonState();
    // Ensure enhance prompt button is visible after form setup
    const enhancePromptBtn = document.getElementById('enhance-prompt-btn');
    if (enhancePromptBtn && window.getComputedStyle(enhancePromptBtn).display === 'none') {
        enhancePromptBtn.style.display = 'block';
    }
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
    // Validate form before submission
    if (!validateForm()) {
        return;
    }
    const formData = new FormData(recipeForm);
    // Parse tags from comma-separated string
    const tagsString = formData.get('tags');
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];
    // Get pinned status
    const pinned = formData.get('pinned') === 'on';
    const recipeData = {
        name: formData.get('name'),
        description: formData.get('description'),
        prompt: formData.get('prompt'),
        originalPrompt: formData.get('prompt'), // Same as prompt for now
        tags: tags,
        pinned: pinned
    };
    try {
        if (editingRecipeId) {
            // Update existing recipe
            console.log('Updating recipe:', editingRecipeId, recipeData);
            const updateData = {
                id: editingRecipeId,
                ...recipeData
            };
            const recipe = await recipeManager.updateRecipe(updateData);
            console.log('Recipe updated successfully:', recipe.id);
            // Reload recipes and show list
            await loadRecipes();
            showRecipeList();
            // Show success message
            alert('Recipe updated successfully!');
        }
        else {
            // Create new recipe
            console.log('Creating recipe:', recipeData);
            const recipe = await recipeManager.createRecipe(recipeData);
            console.log('Recipe created successfully:', recipe.id);
            // Reload recipes and show list
            await loadRecipes();
            showRecipeList();
            // Show success message
            alert('Recipe created successfully!');
        }
    }
    catch (error) {
        console.error('Failed to save recipe:', error);
        alert(`Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Handle recipe execution
 */
async function handleRecipeExecution(bypassCache = false) {
    if (!promptExecutor) {
        alert('Prompt executor not available');
        return;
    }
    if (!currentRecipe) {
        alert('No recipe selected');
        return;
    }
    const userInput = userInputEl.value.trim();
    const imageInput = document.getElementById('image-input');
    const imageFile = imageInput?.files?.[0];
    if (!userInput && !imageFile) {
        alert('Please provide either text input or an image');
        return;
    }
    if (isExecuting) {
        alert('Recipe is already executing');
        return;
    }
    // Check for cached response first (unless bypassing cache)
    if (!bypassCache && userInput && !imageFile) {
        const cacheKey = `${currentRecipe.id}_${userInput}`;
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse) {
            console.log('Using cached response');
            resultContentEl.innerHTML = formatResponse(cachedResponse);
            document.getElementById('execution-result').style.display = 'block';
            return;
        }
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
        const result = await executeRecipeWithStreaming(currentRecipe, userInput, imageFile);
        if (result.success) {
            // Show result (already displayed during streaming)
            document.getElementById('execution-result').style.display = 'block';
            // Store in response history
            if (currentRecipe) {
                addToResponseHistory(currentRecipe.id, userInput, result.response || '', result.executionTime || 0);
            }
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
async function executeRecipeWithStreaming(recipe, userInput, imageFile) {
    try {
        // Use streaming execution for better UX
        return await executeWithStreaming(recipe, userInput, imageFile);
    }
    catch (error) {
        console.error('Streaming execution failed:', error);
        throw error;
    }
}
/**
 * Execute recipe with streaming response
 */
async function executeWithStreaming(recipe, userInput, imageFile) {
    try {
        console.log('Executing recipe with streaming:', recipe.name);
        // Use proper prompt interpolation with sanitization and guide
        const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, {
            maxLength: 10000,
            allowHtml: false,
            escapeSpecialChars: true
        }, userGuide);
        // Log image file if provided (for future implementation)
        if (imageFile) {
            console.log('Image file provided:', imageFile.name, imageFile.size, 'bytes');
        }
        console.log('Interpolated prompt:', interpolatedPrompt);
        // Check if AI is available
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API not available');
        }
        // Create AI session
        const session = await aiWindow.LanguageModel.create({
            temperature: 0.7,
            topK: 40
        });
        try {
            // Show typing indicator
            showTypingIndicator();
            // Execute streaming prompt
            const stream = session.promptStreaming(interpolatedPrompt);
            let fullResponse = '';
            // Process streaming response
            for await (const chunk of stream) {
                fullResponse += chunk;
                // Update UI with new chunk
                updateStreamingResponse(fullResponse);
            }
            // Hide typing indicator
            hideTypingIndicator();
            session.destroy();
            console.log('Streaming execution successful');
            return {
                success: true,
                response: fullResponse
            };
        }
        catch (error) {
            hideTypingIndicator();
            session.destroy();
            throw error;
        }
    }
    catch (error) {
        console.error('Streaming execution failed:', error);
        throw error;
    }
}
/**
 * Execute recipe using direct AI access (fallback)
 */
async function executeWithContentScript(recipe, userInput, imageFile) {
    try {
        console.log('Executing recipe via direct AI access:', recipe.name);
        // Use proper prompt interpolation with sanitization and guide
        const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, {
            maxLength: 10000,
            allowHtml: false,
            escapeSpecialChars: true
        }, userGuide);
        // Log image file if provided (for future implementation)
        if (imageFile) {
            console.log('Image file provided:', imageFile.name, imageFile.size, 'bytes');
        }
        console.log('Interpolated prompt:', interpolatedPrompt);
        // Check if AI is available
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API not available');
        }
        // Create AI session
        const session = await aiWindow.LanguageModel.create({
            temperature: 0.7,
            topK: 40
        });
        try {
            // Execute prompt
            const response = await session.prompt(interpolatedPrompt);
            session.destroy();
            console.log('Direct AI execution successful');
            return {
                success: true,
                response: response
            };
        }
        catch (error) {
            session.destroy();
            throw error;
        }
    }
    catch (error) {
        console.error('Direct AI execution failed:', error);
        throw error;
    }
}
/**
 * Show typing indicator during streaming
 */
function showTypingIndicator() {
    const typingHtml = `
        <div class="typing-indicator">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">AI is thinking...</span>
        </div>
    `;
    resultContentEl.innerHTML = typingHtml;
    document.getElementById('execution-result').style.display = 'block';
}
/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const typingIndicator = resultContentEl.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}
/**
 * Update streaming response with new content (optimized with requestAnimationFrame)
 */
function updateStreamingResponse(response) {
    // Cancel previous animation frame if still pending
    if (streamingAnimationFrame) {
        cancelAnimationFrame(streamingAnimationFrame);
    }
    // Use requestAnimationFrame for smooth updates
    streamingAnimationFrame = requestAnimationFrame(() => {
        // Format the response with markdown support
        const formattedResponse = formatResponse(response);
        // Update the content
        resultContentEl.innerHTML = formattedResponse;
        document.getElementById('execution-result').style.display = 'block';
        // Scroll to bottom to show latest content
        const executionResult = document.getElementById('execution-result');
        if (executionResult) {
            executionResult.scrollTop = executionResult.scrollHeight;
        }
        streamingAnimationFrame = null;
    });
}
/**
 * Format response with rich markdown support
 */
function formatResponse(response) {
    // First, escape HTML to prevent XSS
    let formatted = escapeHtml(response);
    // Process code blocks first (before other formatting)
    formatted = formatted
        // Code blocks with language specification
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>');
    // Process headers (must be before other formatting)
    formatted = formatted
        // H1 headers
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // H2 headers
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        // H3 headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // H4 headers
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        // H5 headers
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
        // H6 headers
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>');
    // Process lists
    formatted = formatted
        // Unordered lists
        .replace(/^[\s]*[-*+] (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^[\s]*\d+\. (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive list items in ul/ol tags
    formatted = formatted
        .replace(/(<li>.*<\/li>)(\s*<li>.*<\/li>)*/g, (match) => {
        const listItems = match.match(/<li>.*?<\/li>/g);
        if (listItems) {
            return '<ul>' + listItems.join('') + '</ul>';
        }
        return match;
    });
    // Process blockquotes
    formatted = formatted
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
    // Process horizontal rules
    formatted = formatted
        .replace(/^---$/gm, '<hr>')
        .replace(/^\*\*\*$/gm, '<hr>')
        .replace(/^___$/gm, '<hr>');
    // Process links
    formatted = formatted
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Process text formatting
    formatted = formatted
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        // Underline (not standard markdown but useful)
        .replace(/__(.*?)__/g, '<u>$1</u>');
    // Process line breaks and paragraphs
    formatted = formatted
        // Convert double line breaks to paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Convert single line breaks to <br>
        .replace(/\n/g, '<br>')
        // Wrap in paragraph tags
        .replace(/^(.*)$/gm, '<p>$1</p>')
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p><br><\/p>/g, '');
    // Clean up code blocks that got wrapped in paragraphs
    formatted = formatted
        .replace(/<p><pre>/g, '<pre>')
        .replace(/<\/pre><\/p>/g, '</pre>')
        .replace(/<p><code>/g, '<code>')
        .replace(/<\/code><\/p>/g, '</code>')
        .replace(/<p><blockquote>/g, '<blockquote>')
        .replace(/<\/blockquote><\/p>/g, '</blockquote>')
        .replace(/<p><hr><\/p>/g, '<hr>')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><li>/g, '<li>')
        .replace(/<\/li><\/p>/g, '</li>')
        .replace(/<p><h[1-6]>/g, '<h$1>')
        .replace(/<\/h[1-6]><\/p>/g, '</h$1>');
    return formatted;
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
        handleRecipeExecution(true);
    }
}
/**
 * Copy result to clipboard
 */
async function copyResult() {
    try {
        if (!resultContentEl.innerHTML.trim()) {
            alert('No result to copy');
            return;
        }
        // Try modern Clipboard API first
        try {
            // Create a temporary div to hold the formatted content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = resultContentEl.innerHTML;
            // Try to copy as HTML using Clipboard API
            const clipboardData = new ClipboardItem({
                'text/html': new Blob([resultContentEl.innerHTML], { type: 'text/html' }),
                'text/plain': new Blob([resultContentEl.textContent || ''], { type: 'text/plain' })
            });
            await navigator.clipboard.write([clipboardData]);
            // Visual feedback
            showCopySuccess();
            return;
        }
        catch (clipboardError) {
            console.log('Clipboard API failed, trying fallback:', clipboardError);
        }
        // Fallback 1: Try document.execCommand for rich text
        try {
            // Create a temporary div to hold the formatted content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = resultContentEl.innerHTML;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            // Create a range and select the content
            const range = document.createRange();
            range.selectNodeContents(tempDiv);
            // Create a selection
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
            // Copy the selection (this preserves formatting)
            const successful = document.execCommand('copy');
            selection?.removeAllRanges();
            // Clean up
            document.body.removeChild(tempDiv);
            if (successful) {
                showCopySuccess();
                return;
            }
        }
        catch (execCommandError) {
            console.log('execCommand failed, falling back to plain text:', execCommandError);
        }
        // Fallback 2: Plain text only
        const resultText = resultContentEl.textContent || '';
        if (!resultText.trim()) {
            alert('No result to copy');
            return;
        }
        await navigator.clipboard.writeText(resultText);
        showCopySuccess();
    }
    catch (error) {
        console.error('Failed to copy result:', error);
        alert('Failed to copy result');
    }
}
/**
 * Show copy success feedback
 */
function showCopySuccess() {
    const originalIcon = copyResultBtn.innerHTML;
    copyResultBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
    `;
    copyResultBtn.style.color = '#4CAF50'; // Green color for success
    setTimeout(() => {
        copyResultBtn.innerHTML = originalIcon;
        copyResultBtn.style.color = ''; // Reset to default color
    }, 2000);
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
 * Handle rerun result button click
 */
function handleRerunResult() {
    if (isExecuting) {
        return; // Don't allow rerun if already executing
    }
    // Force fresh execution by calling the execution handler with bypass cache flag
    handleRecipeExecution(true);
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
 * Get unique tags from all recipes
 */
function getUniqueTags() {
    const allTags = currentRecipes.flatMap(recipe => recipe.tags || []);
    return [...new Set(allTags)].sort();
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
            <img src="images/new-recipe.svg" alt="No recipes found" />
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
    // Sort recipes: pinned first, then by name
    const sortedRecipes = [...currentRecipes].sort((a, b) => {
        if (a.pinned && !b.pinned)
            return -1;
        if (!a.pinned && b.pinned)
            return 1;
        return a.name.localeCompare(b.name);
    });
    const recipesHtml = sortedRecipes.map(recipe => `
        <div class="recipe-item ${recipe.pinned ? 'pinned' : ''}" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <div class="recipe-title-section">
                    ${recipe.pinned ? '<span class="pin-indicator" title="Pinned Recipe">📌</span>' : ''}
                    <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
                </div>
                <div class="recipe-actions">
                    <button class="btn-icon" data-action="toggle-pin" title="${recipe.pinned ? 'Unpin Recipe' : 'Pin Recipe'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="execute" title="Execute Recipe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <p class="recipe-description">${escapeHtml(recipe.description || 'No description')}</p>
            ${recipe.tags && recipe.tags.length > 0 ? `
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="recipe-meta">
                ${recipe.lastUsedAt ? `<span class="recipe-last-used">Last used: ${formatDate(recipe.lastUsedAt)}</span>` : ''}
                <span class="recipe-created">Created: ${formatDate(recipe.createdAt)}</span>
            </div>
        </div>
    `).join('');
    recipeListEl.innerHTML = `
                <div class="search-container">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="search-recipes" placeholder="Search recipes..." class="search-input">
                </div>
                <div class="filter-container">
                    <select id="tag-filter" class="filter-select">
                        <option value="">All Tags</option>
                        ${getUniqueTags().map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('')}
                    </select>
                </div>
            </div>
            <br>    
    <div class="recipe-list-header">
            <div class="sort-container">
                <select id="sort-recipes" class="sort-select">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="created-desc">Newest First</option>
                    <option value="created-asc">Oldest First</option>
                    <option value="lastUsed-desc">Recently Used</option>
                </select>
            </div>
            <div class="new-recipe-container">
                <button id="create-recipe-btn" class="btn btn-primary"> <svg class="w-[9px] h-[9px] text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
</svg>&nbsp;
New Recipe</button>
            </div>
        </div>
        <div class="recipe-list-content">
            ${recipesHtml}
        </div>
    `;
    // Re-attach event listeners for search and sort
    const newSearchInput = document.getElementById('search-recipes');
    const newSortSelect = document.getElementById('sort-recipes');
    const newCreateBtn = document.getElementById('create-recipe-btn');
    const tagFilter = document.getElementById('tag-filter');
    const pinnedOnlyFilter = document.getElementById('pinned-only-filter');
    if (newSearchInput) {
        searchInput = newSearchInput;
        newSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    if (newSortSelect) {
        sortSelect = newSortSelect;
        newSortSelect.addEventListener('change', handleSortChange);
    }
    if (tagFilter) {
        tagFilter.addEventListener('change', applyFilters);
    }
    if (pinnedOnlyFilter) {
        pinnedOnlyFilter.addEventListener('change', applyFilters);
    }
    if (newCreateBtn) {
        newCreateBtn.addEventListener('click', showRecipeForm);
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
    // Find the button element that was clicked (in case user clicked on SVG inside button)
    const button = target.closest('button[data-action]');
    const action = button?.dataset['action'];
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
        case 'toggle-pin':
            toggleRecipePin(recipeId);
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
    applyFilters();
}
/**
 * Apply all active filters
 */
function applyFilters() {
    if (!searchInput)
        return;
    const searchTerm = searchInput.value.toLowerCase().trim();
    const tagFilter = document.getElementById('tag-filter')?.value || '';
    const pinnedOnly = document.getElementById('pinned-only-filter')?.checked || false;
    let filteredRecipes = [...currentRecipes];
    // Apply search term filter
    if (searchTerm) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.description.toLowerCase().includes(searchTerm) ||
            recipe.prompt.toLowerCase().includes(searchTerm) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm))));
    }
    // Apply tag filter
    if (tagFilter) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.tags && recipe.tags.includes(tagFilter));
    }
    // Apply pinned filter
    if (pinnedOnly) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.pinned);
    }
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
            <img src="images/empty-search.svg" alt="No recipes found" />
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <p class="recipe-description">${escapeHtml(recipe.description || 'No description')}</p>
            <div class="recipe-meta">
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
        // Set editing state
        editingRecipeId = recipeId;
        // Show form
        recipeListEl.style.display = 'none';
        recipeFormEl.style.display = 'block';
        recipeExecutionEl.style.display = 'none';
        // Update form title
        const formTitle = document.querySelector('#recipe-form h2');
        if (formTitle) {
            formTitle.textContent = 'Edit Recipe';
        }
        // Update submit button
        const submitBtn = recipeForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Recipe';
        }
        // Populate form with existing data
        populateFormWithRecipe(recipe);
        // Clear validation errors and set up validation
        clearFormValidationErrors();
        setupFormValidation();
        // Initialize submit button state
        updateSubmitButtonState();
    }
    catch (error) {
        console.error('Failed to load recipe for editing:', error);
        alert('Failed to load recipe for editing');
    }
}
/**
 * Toggle recipe pin status
 */
async function toggleRecipePin(recipeId) {
    try {
        const updatedRecipe = await recipeManager.toggleRecipePin(recipeId);
        console.log('Recipe pin toggled:', updatedRecipe.id, 'pinned:', updatedRecipe.pinned);
        // Reload recipes to reflect the change
        await loadRecipes();
        renderRecipeList();
    }
    catch (error) {
        console.error('Failed to toggle recipe pin:', error);
        alert('Failed to toggle recipe pin');
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
    // Image input is always visible now
    // Clear previous input
    if (userInputEl) {
        userInputEl.value = '';
    }
    // Hide previous result
    const executionResult = document.getElementById('execution-result');
    if (executionResult) {
        executionResult.style.display = 'none';
    }
    // Initialize response history UI
    updateResponseHistoryUI();
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
/**
 * Populate form with recipe data for editing
 */
function populateFormWithRecipe(recipe) {
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    const tagsInput = document.getElementById('recipe-tags');
    const pinnedInput = document.getElementById('recipe-pinned');
    if (nameInput)
        nameInput.value = recipe.name;
    if (descriptionInput)
        descriptionInput.value = recipe.description;
    if (promptInput)
        promptInput.value = recipe.prompt;
    if (tagsInput)
        tagsInput.value = recipe.tags ? recipe.tags.join(', ') : '';
    if (pinnedInput)
        pinnedInput.checked = recipe.pinned || false;
}
/**
 * Set up real-time form validation
 */
function setupFormValidation() {
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    // Add event listeners for real-time validation
    if (nameInput) {
        nameInput.addEventListener('input', () => validateField('name', nameInput.value));
        nameInput.addEventListener('blur', () => validateField('name', nameInput.value));
    }
    if (descriptionInput) {
        descriptionInput.addEventListener('input', () => validateField('description', descriptionInput.value));
        descriptionInput.addEventListener('blur', () => validateField('description', descriptionInput.value));
    }
    if (promptInput) {
        promptInput.addEventListener('input', () => validateField('prompt', promptInput.value));
        promptInput.addEventListener('blur', () => validateField('prompt', promptInput.value));
    }
}
/**
 * Validate a single form field
 */
function validateField(fieldName, value) {
    let isValid = true;
    let errorMessage = '';
    switch (fieldName) {
        case 'name':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Name is required';
            }
            else if (value.trim().length < 1) {
                isValid = false;
                errorMessage = 'Name must be at least 1 character long';
            }
            else if (value.trim().length > 100) {
                isValid = false;
                errorMessage = 'Name must be no more than 100 characters long';
            }
            break;
        case 'description':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Description is required';
            }
            else if (value.trim().length > 500) {
                isValid = false;
                errorMessage = 'Description must be no more than 500 characters long';
            }
            break;
        case 'prompt':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Prompt is required';
            }
            else if (value.trim().length < 1) {
                isValid = false;
                errorMessage = 'Prompt must be at least 1 character long';
            }
            else if (value.trim().length > 10000) {
                isValid = false;
                errorMessage = 'Prompt must be no more than 10,000 characters long';
            }
            break;
    }
    // Update validation state
    formValidationState[fieldName] = isValid;
    // Show/hide error message
    showFieldValidationError(fieldName, isValid, errorMessage);
    // Update submit button state
    updateSubmitButtonState();
    return isValid;
}
/**
 * Show field validation error
 */
function showFieldValidationError(fieldName, isValid, errorMessage) {
    const field = document.getElementById(`recipe-${fieldName}`);
    if (!field)
        return;
    // Remove existing error message
    const existingError = field.parentElement?.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    // Remove error styling
    field.classList.remove('error');
    if (!isValid && errorMessage) {
        // Add error styling
        field.classList.add('error');
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = errorMessage;
        field.parentElement?.appendChild(errorDiv);
    }
}
/**
 * Clear all form validation errors
 */
function clearFormValidationErrors() {
    const fields = ['name', 'description', 'prompt'];
    fields.forEach(fieldName => {
        const field = document.getElementById(`recipe-${fieldName}`);
        if (field) {
            field.classList.remove('error');
            const existingError = field.parentElement?.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
        }
    });
}
/**
 * Validate entire form
 */
function validateForm() {
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    const nameValid = validateField('name', nameInput?.value || '');
    const descriptionValid = validateField('description', descriptionInput?.value || '');
    const promptValid = validateField('prompt', promptInput?.value || '');
    return nameValid && descriptionValid && promptValid;
}
/**
 * Update submit button state based on validation
 */
function updateSubmitButtonState() {
    const submitBtn = recipeForm.querySelector('button[type="submit"]');
    if (!submitBtn)
        return;
    // Get current form values
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    // Check if all required fields have values
    const hasName = nameInput?.value.trim().length > 0;
    const hasDescription = descriptionInput?.value.trim().length > 0;
    const hasPrompt = promptInput?.value.trim().length > 0;
    // Check if any field has validation errors (only if validation state exists)
    const hasValidationErrors = Object.keys(formValidationState).length > 0 &&
        Object.values(formValidationState).some(valid => valid === false);
    // Enable button if all fields have values and no validation errors
    submitBtn.disabled = !(hasName && hasDescription && hasPrompt) || hasValidationErrors;
}
/**
 * Handle prompt enhancement request
 */
async function handleEnhancePrompt() {
    if (!promptEnhancer) {
        alert('Prompt enhancer not available');
        return;
    }
    const promptInput = document.getElementById('recipe-prompt');
    if (!promptInput)
        return;
    const originalPrompt = promptInput.value.trim();
    if (!originalPrompt) {
        alert('Please enter a prompt to enhance');
        return;
    }
    if (isEnhancing) {
        alert('Enhancement is already in progress');
        return;
    }
    try {
        isEnhancing = true;
        showEnhancementLoading();
        console.log('Enhancing prompt:', originalPrompt);
        const result = await promptEnhancer.enhancePrompt(originalPrompt);
        console.log('Enhancement result received:', result);
        if (result.success && result.enhancedPrompt) {
            console.log('Enhancement successful, showing result');
            currentEnhancement = result;
            showEnhancementResult(result);
        }
        else {
            console.log('Enhancement failed, showing error');
            showEnhancementError(result.error || 'Enhancement failed');
        }
    }
    catch (error) {
        console.error('Prompt enhancement failed:', error);
        showEnhancementError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
    finally {
        isEnhancing = false;
    }
}
/**
 * Show enhancement loading state
 */
function showEnhancementLoading() {
    console.log('Showing enhancement loading state');
    const enhancementUI = document.getElementById('enhancement-ui');
    const enhancementContent = enhancementUI?.querySelector('.enhancement-content');
    console.log('Loading state elements:');
    console.log('- enhancementUI:', !!enhancementUI);
    console.log('- enhancementContent:', !!enhancementContent);
    if (!enhancementUI || !enhancementContent) {
        console.error('Missing enhancement UI elements for loading state');
        return;
    }
    enhancementUI.style.display = 'block';
    enhancementContent.innerHTML = `
        <div class="enhancement-loading">
            <div class="spinner"></div>
            Enhancing your prompt...
        </div>
    `;
    console.log('Enhancement loading state displayed');
}
/**
 * Show enhancement result
 */
function showEnhancementResult(result) {
    console.log('Showing enhancement result:', result);
    const enhancementUI = document.getElementById('enhancement-ui');
    const originalDisplay = document.getElementById('original-prompt-display');
    const enhancedDisplay = document.getElementById('enhanced-prompt-display');
    const improvementsList = document.getElementById('enhancement-improvements');
    console.log('Enhancement UI elements found:');
    console.log('- enhancementUI:', !!enhancementUI);
    console.log('- originalDisplay:', !!originalDisplay);
    console.log('- enhancedDisplay:', !!enhancedDisplay);
    console.log('- improvementsList:', !!improvementsList);
    if (!enhancementUI) {
        console.error('Enhancement UI container not found');
        return;
    }
    // Make sure the enhancement UI is visible first
    enhancementUI.style.display = 'block';
    // Now try to find the child elements again
    const originalDisplayRetry = document.getElementById('original-prompt-display');
    const enhancedDisplayRetry = document.getElementById('enhanced-prompt-display');
    const improvementsListRetry = document.getElementById('enhancement-improvements');
    console.log('Retry after making UI visible:');
    console.log('- originalDisplayRetry:', !!originalDisplayRetry);
    console.log('- enhancedDisplayRetry:', !!enhancedDisplayRetry);
    console.log('- improvementsListRetry:', !!improvementsListRetry);
    if (!originalDisplayRetry || !enhancedDisplayRetry || !improvementsListRetry) {
        console.error('Missing enhancement UI elements after making visible, cannot display result');
        return;
    }
    // Show original and enhanced prompts
    originalDisplayRetry.textContent = result.originalPrompt || '';
    enhancedDisplayRetry.textContent = result.enhancedPrompt || '';
    // Show improvements
    if (result.improvements && result.improvements.length > 0) {
        improvementsListRetry.innerHTML = `
            <h5>Improvements made:</h5>
            <ul>
                ${result.improvements.map((improvement) => `<li>${escapeHtml(improvement)}</li>`).join('')}
            </ul>
        `;
    }
    else {
        improvementsListRetry.innerHTML = '';
    }
    console.log('Enhancement result displayed successfully');
}
/**
 * Show enhancement error
 */
function showEnhancementError(errorMessage) {
    const enhancementUI = document.getElementById('enhancement-ui');
    const enhancementContent = enhancementUI?.querySelector('.enhancement-content');
    if (!enhancementUI || !enhancementContent)
        return;
    enhancementUI.style.display = 'block';
    enhancementContent.innerHTML = `
        <div class="enhancement-error">
            <strong>Enhancement failed:</strong> ${escapeHtml(errorMessage)}
        </div>
        <div class="enhancement-actions">
            <button type="button" id="close-enhancement" class="btn btn-secondary btn-sm">
                Close
            </button>
        </div>
    `;
    // Re-attach close button event listener
    const closeBtn = document.getElementById('close-enhancement');
    closeBtn?.addEventListener('click', hideEnhancementUI);
}
/**
 * Accept enhancement and update the prompt field
 */
function acceptEnhancement() {
    if (!currentEnhancement || !currentEnhancement.enhancedPrompt)
        return;
    const promptInput = document.getElementById('recipe-prompt');
    if (promptInput) {
        promptInput.value = currentEnhancement.enhancedPrompt;
        // Trigger validation to update form state
        validateField('prompt', currentEnhancement.enhancedPrompt);
    }
    hideEnhancementUI();
    currentEnhancement = null;
}
/**
 * Reject enhancement and keep original prompt
 */
function rejectEnhancement() {
    hideEnhancementUI();
    currentEnhancement = null;
}
/**
 * Hide enhancement UI
 */
function hideEnhancementUI() {
    const enhancementUI = document.getElementById('enhancement-ui');
    if (enhancementUI) {
        enhancementUI.style.display = 'none';
    }
    currentEnhancement = null;
}
/**
 * Add response to history
 */
function addToResponseHistory(recipeId, userInput, response, executionTime) {
    const historyItem = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipeId,
        userInput,
        response,
        timestamp: Date.now(),
        executionTime
    };
    if (!responseHistory.has(recipeId)) {
        responseHistory.set(recipeId, []);
    }
    const recipeHistory = responseHistory.get(recipeId);
    recipeHistory.unshift(historyItem); // Add to beginning
    // Keep only last 10 responses per recipe
    if (recipeHistory.length > 10) {
        recipeHistory.splice(10);
    }
    // Cache the response for quick access
    const cacheKey = `${recipeId}_${userInput}`;
    responseCache.set(cacheKey, response);
    // Limit cache size to prevent memory issues
    if (responseCache.size > 50) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) {
            responseCache.delete(firstKey);
        }
    }
    // Update history UI if we're in execution view
    updateResponseHistoryUI();
}
/**
 * Update response history UI
 */
function updateResponseHistoryUI() {
    if (!currentRecipe)
        return;
    const historyContainer = document.getElementById('response-history');
    if (!historyContainer)
        return;
    const recipeHistory = responseHistory.get(currentRecipe.id) || [];
    if (recipeHistory.length === 0) {
        historyContainer.style.display = 'none';
        return;
    }
    historyContainer.style.display = 'block';
    const historyHtml = recipeHistory.map((item, index) => `
        <div class="history-item ${index === currentHistoryIndex ? 'active' : ''}" 
             data-history-id="${item.id}">
            <div class="history-content" onclick="loadHistoryItem('${item.id}')">
                <div class="history-meta">
                    ${formatDate(item.timestamp)} • ${Math.round(item.executionTime)}ms
                </div>
                <div class="history-preview">
                    ${escapeHtml(item.userInput.substring(0, 100))}${item.userInput.length > 100 ? '...' : ''}
                </div>
            </div>
            <div class="history-actions">
                <button class="btn-icon history-copy-btn" 
                        data-history-id="${item.id}" 
                        title="Copy response"
                        onclick="event.stopPropagation(); copyHistoryResponse('${item.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
    historyContainer.innerHTML = `
        <h4>Recent Responses</h4>
        ${historyHtml}
    `;
}
/**
 * Load a history item
 */
function loadHistoryItem(historyId) {
    if (!currentRecipe)
        return;
    const recipeHistory = responseHistory.get(currentRecipe.id) || [];
    const historyItem = recipeHistory.find(item => item.id === historyId);
    if (!historyItem)
        return;
    // Update current history index
    currentHistoryIndex = recipeHistory.indexOf(historyItem);
    // Load the response
    resultContentEl.innerHTML = formatResponse(historyItem.response);
    document.getElementById('execution-result').style.display = 'block';
    // Update history UI
    updateResponseHistoryUI();
}
/**
 * Copy response from history item
 */
async function copyHistoryResponse(historyId) {
    if (!currentRecipe)
        return;
    const recipeHistory = responseHistory.get(currentRecipe.id) || [];
    const historyItem = recipeHistory.find(item => item.id === historyId);
    if (!historyItem) {
        alert('Response not found');
        return;
    }
    try {
        await navigator.clipboard.writeText(historyItem.response);
        // Show feedback on the copy button
        const copyBtn = document.querySelector(`[data-history-id="${historyId}"].history-copy-btn`);
        if (copyBtn) {
            const originalTitle = copyBtn.title;
            copyBtn.title = 'Copied!';
            copyBtn.style.color = '#4CAF50';
            setTimeout(() => {
                copyBtn.title = originalTitle;
                copyBtn.style.color = '';
            }, 2000);
        }
    }
    catch (error) {
        console.error('Failed to copy response:', error);
        alert('Failed to copy response');
    }
}
/**
 * Clear response history for current recipe
 */
function clearResponseHistory() {
    if (!currentRecipe)
        return;
    responseHistory.delete(currentRecipe.id);
    currentHistoryIndex = -1;
    updateResponseHistoryUI();
}
/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
    }
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
    switch (event.key.toLowerCase()) {
        case 'k':
            if (ctrlKey) {
                event.preventDefault();
                focusSearchInput();
            }
            break;
        case 'escape':
            event.preventDefault();
            handleEscapeKey();
            break;
        case 'enter':
            if (ctrlKey) {
                event.preventDefault();
                handleCtrlEnter();
            }
            break;
        case '?':
            if (ctrlKey) {
                event.preventDefault();
                showShortcutsHelp();
            }
            break;
    }
}
/**
 * Focus search input (Ctrl/Cmd + K)
 */
function focusSearchInput() {
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}
/**
 * Handle Escape key
 */
function handleEscapeKey() {
    // Close any open dialogs or modals
    const enhancementUI = document.getElementById('enhancement-ui');
    if (enhancementUI && enhancementUI.style.display !== 'none') {
        hideEnhancementUI();
        return;
    }
    const shortcutsHelp = document.getElementById('shortcuts-help');
    if (shortcutsHelp && shortcutsHelp.classList.contains('show')) {
        hideShortcutsHelp();
        return;
    }
    // If guide modal is open, close it
    const guideModal = document.getElementById('guide-modal');
    if (guideModal && guideModal.style.display !== 'none') {
        hideGuideModal();
        return;
    }
    // If in execution view, go back to list
    if (recipeExecutionEl.style.display !== 'none') {
        showRecipeList();
        return;
    }
    // If in form view, go back to list
    if (recipeFormEl.style.display !== 'none') {
        showRecipeList();
        return;
    }
}
/**
 * Handle Ctrl/Cmd + Enter
 */
function handleCtrlEnter() {
    // If in execution view, execute recipe
    if (recipeExecutionEl.style.display !== 'none' && !isExecuting) {
        handleRecipeExecution();
        return;
    }
    // If in form view, submit form
    if (recipeFormEl.style.display !== 'none') {
        const submitBtn = recipeForm.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.disabled) {
            recipeForm.dispatchEvent(new Event('submit'));
        }
        return;
    }
}
/**
 * Show keyboard shortcuts help
 */
function showShortcutsHelp() {
    const shortcutsHelp = document.getElementById('shortcuts-help');
    if (!shortcutsHelp) {
        createShortcutsHelp();
    }
    else {
        shortcutsHelp.classList.add('show');
    }
}
/**
 * Hide keyboard shortcuts help
 */
function hideShortcutsHelp() {
    const shortcutsHelp = document.getElementById('shortcuts-help');
    if (shortcutsHelp) {
        shortcutsHelp.classList.remove('show');
    }
}
/**
 * Create keyboard shortcuts help modal
 */
function createShortcutsHelp() {
    const shortcutsHelp = document.createElement('div');
    shortcutsHelp.id = 'shortcuts-help';
    shortcutsHelp.className = 'shortcuts-help';
    shortcutsHelp.innerHTML = `
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+K</span>
            <span class="shortcut-description">Focus search</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Esc</span>
            <span class="shortcut-description">Close dialogs / Go back</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Enter</span>
            <span class="shortcut-description">Execute recipe / Submit form</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+?</span>
            <span class="shortcut-description">Show this help</span>
        </div>
        <div style="margin-top: 16px; text-align: center;">
            <button onclick="hideShortcutsHelp()" class="btn btn-secondary">Close</button>
        </div>
    `;
    document.body.appendChild(shortcutsHelp);
    shortcutsHelp.classList.add('show');
    // Close on outside click
    shortcutsHelp.addEventListener('click', (e) => {
        if (e.target === shortcutsHelp) {
            hideShortcutsHelp();
        }
    });
}
/**
 * Load user guide from storage
 */
async function loadGuide() {
    try {
        if (!storageService) {
            console.warn('Storage service not available');
            return;
        }
        userGuide = await storageService.getGuide();
        console.log('User guide loaded:', userGuide ? 'Set' : 'Not set');
        updateGuideButtonState();
    }
    catch (error) {
        console.error('Failed to load guide:', error);
        userGuide = '';
    }
}
/**
 * Show guide modal
 */
function showGuideModal() {
    const guideModal = document.getElementById('guide-modal');
    const guideContentInput = document.getElementById('guide-content');
    if (!guideModal || !guideContentInput)
        return;
    // Populate with current guide content
    guideContentInput.value = userGuide;
    updateGuideCharCount();
    // Show modal
    guideModal.style.display = 'flex';
    // Focus on the textarea
    setTimeout(() => {
        guideContentInput.focus();
    }, 100);
    // Add click outside to close
    const handleClickOutside = (event) => {
        if (event.target === guideModal) {
            hideGuideModal();
            guideModal.removeEventListener('click', handleClickOutside);
        }
    };
    guideModal.addEventListener('click', handleClickOutside);
}
/**
 * Hide guide modal
 */
function hideGuideModal() {
    const guideModal = document.getElementById('guide-modal');
    if (guideModal) {
        guideModal.style.display = 'none';
    }
}
/**
 * Handle save guide
 */
async function handleSaveGuide() {
    const guideContentInput = document.getElementById('guide-content');
    if (!guideContentInput || !storageService)
        return;
    const guideContent = guideContentInput.value.trim();
    try {
        await storageService.saveGuide(guideContent);
        userGuide = guideContent;
        updateGuideButtonState();
        hideGuideModal();
        // Show success feedback
        const saveBtn = document.getElementById('save-guide-btn');
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.backgroundColor = '#4CAF50';
        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.backgroundColor = '';
        }, 2000);
        console.log('Guide saved successfully');
    }
    catch (error) {
        console.error('Failed to save guide:', error);
        alert('Failed to save guide. Please try again.');
    }
}
/**
 * Handle clear guide
 */
async function handleClearGuide() {
    if (!confirm('Are you sure you want to clear your guide? This will remove the persistent context from all recipe executions.')) {
        return;
    }
    try {
        if (!storageService)
            return;
        await storageService.clearGuide();
        userGuide = '';
        updateGuideButtonState();
        // Clear the textarea
        const guideContentInput = document.getElementById('guide-content');
        if (guideContentInput) {
            guideContentInput.value = '';
            updateGuideCharCount();
        }
        console.log('Guide cleared successfully');
    }
    catch (error) {
        console.error('Failed to clear guide:', error);
        alert('Failed to clear guide. Please try again.');
    }
}
/**
 * Update guide character count display
 */
function updateGuideCharCount() {
    const guideContentInput = document.getElementById('guide-content');
    const charCountEl = document.getElementById('guide-char-current');
    if (!guideContentInput || !charCountEl)
        return;
    const currentLength = guideContentInput.value.length;
    charCountEl.textContent = currentLength.toString();
    // Change color based on length
    const charCountContainer = charCountEl.parentElement;
    if (charCountContainer) {
        if (currentLength > 1000) {
            charCountContainer.style.color = '#f44336'; // Red
        }
        else if (currentLength > 800) {
            charCountContainer.style.color = '#ff9800'; // Orange
        }
        else {
            charCountContainer.style.color = '';
        }
    }
}
/**
 * Update guide button state to show if guide is set
 */
function updateGuideButtonState() {
    const toggleGuideBtn = document.getElementById('toggle-guide-btn');
    if (!toggleGuideBtn)
        return;
    if (userGuide && userGuide.trim().length > 0) {
        toggleGuideBtn.classList.add('active');
        toggleGuideBtn.title = 'Guide Active - Click to edit';
    }
    else {
        toggleGuideBtn.classList.remove('active');
        toggleGuideBtn.title = 'Set Guide';
    }
}
// Make functions globally available for onclick handlers
window.loadHistoryItem = loadHistoryItem;
window.copyHistoryResponse = copyHistoryResponse;
window.hideShortcutsHelp = hideShortcutsHelp;
// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
}
else {
    initialize();
}
//# sourceMappingURL=sidepanel.js.map