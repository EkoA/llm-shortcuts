/**
 * Storage Migration Strategy
 * Handles data migration between different versions of the storage schema
 */
/**
 * Migration error types
 */
export class MigrationError extends Error {
    constructor(message, fromVersion, toVersion, originalError) {
        super(message);
        this.fromVersion = fromVersion;
        this.toVersion = toVersion;
        this.originalError = originalError;
        this.name = 'MigrationError';
    }
}
/**
 * Storage Migration Manager
 * Handles versioning and migration of storage data
 */
export class StorageMigrationManager {
    constructor() {
        this.CURRENT_VERSION = '1.0.0';
        this.migrations = new Map();
        /**
         * Migration from initial data (no version) to version 1.0.0
         */
        this.migrateFromInitialToV1 = (data) => {
            console.log('Migrating from initial data to version 1.0.0');
            // Handle case where data is just an array of recipes (old format)
            if (Array.isArray(data)) {
                return {
                    version: {
                        version: this.CURRENT_VERSION,
                        lastUpdated: Date.now()
                    },
                    recipes: data.map(recipe => this.migrateRecipeToV1(recipe))
                };
            }
            // Handle case where data has some structure but no version
            if (data && typeof data === 'object') {
                const recipes = Array.isArray(data.recipes) ? data.recipes : [];
                return {
                    version: {
                        version: this.CURRENT_VERSION,
                        lastUpdated: Date.now()
                    },
                    recipes: recipes.map((recipe) => this.migrateRecipeToV1(recipe))
                };
            }
            // Handle completely unknown data
            console.warn('Unknown data format, creating empty schema');
            return {
                version: {
                    version: this.CURRENT_VERSION,
                    lastUpdated: Date.now()
                },
                recipes: []
            };
        };
        this.registerMigrations();
    }
    /**
     * Get singleton instance
     */
    static getInstance() {
        if (!StorageMigrationManager.instance) {
            StorageMigrationManager.instance = new StorageMigrationManager();
        }
        return StorageMigrationManager.instance;
    }
    /**
     * Register all available migrations
     */
    registerMigrations() {
        // Migration from no version (initial data) to 1.0.0
        this.migrations.set('0.0.0', this.migrateFromInitialToV1);
        // Future migrations can be added here
        // this.migrations.set('1.0.0', this.migrateFromV1ToV2);
    }
    /**
     * Migrate data from one version to another
     */
    async migrateData(data, fromVersion, toVersion) {
        try {
            console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
            // If versions are the same, no migration needed
            if (fromVersion === toVersion) {
                return {
                    success: true,
                    fromVersion,
                    toVersion,
                    migratedData: data
                };
            }
            // Get migration function
            const migrationKey = fromVersion;
            const migrationFunction = this.migrations.get(migrationKey);
            if (!migrationFunction) {
                throw new MigrationError(`No migration available from version ${fromVersion}`, fromVersion, toVersion);
            }
            // Perform migration
            const migratedData = migrationFunction(data);
            console.log(`Migration completed successfully from ${fromVersion} to ${toVersion}`);
            return {
                success: true,
                fromVersion,
                toVersion,
                migratedData
            };
        }
        catch (error) {
            console.error('Migration failed:', error);
            return {
                success: false,
                fromVersion,
                toVersion,
                error: error instanceof Error ? error.message : 'Unknown migration error'
            };
        }
    }
    /**
     * Get current schema version
     */
    getCurrentVersion() {
        return this.CURRENT_VERSION;
    }
    /**
     * Check if migration is needed
     */
    isMigrationNeeded(dataVersion) {
        return dataVersion !== this.CURRENT_VERSION;
    }
    /**
     * Get migration path from one version to another
     */
    getMigrationPath(fromVersion, toVersion) {
        const path = [];
        // For now, we only support direct migrations
        // In the future, this could support multi-step migrations
        if (fromVersion !== toVersion) {
            path.push(fromVersion);
        }
        return path;
    }
    /**
     * Validate migrated data
     */
    validateMigratedData(data) {
        try {
            // Check required fields
            if (!data.version || !data.recipes) {
                return false;
            }
            // Check version format
            if (typeof data.version.version !== 'string' || typeof data.version.lastUpdated !== 'number') {
                return false;
            }
            // Check recipes array
            if (!Array.isArray(data.recipes)) {
                return false;
            }
            // Validate each recipe
            for (const recipe of data.recipes) {
                if (!this.validateRecipe(recipe)) {
                    return false;
                }
            }
            return true;
        }
        catch (error) {
            console.error('Data validation failed:', error);
            return false;
        }
    }
    /**
     * Validate a single recipe
     */
    validateRecipe(recipe) {
        try {
            // Check required fields
            const requiredFields = ['id', 'name', 'description', 'prompt', 'originalPrompt', 'inputType', 'createdAt'];
            for (const field of requiredFields) {
                if (!(field in recipe)) {
                    return false;
                }
            }
            // Check field types
            if (typeof recipe.id !== 'string' || recipe.id.length === 0)
                return false;
            if (typeof recipe.name !== 'string' || recipe.name.length === 0)
                return false;
            if (typeof recipe.description !== 'string')
                return false;
            if (typeof recipe.prompt !== 'string' || recipe.prompt.length === 0)
                return false;
            if (typeof recipe.originalPrompt !== 'string' || recipe.originalPrompt.length === 0)
                return false;
            if (!['text', 'image', 'both'].includes(recipe.inputType))
                return false;
            if (typeof recipe.createdAt !== 'number' || recipe.createdAt <= 0)
                return false;
            // Check optional fields
            if (recipe.lastUsedAt !== null && (typeof recipe.lastUsedAt !== 'number' || recipe.lastUsedAt <= 0)) {
                return false;
            }
            if (recipe.tags && (!Array.isArray(recipe.tags) || !recipe.tags.every((tag) => typeof tag === 'string'))) {
                return false;
            }
            if (recipe.pinned !== undefined && typeof recipe.pinned !== 'boolean') {
                return false;
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Migrate a single recipe to version 1.0.0 format
     */
    migrateRecipeToV1(recipe) {
        // Ensure all required fields exist with defaults
        return {
            id: recipe.id || this.generateTempId(),
            name: recipe.name || 'Untitled Recipe',
            description: recipe.description || '',
            prompt: recipe.prompt || '',
            originalPrompt: recipe.originalPrompt || recipe.prompt || '',
            inputType: this.normalizeInputType(recipe.inputType),
            tags: Array.isArray(recipe.tags) ? recipe.tags : [],
            pinned: Boolean(recipe.pinned),
            createdAt: typeof recipe.createdAt === 'number' ? recipe.createdAt : Date.now(),
            lastUsedAt: typeof recipe.lastUsedAt === 'number' ? recipe.lastUsedAt : null
        };
    }
    /**
     * Normalize input type to valid values
     */
    normalizeInputType(inputType) {
        if (typeof inputType === 'string') {
            const normalized = inputType.toLowerCase();
            if (['text', 'image', 'both'].includes(normalized)) {
                return normalized;
            }
        }
        return 'text'; // Default fallback
    }
    /**
     * Generate a temporary ID for migrated recipes
     */
    generateTempId() {
        return `migrated_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }
    /**
     * Create backup of data before migration
     */
    createBackup(data) {
        try {
            return JSON.stringify(data, null, 2);
        }
        catch (error) {
            throw new MigrationError('Failed to create backup', 'unknown', 'unknown', error);
        }
    }
    /**
     * Restore data from backup
     */
    restoreFromBackup(backupData) {
        try {
            return JSON.parse(backupData);
        }
        catch (error) {
            throw new MigrationError('Failed to restore from backup', 'unknown', 'unknown', error);
        }
    }
    /**
     * Get migration statistics
     */
    getMigrationStats(data) {
        return {
            totalRecipes: data.recipes.length,
            migratedRecipes: data.recipes.filter(recipe => recipe.id.startsWith('migrated_')).length,
            version: data.version.version,
            lastUpdated: data.version.lastUpdated
        };
    }
}
/**
 * Utility function to get migration manager instance
 */
export const getMigrationManager = () => StorageMigrationManager.getInstance();
//# sourceMappingURL=storage-migration.js.map