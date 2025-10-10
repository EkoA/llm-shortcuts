/**
 * Unit tests for Storage Migration
 */

import { StorageMigrationManager } from '../../src/core/storage-migration';
import { StorageSchema } from '../../src/models/recipe.model';
import { createMockRecipe } from '../setup';

describe('StorageMigrationManager', () => {
    let migrationManager: StorageMigrationManager;

    beforeEach(() => {
        migrationManager = StorageMigrationManager.getInstance();
    });

    describe('migrateData', () => {
        it('should return data unchanged when versions match', async () => {
            const data: StorageSchema = {
                version: { version: '1.0.0', lastUpdated: Date.now() },
                recipes: [createMockRecipe()]
            };

            const result = await migrationManager.migrateData(data, '1.0.0', '1.0.0');

            expect(result.success).toBe(true);
            expect(result.migratedData).toEqual(data);
        });

        it('should migrate from initial data to v1.0.0', async () => {
            const initialData = [createMockRecipe({ id: 'old-recipe' })];

            const result = await migrationManager.migrateData(initialData, '0.0.0', '1.0.0');

            expect(result.success).toBe(true);
            expect(result.migratedData).toBeDefined();
            expect(result.migratedData!.version.version).toBe('1.0.0');
            expect(result.migratedData!.recipes).toHaveLength(1);
            expect(result.migratedData?.recipes[0]?.id).toBe('old-recipe');
        });

        it('should handle data with recipes property', async () => {
            const dataWithRecipes = {
                recipes: [createMockRecipe({ id: 'recipe-1' })]
            };

            const result = await migrationManager.migrateData(dataWithRecipes, '0.0.0', '1.0.0');

            expect(result.success).toBe(true);
            expect(result.migratedData!.recipes).toHaveLength(1);
            expect(result.migratedData?.recipes[0]?.id).toBe('recipe-1');
        });

        it('should handle unknown data format', async () => {
            const unknownData = 'not an object';

            const result = await migrationManager.migrateData(unknownData, '0.0.0', '1.0.0');

            expect(result.success).toBe(true);
            expect(result.migratedData!.recipes).toHaveLength(0);
        });

        it('should fail for unsupported migration path', async () => {
            const data = { version: { version: '2.0.0' }, recipes: [] };

            const result = await migrationManager.migrateData(data, '2.0.0', '1.0.0');

            expect(result.success).toBe(false);
            expect(result.error).toContain('No migration available');
        });
    });

    describe('getCurrentVersion', () => {
        it('should return current version', () => {
            const version = migrationManager.getCurrentVersion();
            expect(version).toBe('1.0.0');
        });
    });

    describe('isMigrationNeeded', () => {
        it('should return false for current version', () => {
            expect(migrationManager.isMigrationNeeded('1.0.0')).toBe(false);
        });

        it('should return true for different version', () => {
            expect(migrationManager.isMigrationNeeded('0.0.0')).toBe(true);
            expect(migrationManager.isMigrationNeeded('2.0.0')).toBe(true);
        });
    });

    describe('getMigrationPath', () => {
        it('should return empty path for same version', () => {
            const path = migrationManager.getMigrationPath('1.0.0', '1.0.0');
            expect(path).toEqual([]);
        });

        it('should return migration path for different versions', () => {
            const path = migrationManager.getMigrationPath('0.0.0', '1.0.0');
            expect(path).toEqual(['0.0.0']);
        });
    });

    describe('validateMigratedData', () => {
        it('should validate correct data structure', () => {
            const validData: StorageSchema = {
                version: { version: '1.0.0', lastUpdated: Date.now() },
                recipes: [createMockRecipe()]
            };

            expect(migrationManager.validateMigratedData(validData)).toBe(true);
        });

        it('should reject data with missing version', () => {
            const invalidData = {
                recipes: [createMockRecipe()]
            } as any;

            expect(migrationManager.validateMigratedData(invalidData)).toBe(false);
        });

        it('should reject data with missing recipes', () => {
            const invalidData = {
                version: { version: '1.0.0', lastUpdated: Date.now() }
            } as any;

            expect(migrationManager.validateMigratedData(invalidData)).toBe(false);
        });

        it('should reject data with invalid version format', () => {
            const invalidData = {
                version: { version: 123, lastUpdated: Date.now() },
                recipes: []
            } as any;

            expect(migrationManager.validateMigratedData(invalidData)).toBe(false);
        });

        it('should reject data with non-array recipes', () => {
            const invalidData = {
                version: { version: '1.0.0', lastUpdated: Date.now() },
                recipes: 'not an array'
            } as any;

            expect(migrationManager.validateMigratedData(invalidData)).toBe(false);
        });

        it('should reject data with invalid recipes', () => {
            const invalidData = {
                version: { version: '1.0.0', lastUpdated: Date.now() },
                recipes: [{ id: 123 }] // Invalid recipe
            } as any;

            expect(migrationManager.validateMigratedData(invalidData)).toBe(false);
        });
    });

    describe('createBackup', () => {
        it('should create JSON backup of data', () => {
            const data = { test: 'data' };
            const backup = migrationManager.createBackup(data);

            expect(typeof backup).toBe('string');
            expect(JSON.parse(backup)).toEqual(data);
        });

        it('should handle circular references gracefully', () => {
            const circularData: any = { test: 'data' };
            circularData.self = circularData;

            expect(() => migrationManager.createBackup(circularData)).toThrow('Failed to create backup');
        });
    });

    describe('restoreFromBackup', () => {
        it('should restore data from backup', () => {
            const originalData = { test: 'data' };
            const backup = JSON.stringify(originalData);
            const restored = migrationManager.restoreFromBackup(backup);

            expect(restored).toEqual(originalData);
        });

        it('should throw error for invalid JSON', () => {
            const invalidBackup = 'invalid json';

            expect(() => migrationManager.restoreFromBackup(invalidBackup)).toThrow('Failed to restore from backup');
        });
    });

    describe('getMigrationStats', () => {
        it('should return migration statistics', () => {
            const data: StorageSchema = {
                version: { version: '1.0.0', lastUpdated: Date.now() },
                recipes: [
                    createMockRecipe({ id: 'migrated_123_abc' }),
                    createMockRecipe({ id: 'normal-recipe' })
                ]
            };

            const stats = migrationManager.getMigrationStats(data);

            expect(stats.totalRecipes).toBe(2);
            expect(stats.migratedRecipes).toBe(1);
            expect(stats.version).toBe('1.0.0');
            expect(stats.lastUpdated).toBe(data.version.lastUpdated);
        });
    });

    describe('migrateRecipeToV1', () => {
        it('should migrate recipe with all fields', () => {
            const oldRecipe = {
                id: 'old-id',
                name: 'Old Recipe',
                description: 'Old description',
                prompt: 'Old prompt',
                originalPrompt: 'Old original',
                inputType: 'text',
                tags: ['old-tag'],
                pinned: true,
                createdAt: 1234567890,
                lastUsedAt: 1234567891
            };

            // Access private method through migration
            const migrationResult = migrationManager['migrateFromInitialToV1']([oldRecipe]);
            const migratedRecipe = migrationResult.recipes[0];

            expect(migratedRecipe?.id).toBe('old-id');
            expect(migratedRecipe?.name).toBe('Old Recipe');
            expect(migratedRecipe?.description).toBe('Old description');
            expect(migratedRecipe?.prompt).toBe('Old prompt');
            expect(migratedRecipe?.originalPrompt).toBe('Old original');
            expect(migratedRecipe?.inputType).toBe('text');
            expect(migratedRecipe?.tags).toEqual(['old-tag']);
            expect(migratedRecipe?.pinned).toBe(true);
            expect(migratedRecipe?.createdAt).toBe(1234567890);
            expect(migratedRecipe?.lastUsedAt).toBe(1234567891);
        });

        it('should provide defaults for missing fields', () => {
            const incompleteRecipe = {
                name: 'Incomplete Recipe'
            };

            const migrationResult = migrationManager['migrateFromInitialToV1']([incompleteRecipe]);
            const migratedRecipe = migrationResult.recipes[0];

            expect(migratedRecipe?.id).toMatch(/^migrated_\d+_\w+$/);
            expect(migratedRecipe?.name).toBe('Incomplete Recipe');
            expect(migratedRecipe?.description).toBe('');
            expect(migratedRecipe?.prompt).toBe('');
            expect(migratedRecipe?.originalPrompt).toBe('');
            expect(migratedRecipe?.inputType).toBe('text');
            expect(migratedRecipe?.tags).toEqual([]);
            expect(migratedRecipe?.pinned).toBe(false);
            expect(migratedRecipe?.createdAt).toBeGreaterThan(0);
            expect(migratedRecipe?.lastUsedAt).toBeNull();
        });

        it('should normalize input types', () => {
            const recipeWithInvalidInputType = {
                inputType: 'INVALID_TYPE'
            };

            const migrationResult = migrationManager['migrateFromInitialToV1']([recipeWithInvalidInputType]);
            const migratedRecipe = migrationResult.recipes[0];

            expect(migratedRecipe?.inputType).toBe('text');
        });

        it('should handle valid input types', () => {
            const recipeWithValidInputType = {
                inputType: 'IMAGE'
            };

            const migrationResult = migrationManager['migrateFromInitialToV1']([recipeWithValidInputType]);
            const migratedRecipe = migrationResult.recipes[0];

            expect(migratedRecipe?.inputType).toBe('image');
        });
    });
});
