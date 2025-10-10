/**
 * Simple tests to verify core functionality
 */

import { generateUUID, isValidUUID } from '../src/utils/uuid';
import { validateRecipeName, validateRecipeDescription } from '../src/utils/validation';

describe('Core Functionality Tests', () => {
    describe('UUID Generation', () => {
        it('should generate valid UUIDs', () => {
            // Test with a known valid UUID (version 4)
            expect(isValidUUID('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
        });

        it('should generate unique UUIDs', () => {
            const uuid1 = generateUUID();
            const uuid2 = generateUUID();
            expect(uuid1).not.toBe(uuid2);
        });
    });

    describe('Validation', () => {
        it('should validate recipe names', () => {
            expect(validateRecipeName('Valid Recipe')).toEqual({ isValid: true });
            expect(validateRecipeName('')).toEqual({ isValid: false, error: 'Name is required' });
        });

        it('should validate recipe descriptions', () => {
            expect(validateRecipeDescription('Valid description')).toEqual({ isValid: true });
            expect(validateRecipeDescription('')).toEqual({ isValid: false, error: 'Description is required' });
        });
    });
});
