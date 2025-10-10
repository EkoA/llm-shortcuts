/**
 * Unit tests for Storage Service
 */

import { StorageService } from '../../src/core/storage';
import { createMockRecipe, createMockStorageData, mockChromeStorageGet, captureChromeStorageSet } from '../setup';

describe('StorageService', () => {
    let storageService: StorageService;

    beforeEach(() => {
        storageService = StorageService.getInstance();
    });

    describe('getAllData', () => {
        it('should return default schema when no data exists', async () => {
            mockChromeStorageGet(undefined);

            const result = await storageService.getAllData();

            expect(result).toEqual({
                version: {
                    version: '1.0.0',
                    lastUpdated: expect.any(Number)
                },
                recipes: []
            });
        });

        it('should return existing data when available', async () => {
            const mockData = createMockStorageData([createMockRecipe()]);
            mockChromeStorageGet(mockData);

            const result = await storageService.getAllData();

            expect(result).toEqual(mockData);
        });

        it('should throw error when Chrome storage is not available', async () => {
            // @ts-ignore - Mock chrome as undefined
            global.chrome = undefined;

            await expect(storageService.getAllData()).rejects.toThrow('Chrome storage API is not available');
        });
    });

    describe('saveAllData', () => {
        it('should save data to Chrome storage', async () => {
            const mockData = createMockStorageData([createMockRecipe()]);
            const setCalls = captureChromeStorageSet();

            await storageService.saveAllData(mockData);

            expect(setCalls).toHaveLength(1);
            expect(setCalls[0]).toHaveProperty('llm_shortcuts_data');
            expect(setCalls[0]['llm_shortcuts_data'].version.version).toBe('1.0.0');
        });

        it('should throw error when Chrome storage is not available', async () => {
            // @ts-ignore - Mock chrome as undefined
            global.chrome = undefined;

            const mockData = createMockStorageData();
            await expect(storageService.saveAllData(mockData)).rejects.toThrow('Chrome storage API is not available');
        });
    });

    describe('getRecipes', () => {
        it('should return recipes from storage', async () => {
            const mockRecipes = [createMockRecipe({ id: 'recipe-1' }), createMockRecipe({ id: 'recipe-2' })];
            const mockData = createMockStorageData(mockRecipes);
            mockChromeStorageGet(mockData);

            const result = await storageService.getRecipes();

            expect(result).toEqual(mockRecipes);
        });

        it('should return empty array when no recipes exist', async () => {
            mockChromeStorageGet(createMockStorageData([]));

            const result = await storageService.getRecipes();

            expect(result).toEqual([]);
        });
    });

    describe('saveRecipes', () => {
        it('should save recipes to storage', async () => {
            const mockRecipes = [createMockRecipe({ id: 'recipe-1' })];
            const setCalls = captureChromeStorageSet();

            await storageService.saveRecipes(mockRecipes);

            expect(setCalls).toHaveLength(1);
            expect(setCalls[0]['llm_shortcuts_data'].recipes).toEqual(mockRecipes);
        });
    });

    describe('addRecipe', () => {
        it('should add a new recipe to existing recipes', async () => {
            const existingRecipe = createMockRecipe({ id: 'existing' });
            const newRecipe = createMockRecipe({ id: 'new' });
            const mockData = createMockStorageData([existingRecipe]);
            mockChromeStorageGet(mockData);
            const setCalls = captureChromeStorageSet();

            await storageService.addRecipe(newRecipe);

            expect(setCalls).toHaveLength(1);
            const savedRecipes = setCalls[0]['llm_shortcuts_data'].recipes;
            expect(savedRecipes).toHaveLength(2);
            expect(savedRecipes).toContainEqual(existingRecipe);
            expect(savedRecipes).toContainEqual(newRecipe);
        });
    });

    describe('updateRecipe', () => {
        it('should update an existing recipe', async () => {
            const originalRecipe = createMockRecipe({ id: 'recipe-1', name: 'Original Name' });
            const updatedRecipe = { ...originalRecipe, name: 'Updated Name' };
            const mockData = createMockStorageData([originalRecipe]);
            mockChromeStorageGet(mockData);
            const setCalls = captureChromeStorageSet();

            await storageService.updateRecipe(updatedRecipe);

            expect(setCalls).toHaveLength(1);
            const savedRecipes = setCalls[0]['llm_shortcuts_data'].recipes;
            expect(savedRecipes).toHaveLength(1);
            expect(savedRecipes[0]).toEqual(updatedRecipe);
        });

        it('should throw error when recipe not found', async () => {
            const mockData = createMockStorageData([]);
            mockChromeStorageGet(mockData);
            const nonExistentRecipe = createMockRecipe({ id: 'non-existent' });

            await expect(storageService.updateRecipe(nonExistentRecipe)).rejects.toThrow('Recipe with ID non-existent not found');
        });
    });

    describe('deleteRecipe', () => {
        it('should delete an existing recipe', async () => {
            const recipe1 = createMockRecipe({ id: 'recipe-1' });
            const recipe2 = createMockRecipe({ id: 'recipe-2' });
            const mockData = createMockStorageData([recipe1, recipe2]);
            mockChromeStorageGet(mockData);
            const setCalls = captureChromeStorageSet();

            await storageService.deleteRecipe('recipe-1');

            expect(setCalls).toHaveLength(1);
            const savedRecipes = setCalls[0]['llm_shortcuts_data'].recipes;
            expect(savedRecipes).toHaveLength(1);
            expect(savedRecipes[0]).toEqual(recipe2);
        });

        it('should throw error when recipe not found', async () => {
            const mockData = createMockStorageData([]);
            mockChromeStorageGet(mockData);

            await expect(storageService.deleteRecipe('non-existent')).rejects.toThrow('Recipe with ID non-existent not found');
        });
    });

    describe('getRecipe', () => {
        it('should return a specific recipe by ID', async () => {
            const recipe1 = createMockRecipe({ id: 'recipe-1' });
            const recipe2 = createMockRecipe({ id: 'recipe-2' });
            const mockData = createMockStorageData([recipe1, recipe2]);
            mockChromeStorageGet(mockData);

            const result = await storageService.getRecipe('recipe-1');

            expect(result).toEqual(recipe1);
        });

        it('should return null when recipe not found', async () => {
            const mockData = createMockStorageData([]);
            mockChromeStorageGet(mockData);

            const result = await storageService.getRecipe('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('clearAllData', () => {
        it('should remove all data from storage', async () => {
            const removeSpy = jest.spyOn(global.chrome.storage.local, 'remove');

            await storageService.clearAllData();

            expect(removeSpy).toHaveBeenCalledWith('llm_shortcuts_data');
        });
    });

    describe('getStorageInfo', () => {
        it('should return storage usage information', async () => {
            const mockUsage = 1024;
            (global.chrome.storage.local.getBytesInUse as jest.Mock).mockResolvedValue(mockUsage);

            const result = await storageService.getStorageInfo();

            expect(result).toEqual({
                used: mockUsage,
                available: global.chrome.storage.local.QUOTA_BYTES - mockUsage,
                quota: global.chrome.storage.local.QUOTA_BYTES
            });
        });
    });

    describe('exportData', () => {
        it('should export all data as JSON string', async () => {
            const mockData = createMockStorageData([createMockRecipe()]);
            mockChromeStorageGet(mockData);

            const result = await storageService.exportData();

            expect(typeof result).toBe('string');
            const parsed = JSON.parse(result);
            expect(parsed).toEqual(mockData);
        });
    });

    describe('importData', () => {
        it('should import data from JSON string', async () => {
            const mockData = createMockStorageData([createMockRecipe()]);
            const jsonData = JSON.stringify(mockData);
            const setCalls = captureChromeStorageSet();

            await storageService.importData(jsonData);

            expect(setCalls).toHaveLength(1);
            expect(setCalls[0]['llm_shortcuts_data']).toEqual(mockData);
        });

        it('should throw error for invalid JSON', async () => {
            const invalidJson = 'invalid json';

            await expect(storageService.importData(invalidJson)).rejects.toThrow('Failed to import data');
        });
    });

    describe('onStorageChanged', () => {
        it('should add storage change listener', () => {
            const callback = jest.fn();
            const addListenerSpy = jest.spyOn(global.chrome.storage.onChanged, 'addListener');

            storageService.onStorageChanged(callback);

            expect(addListenerSpy).toHaveBeenCalledWith(callback);
        });

        it('should remove storage change listener', () => {
            const callback = jest.fn();
            const removeListenerSpy = jest.spyOn(global.chrome.storage.onChanged, 'removeListener');
            (global.chrome.storage.onChanged.hasListener as jest.Mock).mockReturnValue(true);

            storageService.removeStorageListener(callback);

            expect(removeListenerSpy).toHaveBeenCalledWith(callback);
        });
    });
});
