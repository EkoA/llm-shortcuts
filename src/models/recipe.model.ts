/**
 * Recipe model interfaces and types
 * Defines the data structure for LLM prompt templates
 */

/**
 * Input types that a recipe can accept
 */
export type RecipeInputType = 'text' | 'image' | 'both';

/**
 * Core Recipe interface representing a reusable LLM prompt template
 */
export interface Recipe {
    /** Unique identifier for the recipe */
    id: string;
    /** Human-readable name for quick identification */
    name: string;
    /** Description explaining the recipe's purpose and expected output */
    description: string;
    /** The LLM-enhanced prompt template (may include placeholders) */
    prompt: string;
    /** User's original prompt before enhancement */
    originalPrompt: string;
    /** Type of input this recipe accepts (optional - will be determined dynamically) */
    inputType?: RecipeInputType;
    /** When the recipe was created */
    createdAt: number;
    /** When the recipe was last executed */
    lastUsedAt: number | null;
    /** Optional tags for categorization */
    tags?: string[];
    /** Whether this recipe is pinned/favorited */
    pinned?: boolean;
}

/**
 * Recipe creation data (without generated fields)
 */
export interface CreateRecipeData {
    name: string;
    description: string;
    prompt: string;
    originalPrompt: string;
    inputType?: RecipeInputType;
    tags?: string[];
    pinned?: boolean;
}

/**
 * Recipe update data (all fields optional except id)
 */
export interface UpdateRecipeData {
    id: string;
    name?: string;
    description?: string;
    prompt?: string;
    originalPrompt?: string;
    inputType?: RecipeInputType;
    tags?: string[];
    pinned?: boolean;
}

/**
 * Recipe search and filter options
 */
export interface RecipeSearchOptions {
    /** Search term to filter by name or description */
    searchTerm?: string;
    /** Filter by input type */
    inputType?: RecipeInputType;
    /** Filter by tags */
    tags?: string[];
    /** Show only pinned recipes */
    pinnedOnly?: boolean;
    /** Sort order */
    sortBy?: 'name' | 'createdAt' | 'lastUsedAt';
    /** Sort direction */
    sortDirection?: 'asc' | 'desc';
    /** Maximum number of results */
    limit?: number;
}

/**
 * Recipe search results with metadata
 */
export interface RecipeSearchResults {
    /** Matching recipes */
    recipes: Recipe[];
    /** Total number of matching recipes */
    total: number;
    /** Search options used */
    searchOptions: RecipeSearchOptions;
}

/**
 * Recipe validation result
 */
export interface RecipeValidationResult {
    /** Whether the recipe is valid */
    isValid: boolean;
    /** List of validation errors */
    errors: string[];
    /** List of validation warnings */
    warnings: string[];
}

/**
 * Storage version for migration purposes
 */
export interface StorageVersion {
    version: string;
    lastUpdated: number;
}

/**
 * User Guide for persistent context across all recipe executions
 */
export interface UserGuide {
    /** Guide content - persistent context for all recipes */
    content: string;
    /** When the guide was last updated */
    updatedAt: number;
}

/**
 * Complete storage schema
 */
export interface StorageSchema {
    version: StorageVersion;
    recipes: Recipe[];
    /** Optional user guide for persistent context */
    guide?: UserGuide;
}

/**
 * Recipe statistics for analytics
 */
export interface RecipeStats {
    /** Total number of recipes */
    totalRecipes: number;
    /** Number of recipes by input type */
    recipesByInputType: Record<RecipeInputType, number>;
    /** Number of pinned recipes */
    pinnedRecipes: number;
    /** Most recently used recipe */
    mostRecentRecipe: Recipe | null;
    /** Oldest recipe */
    oldestRecipe: Recipe | null;
}

/**
 * Recipe execution context
 */
export interface RecipeExecutionContext {
    /** The recipe being executed */
    recipe: Recipe;
    /** User input data */
    userInput: {
        text?: string;
        image?: File;
    };
    /** Execution timestamp */
    executedAt: number;
    /** Session ID for tracking */
    sessionId: string;
}

/**
 * Recipe execution result
 */
export interface RecipeExecutionResult {
    /** The executed recipe */
    recipe: Recipe;
    /** AI-generated response */
    response: string;
    /** Execution timestamp */
    executedAt: number;
    /** Execution duration in milliseconds */
    duration: number;
    /** Whether execution was successful */
    success: boolean;
    /** Error message if execution failed */
    error?: string;
}
