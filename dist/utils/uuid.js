/**
 * UUID generation utilities
 * Provides methods for generating unique identifiers for recipes
 */
/**
 * Generate a UUID v4 (random UUID)
 * Uses crypto.randomUUID() if available, falls back to manual generation
 */
export function generateUUID() {
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
export function generateShortUUID() {
    const uuid = generateUUID();
    return uuid.replace(/-/g, '').substring(0, 8);
}
/**
 * Validate if a string is a valid UUID
 */
export function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}
/**
 * Generate a recipe-specific ID
 * Combines timestamp with random component for better uniqueness
 */
export function generateRecipeId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `recipe_${timestamp}_${random}`;
}
/**
 * Generate a session ID for tracking recipe executions
 */
export function generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `session_${timestamp}_${random}`;
}
//# sourceMappingURL=uuid.js.map