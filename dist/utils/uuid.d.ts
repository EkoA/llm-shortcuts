/**
 * UUID generation utilities
 * Provides methods for generating unique identifiers for recipes
 */
/**
 * Generate a UUID v4 (random UUID)
 * Uses crypto.randomUUID() if available, falls back to manual generation
 */
export declare function generateUUID(): string;
/**
 * Generate a short UUID (8 characters)
 * Useful for display purposes where full UUIDs are too long
 */
export declare function generateShortUUID(): string;
/**
 * Validate if a string is a valid UUID
 */
export declare function isValidUUID(uuid: string): boolean;
/**
 * Generate a recipe-specific ID
 * Combines timestamp with random component for better uniqueness
 */
export declare function generateRecipeId(): string;
/**
 * Generate a session ID for tracking recipe executions
 */
export declare function generateSessionId(): string;
//# sourceMappingURL=uuid.d.ts.map