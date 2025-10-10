/**
 * Unit tests for UUID utilities
 */

import {
    generateUUID,
    generateShortUUID,
    isValidUUID,
    generateRecipeId,
    generateSessionId
} from '../../src/utils/uuid';

describe('UUID utilities', () => {
    describe('generateUUID', () => {
        it('should generate valid UUIDs', () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();

            expect(isValidUUID(uuid1)).toBe(true);
            expect(isValidUUID(uuid2)).toBe(true);
            expect(uuid1).not.toBe(uuid2);
        });

        it('should generate UUIDs with correct format', () => {
            const uuid = generateUUID();
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

            expect(uuid).toMatch(uuidRegex);
        });

        it('should generate unique UUIDs', () => {
            const uuids = new Set();
            for (let i = 0; i < 100; i++) {
                uuids.add(generateUUID());
            }

            expect(uuids.size).toBe(100);
        });
    });

    describe('generateShortUUID', () => {
        it('should generate short UUIDs', () => {
            const shortUuid = generateShortUUID();

            expect(shortUuid).toHaveLength(8);
            expect(shortUuid).toMatch(/^[0-9a-f]{8}$/i);
        });

        it('should generate unique short UUIDs', () => {
            const shortUuids = new Set();
            for (let i = 0; i < 100; i++) {
                shortUuids.add(generateShortUUID());
            }

            expect(shortUuids.size).toBe(100);
        });
    });

    describe('isValidUUID', () => {
        it('should validate correct UUIDs', () => {
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
            expect(isValidUUID('00000000-0000-4000-8000-000000000000')).toBe(true);
            expect(isValidUUID('ffffffff-ffff-4fff-bfff-ffffffffffff')).toBe(true);
        });

        it('should reject invalid UUIDs', () => {
            expect(isValidUUID('')).toBe(false);
            expect(isValidUUID('not-a-uuid')).toBe(false);
            expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000-extra')).toBe(false);
            expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
            expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400')).toBe(false);
        });

        it('should be case insensitive', () => {
            expect(isValidUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
            expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
        });
    });

    describe('generateRecipeId', () => {
        it('should generate recipe IDs with correct format', () => {
            const recipeId = generateRecipeId();

            expect(recipeId).toMatch(/^recipe_\w+_\w+$/);
            expect(recipeId).toContain('recipe_');
        });

        it('should generate unique recipe IDs', () => {
            const recipeIds = new Set();
            for (let i = 0; i < 100; i++) {
                recipeIds.add(generateRecipeId());
            }

            expect(recipeIds.size).toBe(100);
        });

        it('should include timestamp in recipe ID', () => {
            const before = Date.now();
            const recipeId = generateRecipeId();
            const after = Date.now();

            const timestampPart = recipeId.split('_')[1];
            const timestamp = parseInt(timestampPart || '0', 36);

            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('generateSessionId', () => {
        it('should generate session IDs with correct format', () => {
            const sessionId = generateSessionId();

            expect(sessionId).toMatch(/^session_\w+_\w+$/);
            expect(sessionId).toContain('session_');
        });

        it('should generate unique session IDs', () => {
            const sessionIds = new Set();
            for (let i = 0; i < 100; i++) {
                sessionIds.add(generateSessionId());
            }

            expect(sessionIds.size).toBe(100);
        });

        it('should include timestamp in session ID', () => {
            const before = Date.now();
            const sessionId = generateSessionId();
            const after = Date.now();

            const timestampPart = sessionId.split('_')[1];
            const timestamp = parseInt(timestampPart || '0', 36);

            expect(timestamp).toBeGreaterThanOrEqual(before);
            expect(timestamp).toBeLessThanOrEqual(after);
        });
    });

    describe('fallback UUID generation', () => {
        it('should work when crypto.randomUUID is not available', () => {
            // Mock crypto as undefined
            const originalCrypto = global.crypto;
            // @ts-ignore
            global.crypto = undefined;

            const uuid = generateUUID();

            expect(isValidUUID(uuid)).toBe(true);
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

            // Restore original crypto
            global.crypto = originalCrypto;
        });

        it('should work when crypto.getRandomValues is not available', () => {
            // Mock crypto with limited functionality
            const originalCrypto = global.crypto;
            // @ts-ignore
            global.crypto = {
                randomUUID: undefined as any,
                getRandomValues: undefined as any
            };

            const uuid = generateUUID();

            expect(isValidUUID(uuid)).toBe(true);
            expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

            // Restore original crypto
            global.crypto = originalCrypto;
        });
    });
});
