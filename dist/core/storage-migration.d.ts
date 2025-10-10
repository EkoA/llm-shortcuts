/**
 * Storage Migration Strategy
 * Handles data migration between different versions of the storage schema
 */
import { StorageSchema } from '../models/recipe.model';
/**
 * Migration error types
 */
export declare class MigrationError extends Error {
    fromVersion: string;
    toVersion: string;
    originalError?: Error | undefined;
    constructor(message: string, fromVersion: string, toVersion: string, originalError?: Error | undefined);
}
/**
 * Migration result
 */
export interface MigrationResult {
    success: boolean;
    fromVersion: string;
    toVersion: string;
    migratedData?: StorageSchema;
    error?: string;
}
/**
 * Storage Migration Manager
 * Handles versioning and migration of storage data
 */
export declare class StorageMigrationManager {
    private static instance;
    private readonly CURRENT_VERSION;
    private readonly migrations;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): StorageMigrationManager;
    /**
     * Register all available migrations
     */
    private registerMigrations;
    /**
     * Migrate data from one version to another
     */
    migrateData(data: any, fromVersion: string, toVersion: string): Promise<MigrationResult>;
    /**
     * Get current schema version
     */
    getCurrentVersion(): string;
    /**
     * Check if migration is needed
     */
    isMigrationNeeded(dataVersion: string): boolean;
    /**
     * Get migration path from one version to another
     */
    getMigrationPath(fromVersion: string, toVersion: string): string[];
    /**
     * Validate migrated data
     */
    validateMigratedData(data: StorageSchema): boolean;
    /**
     * Validate a single recipe
     */
    private validateRecipe;
    /**
     * Migration from initial data (no version) to version 1.0.0
     */
    private migrateFromInitialToV1;
    /**
     * Migrate a single recipe to version 1.0.0 format
     */
    private migrateRecipeToV1;
    /**
     * Normalize input type to valid values
     */
    private normalizeInputType;
    /**
     * Generate a temporary ID for migrated recipes
     */
    private generateTempId;
    /**
     * Create backup of data before migration
     */
    createBackup(data: any): string;
    /**
     * Restore data from backup
     */
    restoreFromBackup(backupData: string): any;
    /**
     * Get migration statistics
     */
    getMigrationStats(data: StorageSchema): {
        totalRecipes: number;
        migratedRecipes: number;
        version: string;
        lastUpdated: number;
    };
}
/**
 * Utility function to get migration manager instance
 */
export declare const getMigrationManager: () => StorageMigrationManager;
//# sourceMappingURL=storage-migration.d.ts.map