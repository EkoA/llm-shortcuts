/**
 * Unit tests for Recipe Manager
 */

import { RecipeManager } from '../../src/core/recipe-manager';
import { CreateRecipeData, UpdateRecipeData, RecipeSearchOptions } from '../../src/models/recipe.model';
import { createMockRecipe, createMockStorageData, mockChromeStorageGet, captureChromeStorageSet } from '../setup';

describe('RecipeManager', () => {
    let recipeManager: RecipeManager;

    beforeEach(() => {
        recipeManager = RecipeManager.getInstance();
    });

    describe('createRecipe', () => {
        it('should create a new recipe with valid data', async () => {
            const recipeData: CreateRecipeData = {
                name: 'Test Recipe',
                description: 'A test recipe',
                prompt: 'Test prompt: {user_input}',
                originalPrompt: 'Test prompt: {user_input}',
                inputType: 'text',
                tags: ['test'],
                pinned: false
            };

            mockChromeStorageGet(createMockStorageData([]));
            const setCalls = captureChromeStorageSet();

            const result = await recipeManager.createRecipe(recipeData);

            expect(result).toMatchObject({
                name: recipeData.name,
                description: recipeData.description,
                prompt: recipeData.prompt,
                originalPrompt: recipeData.originalPrompt,
                inputType: recipeData.inputType,
                tags: recipeData.tags,
                pinned: recipeData.pinned
            });
            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeDefined();
            expect(result.lastUsedAt).toBeNull();

            expect(setCalls).toHaveLength(1);
        });

        it('should throw error for invalid data', async () => {
            const invalidData: CreateRecipeData = {
                name: '', // Invalid: empty name
                description: 'A test recipe',
                prompt: 'Test prompt: {user_input}',
                originalPrompt: 'Test prompt: {user_input}',
                inputType: 'text'
            };

            await expect(recipeManager.createRecipe(invalidData)).rejects.toThrow('Validation failed');
        });
    });

    describe('getRecipe', () => {
        it('should return a recipe by ID', async () => {
            const mockRecipe = createMockRecipe({ id: 'recipe-1' });
            const mockData = createMockStorageData([mockRecipe]);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.getRecipe('recipe-1');

            expect(result).toEqual(mockRecipe);
        });

        it('should return null for non-existent recipe', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            const result = await recipeManager.getRecipe('non-existent');

            expect(result).toBeNull();
        });

        it('should throw error for invalid ID', async () => {
            await expect(recipeManager.getRecipe('')).rejects.toThrow('Invalid recipe ID');
        });
    });

    describe('getAllRecipes', () => {
        it('should return all recipes', async () => {
            const mockRecipes = [
                createMockRecipe({ id: 'recipe-1' }),
                createMockRecipe({ id: 'recipe-2' })
            ];
            const mockData = createMockStorageData(mockRecipes);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.getAllRecipes();

            expect(result).toEqual(mockRecipes);
        });
    });

    describe('updateRecipe', () => {
        it('should update an existing recipe', async () => {
            const originalRecipe = createMockRecipe({ id: 'recipe-1', name: 'Original Name' });
            const mockData = createMockStorageData([originalRecipe]);
            mockChromeStorageGet(mockData);

            const updateData: UpdateRecipeData = {
                id: 'recipe-1',
                name: 'Updated Name'
            };

            const setCalls = captureChromeStorageSet();
            const result = await recipeManager.updateRecipe(updateData);

            expect(result.name).toBe('Updated Name');
            expect(result.id).toBe('recipe-1');
            expect(setCalls).toHaveLength(1);
        });

        it('should throw error for non-existent recipe', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            const updateData: UpdateRecipeData = {
                id: 'non-existent',
                name: 'Updated Name'
            };

            await expect(recipeManager.updateRecipe(updateData)).rejects.toThrow('Recipe with ID non-existent not found');
        });

        it('should throw error for invalid update data', async () => {
            const originalRecipe = createMockRecipe({ id: 'recipe-1' });
            const mockData = createMockStorageData([originalRecipe]);
            mockChromeStorageGet(mockData);

            const invalidUpdateData: UpdateRecipeData = {
                id: 'recipe-1',
                name: '' // Invalid: empty name
            };

            await expect(recipeManager.updateRecipe(invalidUpdateData)).rejects.toThrow('Validation failed');
        });
    });

    describe('deleteRecipe', () => {
        it('should delete an existing recipe', async () => {
            const recipe1 = createMockRecipe({ id: 'recipe-1' });
            const recipe2 = createMockRecipe({ id: 'recipe-2' });
            const mockData = createMockStorageData([recipe1, recipe2]);
            mockChromeStorageGet(mockData);

            const setCalls = captureChromeStorageSet();
            await recipeManager.deleteRecipe('recipe-1');

            expect(setCalls).toHaveLength(1);
            const savedRecipes = setCalls[0]['llm_shortcuts_data'].recipes;
            expect(savedRecipes).toHaveLength(1);
            expect(savedRecipes[0].id).toBe('recipe-2');
        });

        it('should throw error for non-existent recipe', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            await expect(recipeManager.deleteRecipe('non-existent')).rejects.toThrow('Recipe with ID non-existent not found');
        });

        it('should throw error for invalid ID', async () => {
            await expect(recipeManager.deleteRecipe('')).rejects.toThrow('Invalid recipe ID');
        });
    });

    describe('searchRecipes', () => {
        const mockRecipes = [
            createMockRecipe({ id: 'recipe-1', name: 'Email Helper', inputType: 'text', tags: ['email'] }),
            createMockRecipe({ id: 'recipe-2', name: 'Code Review', inputType: 'text', tags: ['code'] }),
            createMockRecipe({ id: 'recipe-3', name: 'Image Analyzer', inputType: 'image', tags: ['image'] })
        ];

        beforeEach(() => {
            const mockData = createMockStorageData(mockRecipes);
            mockChromeStorageGet(mockData);
        });

        it('should return all recipes with no filters', async () => {
            const result = await recipeManager.searchRecipes();

            expect(result.recipes).toHaveLength(3);
            expect(result.total).toBe(3);
        });

        it('should filter by search term', async () => {
            const searchOptions: RecipeSearchOptions = {
                searchTerm: 'Email'
            };

            const result = await recipeManager.searchRecipes(searchOptions);

            expect(result.recipes).toHaveLength(1);
            expect(result.recipes[0]?.name).toBe('Email Helper');
        });

        it('should filter by input type', async () => {
            const searchOptions: RecipeSearchOptions = {
                inputType: 'image'
            };

            const result = await recipeManager.searchRecipes(searchOptions);

            expect(result.recipes).toHaveLength(1);
            expect(result.recipes[0]?.inputType).toBe('image');
        });

        it('should filter by tags', async () => {
            const searchOptions: RecipeSearchOptions = {
                tags: ['code']
            };

            const result = await recipeManager.searchRecipes(searchOptions);

            expect(result.recipes).toHaveLength(1);
            expect(result.recipes[0]?.name).toBe('Code Review');
        });

        it('should filter by pinned status', async () => {
            const pinnedRecipe = createMockRecipe({ id: 'pinned', pinned: true });
            const mockData = createMockStorageData([...mockRecipes, pinnedRecipe]);
            mockChromeStorageGet(mockData);

            const searchOptions: RecipeSearchOptions = {
                pinnedOnly: true
            };

            const result = await recipeManager.searchRecipes(searchOptions);

            expect(result.recipes).toHaveLength(1);
            expect(result.recipes[0]?.pinned).toBe(true);
        });

        it('should sort by name', async () => {
            const searchOptions: RecipeSearchOptions = {
                sortBy: 'name',
                sortDirection: 'asc'
            };

            const result = await recipeManager.searchRecipes(searchOptions);

            expect(result.recipes[0]?.name).toBe('Code Review');
            expect(result.recipes[1]?.name).toBe('Email Helper');
            expect(result.recipes[2]?.name).toBe('Image Analyzer');
        });

        it('should apply limit', async () => {
            const searchOptions: RecipeSearchOptions = {
                limit: 2
            };

            const result = await recipeManager.searchRecipes(searchOptions);

            expect(result.recipes).toHaveLength(2);
        });

        it('should throw error for invalid search options', async () => {
            const invalidOptions = {
                searchTerm: 123 // Invalid: should be string
            };

            await expect(recipeManager.searchRecipes(invalidOptions as any)).rejects.toThrow('Invalid search options');
        });
    });

    describe('getRecipeStats', () => {
        it('should return recipe statistics', async () => {
            const mockRecipes = [
                createMockRecipe({ id: 'recipe-1', inputType: 'text', pinned: true }),
                createMockRecipe({ id: 'recipe-2', inputType: 'image', pinned: false }),
                createMockRecipe({ id: 'recipe-3', inputType: 'both', pinned: true })
            ];
            const mockData = createMockStorageData(mockRecipes);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.getRecipeStats();

            expect(result.totalRecipes).toBe(3);
            expect(result.recipesByInputType.text).toBe(1);
            expect(result.recipesByInputType.image).toBe(1);
            expect(result.recipesByInputType.both).toBe(1);
            expect(result.pinnedRecipes).toBe(2);
            expect(result.mostRecentRecipe).toBeDefined();
            expect(result.oldestRecipe).toBeDefined();
        });

        it('should return empty stats for no recipes', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            const result = await recipeManager.getRecipeStats();

            expect(result.totalRecipes).toBe(0);
            expect(result.recipesByInputType.text).toBe(0);
            expect(result.recipesByInputType.image).toBe(0);
            expect(result.recipesByInputType.both).toBe(0);
            expect(result.pinnedRecipes).toBe(0);
            expect(result.mostRecentRecipe).toBeNull();
            expect(result.oldestRecipe).toBeNull();
        });
    });

    describe('markRecipeAsUsed', () => {
        it('should update lastUsedAt timestamp', async () => {
            const recipe = createMockRecipe({ id: 'recipe-1', lastUsedAt: null });
            const mockData = createMockStorageData([recipe]);
            mockChromeStorageGet(mockData);

            const setCalls = captureChromeStorageSet();
            await recipeManager.markRecipeAsUsed('recipe-1');

            expect(setCalls).toHaveLength(1);
            const updatedRecipe = setCalls[0]['llm_shortcuts_data'].recipes[0];
            expect(updatedRecipe.lastUsedAt).toBeDefined();
            expect(updatedRecipe.lastUsedAt).toBeGreaterThan(0);
        });

        it('should throw error for non-existent recipe', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            await expect(recipeManager.markRecipeAsUsed('non-existent')).rejects.toThrow('Recipe with ID non-existent not found');
        });
    });

    describe('duplicateRecipe', () => {
        it('should create a duplicate of an existing recipe', async () => {
            const originalRecipe = createMockRecipe({ id: 'original' });
            const mockData = createMockStorageData([originalRecipe]);
            mockChromeStorageGet(mockData);

            const setCalls = captureChromeStorageSet();
            const result = await recipeManager.duplicateRecipe('original', 'Duplicated Recipe');

            expect(result.name).toBe('Duplicated Recipe');
            expect(result.id).not.toBe('original');
            expect(result.description).toBe(originalRecipe.description);
            expect(result.prompt).toBe(originalRecipe.prompt);
            expect(result.originalPrompt).toBe(originalRecipe.originalPrompt);
            expect(result.inputType).toBe(originalRecipe.inputType);
            expect(result.tags).toEqual(originalRecipe.tags);
            expect(result.pinned).toBe(false); // Should not inherit pinned status

            expect(setCalls).toHaveLength(1);
        });

        it('should use default name when no new name provided', async () => {
            const originalRecipe = createMockRecipe({ id: 'original', name: 'Original Name' });
            const mockData = createMockStorageData([originalRecipe]);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.duplicateRecipe('original');

            expect(result.name).toBe('Original Name (Copy)');
        });

        it('should throw error for non-existent recipe', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            await expect(recipeManager.duplicateRecipe('non-existent')).rejects.toThrow('Recipe with ID non-existent not found');
        });
    });

    describe('toggleRecipePin', () => {
        it('should toggle pin status from false to true', async () => {
            const recipe = createMockRecipe({ id: 'recipe-1', pinned: false });
            const mockData = createMockStorageData([recipe]);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.toggleRecipePin('recipe-1');

            expect(result.pinned).toBe(true);
        });

        it('should toggle pin status from true to false', async () => {
            const recipe = createMockRecipe({ id: 'recipe-1', pinned: true });
            const mockData = createMockStorageData([recipe]);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.toggleRecipePin('recipe-1');

            expect(result.pinned).toBe(false);
        });

        it('should throw error for non-existent recipe', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            await expect(recipeManager.toggleRecipePin('non-existent')).rejects.toThrow('Recipe with ID non-existent not found');
        });
    });

    describe('exportRecipes', () => {
        it('should export all recipes as JSON', async () => {
            const mockRecipes = [createMockRecipe({ id: 'recipe-1' })];
            const mockData = createMockStorageData(mockRecipes);
            mockChromeStorageGet(mockData);

            const result = await recipeManager.exportRecipes();

            expect(typeof result).toBe('string');
            const parsed = JSON.parse(result);
            expect(parsed.recipes).toHaveLength(1);
        });
    });

    describe('importRecipes', () => {
        it('should import recipes from JSON', async () => {
            const mockData = createMockStorageData([createMockRecipe({ id: 'imported' })]);
            const jsonData = JSON.stringify(mockData);

            const setCalls = captureChromeStorageSet();
            await recipeManager.importRecipes(jsonData);

            expect(setCalls).toHaveLength(1);
        });

        it('should throw error for invalid JSON', async () => {
            const invalidJson = 'invalid json';

            await expect(recipeManager.importRecipes(invalidJson)).rejects.toThrow('Failed to import recipes');
        });
    });

    describe('clearAllRecipes', () => {
        it('should clear all recipes', async () => {
            const clearSpy = jest.spyOn(global.chrome.storage.local, 'remove');

            await recipeManager.clearAllRecipes();

            expect(clearSpy).toHaveBeenCalledWith('llm_shortcuts_data');
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage information', async () => {
            const mockUsage = 1024;
            (global.chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(mockUsage);

            const result = await recipeManager.getStorageInfo();

            expect(result.used).toBe(mockUsage);
            expect(result.quota).toBe(global.chrome.storage.local.QUOTA_BYTES);
            expect(result.available).toBe(global.chrome.storage.local.QUOTA_BYTES - mockUsage);
        });
    });
});
