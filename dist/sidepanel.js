"use strict";
/**
 * Side Panel Controller for LLM Shortcuts
 * Handles UI interactions and AI API integration
 */
// DOM Elements
const aiStatusEl = document.getElementById('ai-status');
const recipeListEl = document.getElementById('recipe-list');
const recipeFormEl = document.getElementById('recipe-form');
const recipeExecutionEl = document.getElementById('recipe-execution');
// Buttons
const createRecipeBtn = document.getElementById('create-recipe-btn');
const cancelRecipeBtn = document.getElementById('cancel-recipe');
const backToListBtn = document.getElementById('back-to-list');
const executeRecipeBtn = document.getElementById('execute-recipe');
const copyResultBtn = document.getElementById('copy-result');
const clearResultBtn = document.getElementById('clear-result');
// Form elements
const recipeForm = document.getElementById('recipe-form-element');
const userInputEl = document.getElementById('user-input');
const resultContentEl = document.getElementById('result-content');
// Search elements
let searchInput = null;
let sortSelect = null;
// State
let aiClient = null;
let recipeManager = null;
let promptExecutor = null;
let currentRecipes = [];
let currentRecipe = null;
let isExecuting = false;
/**
 * Initialize the side panel
 */
async function initialize() {
    console.log('Initializing LLM Shortcuts side panel');
    // Initialize recipe manager
    recipeManager = new RecipeManager();
    // Initialize prompt executor
    promptExecutor = getPromptExecutor();
    // Debug: Check if AI client functions are loaded
    console.log('AI Client loaded. Functions available:');
    console.log('isAIAvailable:', typeof isAIAvailable);
    console.log('getAIClient:', typeof getAIClient);
    console.log('window.ai:', window.ai);
    // Check AI availability
    await checkAIAvailabilityDirect();
    // Set up event listeners
    setupEventListeners();
    // Load initial state
    await loadInitialState();
}
/**
 * Check if Chrome AI API is available directly in sidepanel
 */
async function checkAIAvailabilityDirect() {
    const statusEl = aiStatusEl.querySelector('.loading');
    try {
        console.log('=== AI Availability Debug ===');
        console.log('Checking AI availability in sidepanel...');
        console.log('LanguageModel exists:', !!window.LanguageModel);
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API (LanguageModel) not found. Please ensure Chrome flags are enabled:\n• chrome://flags/#optimization-guide-on-device-model\n• chrome://flags/#prompt-api-for-gemini-nano');
        }
        // Check AI availability using the correct method
        const availability = await aiWindow.LanguageModel.availability();
        console.log('AI availability status:', availability);
        // Check if AI is available or downloadable
        const isAvailable = availability === 'available' || availability === 'downloadable';
        if (!isAvailable) {
            throw new Error(`AI model availability: ${availability}`);
        }
        console.log('✅ AI is available in sidepanel!');
        statusEl.innerHTML = `
        <div class="success">
          ✅ AI is available and working
        </div>
      `;
        aiStatusEl.className = 'ai-status success';
        // Show recipe list
        recipeListEl.style.display = 'block';
    }
    catch (error) {
        console.error('AI availability check failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';
        statusEl.innerHTML = `
      <div class="error">
        ❌ AI not available: ${errorMessage}
        <br><small>Current Chrome version: ${chromeVersion}</small>
        <br><small>Required: Chrome 127+ with AI features enabled</small>
        <br><small>Please check these Chrome flags:</small>
        <br><small>• chrome://flags/#optimization-guide-on-device-model</small>
        <br><small>• chrome://flags/#prompt-api-for-gemini-nano</small>
      </div>
    `;
        aiStatusEl.className = 'ai-status error';
    }
}
/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Recipe creation
    createRecipeBtn?.addEventListener('click', showRecipeForm);
    cancelRecipeBtn?.addEventListener('click', hideRecipeForm);
    // Navigation
    backToListBtn?.addEventListener('click', showRecipeList);
    // Form submission
    recipeForm?.addEventListener('submit', handleRecipeSubmit);
    // Recipe execution
    executeRecipeBtn?.addEventListener('click', handleRecipeExecution);
    copyResultBtn?.addEventListener('click', copyResult);
    clearResultBtn?.addEventListener('click', clearResult);
    // Input type change
    const inputTypeSelect = document.getElementById('recipe-input-type');
    inputTypeSelect?.addEventListener('change', handleInputTypeChange);
    // Search functionality
    searchInput?.addEventListener('input', debounce(handleSearch, 300));
    sortSelect?.addEventListener('change', handleSortChange);
    // Recipe list interactions (event delegation)
    recipeListEl?.addEventListener('click', handleRecipeListClick);
}
/**
 * Load initial state
 */
async function loadInitialState() {
    try {
        // Load recipes from storage
        await loadRecipes();
        // Show recipe list
        showRecipeList();
    }
    catch (error) {
        console.error('Failed to load initial state:', error);
        showRecipeList(); // Show empty state on error
    }
}
/**
 * Show recipe list view
 */
function showRecipeList() {
    recipeListEl.style.display = 'block';
    recipeFormEl.style.display = 'none';
    recipeExecutionEl.style.display = 'none';
}
/**
 * Show recipe creation form
 */
function showRecipeForm() {
    recipeListEl.style.display = 'none';
    recipeFormEl.style.display = 'block';
    recipeExecutionEl.style.display = 'none';
    // Reset form
    recipeForm.reset();
}
/**
 * Hide recipe creation form
 */
function hideRecipeForm() {
    showRecipeList();
}
/**
 * Handle recipe form submission
 */
async function handleRecipeSubmit(event) {
    event.preventDefault();
    const formData = new FormData(recipeForm);
    const recipeData = {
        name: formData.get('name'),
        description: formData.get('description'),
        prompt: formData.get('prompt'),
        originalPrompt: formData.get('prompt'), // Same as prompt for now
        inputType: formData.get('inputType')
    };
    try {
        console.log('Creating recipe:', recipeData);
        // Create recipe using recipe manager
        const recipe = await recipeManager.createRecipe(recipeData);
        console.log('Recipe created successfully:', recipe.id);
        // Reload recipes and show list
        await loadRecipes();
        showRecipeList();
        // Show success message
        alert('Recipe created successfully!');
    }
    catch (error) {
        console.error('Failed to create recipe:', error);
        alert(`Failed to create recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Handle input type change
 */
function handleInputTypeChange(event) {
    const select = event.target;
    const imageSection = document.getElementById('image-input-section');
    if (select.value === 'image' || select.value === 'both') {
        imageSection.style.display = 'block';
    }
    else {
        imageSection.style.display = 'none';
    }
}
/**
 * Handle recipe execution
 */
async function handleRecipeExecution() {
    if (!promptExecutor) {
        alert('Prompt executor not available');
        return;
    }
    if (!currentRecipe) {
        alert('No recipe selected');
        return;
    }
    const userInput = userInputEl.value.trim();
    if (!userInput) {
        alert('Please enter some input');
        return;
    }
    if (isExecuting) {
        alert('Recipe is already executing');
        return;
    }
    // Show loading state
    isExecuting = true;
    executeRecipeBtn.disabled = true;
    executeRecipeBtn.textContent = 'Executing...';
    // Clear previous result
    resultContentEl.textContent = '';
    document.getElementById('execution-result').style.display = 'none';
    try {
        console.log('Executing recipe:', currentRecipe.name);
        // Execute recipe with streaming
        const result = await executeRecipeWithStreaming(currentRecipe, userInput);
        if (result.success) {
            // Show result
            resultContentEl.textContent = result.response || '';
            document.getElementById('execution-result').style.display = 'block';
            // Mark recipe as used
            try {
                await recipeManager.markRecipeAsUsed(currentRecipe.id);
                console.log('Recipe marked as used');
            }
            catch (error) {
                console.warn('Failed to mark recipe as used:', error);
                // Don't show error to user as this is not critical
            }
        }
        else {
            throw new Error(result.error || 'Execution failed');
        }
    }
    catch (error) {
        console.error('Recipe execution failed:', error);
        showExecutionError(error instanceof Error ? error.message : 'Unknown error');
    }
    finally {
        isExecuting = false;
        executeRecipeBtn.disabled = false;
        executeRecipeBtn.textContent = 'Execute Recipe';
    }
}
/**
 * Execute recipe with streaming response
 */
async function executeRecipeWithStreaming(recipe, userInput) {
    try {
        // Use content script for AI API calls
        return await executeWithContentScript(recipe, userInput);
    }
    catch (error) {
        console.error('Content script execution failed:', error);
        throw error;
    }
}
/**
 * Execute recipe using direct AI access
 */
async function executeWithContentScript(recipe, userInput) {
    try {
        console.log('Executing recipe via direct AI access:', recipe.name);
        // Interpolate the prompt with user input
        const interpolatedPrompt = recipe.prompt.replace('{user_input}', userInput);
        // Check if AI is available
        const aiWindow = window;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API not available');
        }
        // Create AI session
        const session = await aiWindow.LanguageModel.create({
            temperature: 0.7,
            topK: 40
        });
        try {
            // Execute prompt
            const response = await session.prompt(interpolatedPrompt);
            session.destroy();
            console.log('Direct AI execution successful');
            return {
                success: true,
                response: response
            };
        }
        catch (error) {
            session.destroy();
            throw error;
        }
    }
    catch (error) {
        console.error('Direct AI execution failed:', error);
        throw error;
    }
}
/**
 * Show execution error
 */
function showExecutionError(errorMessage) {
    const errorHtml = `
        <div class="error-message">
            <h4>Execution Failed</h4>
            <p>${escapeHtml(errorMessage)}</p>
            <button onclick="retryExecution()" class="btn btn-secondary">Retry</button>
        </div>
    `;
    resultContentEl.innerHTML = errorHtml;
    document.getElementById('execution-result').style.display = 'block';
}
/**
 * Retry execution (called from error message)
 */
function retryExecution() {
    if (currentRecipe && !isExecuting) {
        handleRecipeExecution();
    }
}
/**
 * Copy result to clipboard
 */
async function copyResult() {
    try {
        const resultText = resultContentEl.textContent || '';
        if (!resultText.trim()) {
            alert('No result to copy');
            return;
        }
        await navigator.clipboard.writeText(resultText);
        copyResultBtn.textContent = 'Copied!';
        setTimeout(() => {
            copyResultBtn.textContent = 'Copy Result';
        }, 2000);
    }
    catch (error) {
        console.error('Failed to copy result:', error);
        alert('Failed to copy result');
    }
}
/**
 * Clear result
 */
function clearResult() {
    resultContentEl.textContent = '';
    document.getElementById('execution-result').style.display = 'none';
    document.getElementById('execution-stats').style.display = 'none';
}
/**
 * Load recipes from storage
 */
async function loadRecipes() {
    try {
        currentRecipes = await recipeManager.getAllRecipes();
        renderRecipeList();
    }
    catch (error) {
        console.error('Failed to load recipes:', error);
        currentRecipes = [];
        renderRecipeList();
    }
}
/**
 * Render the recipe list
 */
function renderRecipeList() {
    if (!recipeListEl)
        return;
    if (currentRecipes.length === 0) {
        recipeListEl.innerHTML = `
            <div class="empty-state">
                <h3>No recipes yet</h3>
                <p>Create your first recipe to get started!</p>
                <button id="create-recipe-btn" class="btn btn-primary">Create Recipe</button>
            </div>
        `;
        // Re-attach event listener for the new button
        const newCreateBtn = document.getElementById('create-recipe-btn');
        newCreateBtn?.addEventListener('click', showRecipeForm);
        return;
    }
    const recipesHtml = currentRecipes.map(recipe => `
        <div class="recipe-item" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
                <div class="recipe-actions">
                    <button class="btn-icon" data-action="execute" title="Execute Recipe">
                        ▶️
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        ✏️
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        🗑️
                    </button>
                </div>
            </div>
            <p class="recipe-description">${escapeHtml(recipe.description || 'No description')}</p>
            <div class="recipe-meta">
                <span class="recipe-type">${recipe.inputType}</span>
                ${recipe.lastUsedAt ? `<span class="recipe-last-used">Last used: ${formatDate(recipe.lastUsedAt)}</span>` : ''}
                <span class="recipe-created">Created: ${formatDate(recipe.createdAt)}</span>
            </div>
        </div>
    `).join('');
    recipeListEl.innerHTML = `
        <div class="recipe-list-header">
            <div class="search-container">
                <input type="text" id="search-recipes" placeholder="Search recipes..." class="search-input">
            </div>
            <div class="sort-container">
                <select id="sort-recipes" class="sort-select">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="created-desc">Newest First</option>
                    <option value="created-asc">Oldest First</option>
                    <option value="lastUsed-desc">Recently Used</option>
                </select>
            </div>
        </div>
        <div class="recipe-list-content">
            ${recipesHtml}
        </div>
    `;
    // Re-attach event listeners for search and sort
    const newSearchInput = document.getElementById('search-recipes');
    const newSortSelect = document.getElementById('sort-recipes');
    if (newSearchInput) {
        searchInput = newSearchInput;
        newSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    if (newSortSelect) {
        sortSelect = newSortSelect;
        newSortSelect.addEventListener('change', handleSortChange);
    }
}
/**
 * Handle recipe list click events (event delegation)
 */
function handleRecipeListClick(event) {
    const target = event.target;
    const recipeItem = target.closest('.recipe-item');
    if (!recipeItem)
        return;
    const recipeId = recipeItem.dataset['recipeId'];
    if (!recipeId)
        return;
    const action = target.dataset['action'];
    switch (action) {
        case 'execute':
            executeRecipe(recipeId);
            break;
        case 'edit':
            editRecipe(recipeId);
            break;
        case 'delete':
            deleteRecipe(recipeId);
            break;
        default:
            // Click on recipe item itself - execute it
            executeRecipe(recipeId);
            break;
    }
}
/**
 * Handle search input
 */
function handleSearch() {
    if (!searchInput)
        return;
    const searchTerm = searchInput.value.toLowerCase().trim();
    if (!searchTerm) {
        // Show all recipes if no search term
        renderRecipeList();
        return;
    }
    // Filter recipes based on search term
    const filteredRecipes = currentRecipes.filter(recipe => recipe.name.toLowerCase().includes(searchTerm) ||
        recipe.description.toLowerCase().includes(searchTerm) ||
        recipe.prompt.toLowerCase().includes(searchTerm));
    renderFilteredRecipeList(filteredRecipes);
}
/**
 * Handle sort change
 */
function handleSortChange() {
    if (!sortSelect)
        return;
    const sortValue = sortSelect.value;
    const [sortBy, direction] = sortValue.split('-');
    const sortedRecipes = [...currentRecipes].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'created':
                comparison = a.createdAt - b.createdAt;
                break;
            case 'lastUsed':
                const aLastUsed = a.lastUsedAt || 0;
                const bLastUsed = b.lastUsedAt || 0;
                comparison = aLastUsed - bLastUsed;
                break;
        }
        return direction === 'desc' ? -comparison : comparison;
    });
    renderFilteredRecipeList(sortedRecipes);
}
/**
 * Render filtered recipe list
 */
function renderFilteredRecipeList(recipes) {
    if (!recipeListEl)
        return;
    const recipeListContent = recipeListEl.querySelector('.recipe-list-content');
    if (!recipeListContent)
        return;
    if (recipes.length === 0) {
        recipeListContent.innerHTML = `
            <div class="empty-state">
                <h3>No recipes found</h3>
                <p>Try adjusting your search terms.</p>
            </div>
        `;
        return;
    }
    const recipesHtml = recipes.map(recipe => `
        <div class="recipe-item" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
                <div class="recipe-actions">
                    <button class="btn-icon" data-action="execute" title="Execute Recipe">
                        ▶️
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        ✏️
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        🗑️
                    </button>
                </div>
            </div>
            <p class="recipe-description">${escapeHtml(recipe.description || 'No description')}</p>
            <div class="recipe-meta">
                <span class="recipe-type">${recipe.inputType}</span>
                ${recipe.lastUsedAt ? `<span class="recipe-last-used">Last used: ${formatDate(recipe.lastUsedAt)}</span>` : ''}
                <span class="recipe-created">Created: ${formatDate(recipe.createdAt)}</span>
            </div>
        </div>
    `).join('');
    recipeListContent.innerHTML = recipesHtml;
}
/**
 * Execute a recipe
 */
async function executeRecipe(recipeId) {
    try {
        const recipe = await recipeManager.getRecipe(recipeId);
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        currentRecipe = recipe;
        showRecipeExecution();
    }
    catch (error) {
        console.error('Failed to load recipe:', error);
        alert('Failed to load recipe');
    }
}
/**
 * Edit a recipe
 */
async function editRecipe(recipeId) {
    try {
        const recipe = await recipeManager.getRecipe(recipeId);
        if (!recipe) {
            alert('Recipe not found');
            return;
        }
        // TODO: Implement edit functionality in Phase 5
        alert('Edit functionality will be implemented in Phase 5');
    }
    catch (error) {
        console.error('Failed to load recipe for editing:', error);
        alert('Failed to load recipe for editing');
    }
}
/**
 * Delete a recipe
 */
async function deleteRecipe(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return;
    }
    try {
        await recipeManager.deleteRecipe(recipeId);
        await loadRecipes(); // Reload the list
    }
    catch (error) {
        console.error('Failed to delete recipe:', error);
        alert('Failed to delete recipe');
    }
}
/**
 * Show recipe execution view
 */
function showRecipeExecution() {
    if (!currentRecipe)
        return;
    recipeListEl.style.display = 'none';
    recipeFormEl.style.display = 'none';
    recipeExecutionEl.style.display = 'block';
    // Update execution view with recipe details
    const executionRecipeName = document.getElementById('execution-recipe-name');
    const executionRecipeDescription = document.getElementById('execution-recipe-description');
    if (executionRecipeName) {
        executionRecipeName.textContent = currentRecipe.name;
    }
    if (executionRecipeDescription) {
        executionRecipeDescription.textContent = currentRecipe.description || 'No description';
    }
    // Show/hide image input based on recipe type
    const imageSection = document.getElementById('image-input-section');
    if (imageSection) {
        if (currentRecipe.inputType === 'image' || currentRecipe.inputType === 'both') {
            imageSection.style.display = 'block';
        }
        else {
            imageSection.style.display = 'none';
        }
    }
    // Clear previous input
    if (userInputEl) {
        userInputEl.value = '';
    }
    // Hide previous result
    const executionResult = document.getElementById('execution-result');
    if (executionResult) {
        executionResult.style.display = 'none';
    }
}
/**
 * Utility function to escape HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
/**
 * Utility function to format dates
 */
function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) {
        return 'Today';
    }
    else if (diffDays === 1) {
        return 'Yesterday';
    }
    else if (diffDays < 7) {
        return `${diffDays} days ago`;
    }
    else {
        return date.toLocaleDateString();
    }
}
/**
 * Debounce utility function
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
}
else {
    initialize();
}
//# sourceMappingURL=sidepanel.js.map