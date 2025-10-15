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
let promptEnhancer = null;
let currentRecipes = [];
let currentRecipe = null;
let isExecuting = false;
let editingRecipeId = null;
let formValidationState = {};
let isEnhancing = false;
let currentEnhancement = null;
/**
 * Initialize the side panel
 */
async function initialize() {
    console.log('Initializing LLM Shortcuts side panel');
    // Initialize recipe manager
    recipeManager = new RecipeManager();
    // Initialize prompt executor
    promptExecutor = getPromptExecutor();
    // Initialize prompt enhancer
    promptEnhancer = getPromptEnhancer();
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
        console.log('✓ AI is available in sidepanel!');
        statusEl.innerHTML = `
        <div class="success">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
            <polyline points="20,6 9,17 4,12"></polyline>
          </svg> AI is available and working
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
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg> AI not available: ${errorMessage}
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
    // Enhancement functionality
    const enhancePromptBtn = document.getElementById('enhance-prompt-btn');
    const closeEnhancementBtn = document.getElementById('close-enhancement');
    const acceptEnhancementBtn = document.getElementById('accept-enhancement');
    const rejectEnhancementBtn = document.getElementById('reject-enhancement');
    // Ensure enhance prompt button is visible
    if (enhancePromptBtn) {
        if (window.getComputedStyle(enhancePromptBtn).display === 'none') {
            enhancePromptBtn.style.display = 'block';
        }
    }
    enhancePromptBtn?.addEventListener('click', handleEnhancePrompt);
    closeEnhancementBtn?.addEventListener('click', hideEnhancementUI);
    acceptEnhancementBtn?.addEventListener('click', acceptEnhancement);
    rejectEnhancementBtn?.addEventListener('click', rejectEnhancement);
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
    // Reset form and state
    editingRecipeId = null;
    formValidationState = {};
    recipeForm.reset();
    // Update form title
    const formTitle = document.querySelector('#recipe-form h2');
    if (formTitle) {
        formTitle.textContent = 'Create New Recipe';
    }
    // Update submit button
    const submitBtn = recipeForm.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.textContent = 'Save Recipe';
    }
    // Clear any validation errors
    clearFormValidationErrors();
    // Set up real-time validation
    setupFormValidation();
    // Initialize submit button state
    updateSubmitButtonState();
    // Ensure enhance prompt button is visible after form setup
    const enhancePromptBtn = document.getElementById('enhance-prompt-btn');
    if (enhancePromptBtn && window.getComputedStyle(enhancePromptBtn).display === 'none') {
        enhancePromptBtn.style.display = 'block';
    }
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
    // Validate form before submission
    if (!validateForm()) {
        return;
    }
    const formData = new FormData(recipeForm);
    const recipeData = {
        name: formData.get('name'),
        description: formData.get('description'),
        prompt: formData.get('prompt'),
        originalPrompt: formData.get('prompt'), // Same as prompt for now
        inputType: formData.get('inputType')
    };
    try {
        if (editingRecipeId) {
            // Update existing recipe
            console.log('Updating recipe:', editingRecipeId, recipeData);
            const updateData = {
                id: editingRecipeId,
                ...recipeData
            };
            const recipe = await recipeManager.updateRecipe(updateData);
            console.log('Recipe updated successfully:', recipe.id);
            // Reload recipes and show list
            await loadRecipes();
            showRecipeList();
            // Show success message
            alert('Recipe updated successfully!');
        }
        else {
            // Create new recipe
            console.log('Creating recipe:', recipeData);
            const recipe = await recipeManager.createRecipe(recipeData);
            console.log('Recipe created successfully:', recipe.id);
            // Reload recipes and show list
            await loadRecipes();
            showRecipeList();
            // Show success message
            alert('Recipe created successfully!');
        }
    }
    catch (error) {
        console.error('Failed to save recipe:', error);
        alert(`Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        // Use proper prompt interpolation with sanitization
        const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, {
            maxLength: 10000,
            allowHtml: false,
            escapeSpecialChars: true
        });
        console.log('Interpolated prompt:', interpolatedPrompt);
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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
                <div class="search-container">
                <input type="text" id="search-recipes" placeholder="Search recipes..." class="search-input">
            </div>
            <br>    
    <div class="recipe-list-header">
            <div class="sort-container">
                <select id="sort-recipes" class="sort-select">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="created-desc">Newest First</option>
                    <option value="created-asc">Oldest First</option>
                    <option value="lastUsed-desc">Recently Used</option>
                </select>
            </div>
            <div class="new-recipe-container">
                <button id="create-recipe-btn" class="btn btn-primary"> <svg class="w-[12px] h-[12px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
</svg> 
New Recipe</button>
            </div>
        </div>
        <div class="recipe-list-content">
            ${recipesHtml}
        </div>
    `;
    // Re-attach event listeners for search and sort
    const newSearchInput = document.getElementById('search-recipes');
    const newSortSelect = document.getElementById('sort-recipes');
    const newCreateBtn = document.getElementById('create-recipe-btn');
    if (newSearchInput) {
        searchInput = newSearchInput;
        newSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    if (newSortSelect) {
        sortSelect = newSortSelect;
        newSortSelect.addEventListener('change', handleSortChange);
    }
    if (newCreateBtn) {
        newCreateBtn.addEventListener('click', showRecipeForm);
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
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polygon points="5,3 19,12 5,21"></polygon>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="edit" title="Edit Recipe">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" data-action="delete" title="Delete Recipe">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
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
        // Set editing state
        editingRecipeId = recipeId;
        // Show form
        recipeListEl.style.display = 'none';
        recipeFormEl.style.display = 'block';
        recipeExecutionEl.style.display = 'none';
        // Update form title
        const formTitle = document.querySelector('#recipe-form h2');
        if (formTitle) {
            formTitle.textContent = 'Edit Recipe';
        }
        // Update submit button
        const submitBtn = recipeForm.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Update Recipe';
        }
        // Populate form with existing data
        populateFormWithRecipe(recipe);
        // Clear validation errors and set up validation
        clearFormValidationErrors();
        setupFormValidation();
        // Initialize submit button state
        updateSubmitButtonState();
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
/**
 * Populate form with recipe data for editing
 */
function populateFormWithRecipe(recipe) {
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    const inputTypeSelect = document.getElementById('recipe-input-type');
    if (nameInput)
        nameInput.value = recipe.name;
    if (descriptionInput)
        descriptionInput.value = recipe.description;
    if (promptInput)
        promptInput.value = recipe.prompt;
    if (inputTypeSelect)
        inputTypeSelect.value = recipe.inputType;
    // Trigger input type change to show/hide image section
    if (inputTypeSelect) {
        const event = new Event('change');
        Object.defineProperty(event, 'target', { value: inputTypeSelect });
        handleInputTypeChange(event);
    }
}
/**
 * Set up real-time form validation
 */
function setupFormValidation() {
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    const inputTypeSelect = document.getElementById('recipe-input-type');
    // Add event listeners for real-time validation
    if (nameInput) {
        nameInput.addEventListener('input', () => validateField('name', nameInput.value));
        nameInput.addEventListener('blur', () => validateField('name', nameInput.value));
    }
    if (descriptionInput) {
        descriptionInput.addEventListener('input', () => validateField('description', descriptionInput.value));
        descriptionInput.addEventListener('blur', () => validateField('description', descriptionInput.value));
    }
    if (promptInput) {
        promptInput.addEventListener('input', () => validateField('prompt', promptInput.value));
        promptInput.addEventListener('blur', () => validateField('prompt', promptInput.value));
    }
    if (inputTypeSelect) {
        inputTypeSelect.addEventListener('change', () => validateField('inputType', inputTypeSelect.value));
    }
}
/**
 * Validate a single form field
 */
function validateField(fieldName, value) {
    let isValid = true;
    let errorMessage = '';
    switch (fieldName) {
        case 'name':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Name is required';
            }
            else if (value.trim().length < 1) {
                isValid = false;
                errorMessage = 'Name must be at least 1 character long';
            }
            else if (value.trim().length > 100) {
                isValid = false;
                errorMessage = 'Name must be no more than 100 characters long';
            }
            break;
        case 'description':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Description is required';
            }
            else if (value.trim().length > 500) {
                isValid = false;
                errorMessage = 'Description must be no more than 500 characters long';
            }
            break;
        case 'prompt':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Prompt is required';
            }
            else if (value.trim().length < 1) {
                isValid = false;
                errorMessage = 'Prompt must be at least 1 character long';
            }
            else if (value.trim().length > 10000) {
                isValid = false;
                errorMessage = 'Prompt must be no more than 10,000 characters long';
            }
            break;
        case 'inputType':
            const validTypes = ['text', 'image', 'both'];
            if (!validTypes.includes(value)) {
                isValid = false;
                errorMessage = 'Please select a valid input type';
            }
            break;
    }
    // Update validation state
    formValidationState[fieldName] = isValid;
    // Show/hide error message
    showFieldValidationError(fieldName, isValid, errorMessage);
    // Update submit button state
    updateSubmitButtonState();
    return isValid;
}
/**
 * Show field validation error
 */
function showFieldValidationError(fieldName, isValid, errorMessage) {
    const field = document.getElementById(`recipe-${fieldName}`);
    if (!field)
        return;
    // Remove existing error message
    const existingError = field.parentElement?.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    // Remove error styling
    field.classList.remove('error');
    if (!isValid && errorMessage) {
        // Add error styling
        field.classList.add('error');
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = errorMessage;
        field.parentElement?.appendChild(errorDiv);
    }
}
/**
 * Clear all form validation errors
 */
function clearFormValidationErrors() {
    const fields = ['name', 'description', 'prompt', 'inputType'];
    fields.forEach(fieldName => {
        const field = document.getElementById(`recipe-${fieldName}`);
        if (field) {
            field.classList.remove('error');
            const existingError = field.parentElement?.querySelector('.field-error');
            if (existingError) {
                existingError.remove();
            }
        }
    });
}
/**
 * Validate entire form
 */
function validateForm() {
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    const inputTypeSelect = document.getElementById('recipe-input-type');
    const nameValid = validateField('name', nameInput?.value || '');
    const descriptionValid = validateField('description', descriptionInput?.value || '');
    const promptValid = validateField('prompt', promptInput?.value || '');
    const inputTypeValid = validateField('inputType', inputTypeSelect?.value || '');
    return nameValid && descriptionValid && promptValid && inputTypeValid;
}
/**
 * Update submit button state based on validation
 */
function updateSubmitButtonState() {
    const submitBtn = recipeForm.querySelector('button[type="submit"]');
    if (!submitBtn)
        return;
    // Get current form values
    const nameInput = document.getElementById('recipe-name');
    const descriptionInput = document.getElementById('recipe-description');
    const promptInput = document.getElementById('recipe-prompt');
    const inputTypeSelect = document.getElementById('recipe-input-type');
    // Check if all required fields have values
    const hasName = nameInput?.value.trim().length > 0;
    const hasDescription = descriptionInput?.value.trim().length > 0;
    const hasPrompt = promptInput?.value.trim().length > 0;
    const hasInputType = inputTypeSelect?.value && inputTypeSelect.value !== '';
    // Check if any field has validation errors (only if validation state exists)
    const hasValidationErrors = Object.keys(formValidationState).length > 0 &&
        Object.values(formValidationState).some(valid => valid === false);
    // Enable button if all fields have values and no validation errors
    submitBtn.disabled = !(hasName && hasDescription && hasPrompt && hasInputType) || hasValidationErrors;
}
/**
 * Handle prompt enhancement request
 */
async function handleEnhancePrompt() {
    if (!promptEnhancer) {
        alert('Prompt enhancer not available');
        return;
    }
    const promptInput = document.getElementById('recipe-prompt');
    if (!promptInput)
        return;
    const originalPrompt = promptInput.value.trim();
    if (!originalPrompt) {
        alert('Please enter a prompt to enhance');
        return;
    }
    if (isEnhancing) {
        alert('Enhancement is already in progress');
        return;
    }
    try {
        isEnhancing = true;
        showEnhancementLoading();
        console.log('Enhancing prompt:', originalPrompt);
        const result = await promptEnhancer.enhancePrompt(originalPrompt);
        console.log('Enhancement result received:', result);
        if (result.success && result.enhancedPrompt) {
            console.log('Enhancement successful, showing result');
            currentEnhancement = result;
            showEnhancementResult(result);
        }
        else {
            console.log('Enhancement failed, showing error');
            showEnhancementError(result.error || 'Enhancement failed');
        }
    }
    catch (error) {
        console.error('Prompt enhancement failed:', error);
        showEnhancementError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
    finally {
        isEnhancing = false;
    }
}
/**
 * Show enhancement loading state
 */
function showEnhancementLoading() {
    console.log('Showing enhancement loading state');
    const enhancementUI = document.getElementById('enhancement-ui');
    const enhancementContent = enhancementUI?.querySelector('.enhancement-content');
    console.log('Loading state elements:');
    console.log('- enhancementUI:', !!enhancementUI);
    console.log('- enhancementContent:', !!enhancementContent);
    if (!enhancementUI || !enhancementContent) {
        console.error('Missing enhancement UI elements for loading state');
        return;
    }
    enhancementUI.style.display = 'block';
    enhancementContent.innerHTML = `
        <div class="enhancement-loading">
            <div class="spinner"></div>
            Enhancing your prompt...
        </div>
    `;
    console.log('Enhancement loading state displayed');
}
/**
 * Show enhancement result
 */
function showEnhancementResult(result) {
    console.log('Showing enhancement result:', result);
    const enhancementUI = document.getElementById('enhancement-ui');
    const originalDisplay = document.getElementById('original-prompt-display');
    const enhancedDisplay = document.getElementById('enhanced-prompt-display');
    const improvementsList = document.getElementById('enhancement-improvements');
    console.log('Enhancement UI elements found:');
    console.log('- enhancementUI:', !!enhancementUI);
    console.log('- originalDisplay:', !!originalDisplay);
    console.log('- enhancedDisplay:', !!enhancedDisplay);
    console.log('- improvementsList:', !!improvementsList);
    if (!enhancementUI) {
        console.error('Enhancement UI container not found');
        return;
    }
    // Make sure the enhancement UI is visible first
    enhancementUI.style.display = 'block';
    // Now try to find the child elements again
    const originalDisplayRetry = document.getElementById('original-prompt-display');
    const enhancedDisplayRetry = document.getElementById('enhanced-prompt-display');
    const improvementsListRetry = document.getElementById('enhancement-improvements');
    console.log('Retry after making UI visible:');
    console.log('- originalDisplayRetry:', !!originalDisplayRetry);
    console.log('- enhancedDisplayRetry:', !!enhancedDisplayRetry);
    console.log('- improvementsListRetry:', !!improvementsListRetry);
    if (!originalDisplayRetry || !enhancedDisplayRetry || !improvementsListRetry) {
        console.error('Missing enhancement UI elements after making visible, cannot display result');
        return;
    }
    // Show original and enhanced prompts
    originalDisplayRetry.textContent = result.originalPrompt || '';
    enhancedDisplayRetry.textContent = result.enhancedPrompt || '';
    // Show improvements
    if (result.improvements && result.improvements.length > 0) {
        improvementsListRetry.innerHTML = `
            <h5>Improvements made:</h5>
            <ul>
                ${result.improvements.map((improvement) => `<li>${escapeHtml(improvement)}</li>`).join('')}
            </ul>
        `;
    }
    else {
        improvementsListRetry.innerHTML = '';
    }
    console.log('Enhancement result displayed successfully');
}
/**
 * Show enhancement error
 */
function showEnhancementError(errorMessage) {
    const enhancementUI = document.getElementById('enhancement-ui');
    const enhancementContent = enhancementUI?.querySelector('.enhancement-content');
    if (!enhancementUI || !enhancementContent)
        return;
    enhancementUI.style.display = 'block';
    enhancementContent.innerHTML = `
        <div class="enhancement-error">
            <strong>Enhancement failed:</strong> ${escapeHtml(errorMessage)}
        </div>
        <div class="enhancement-actions">
            <button type="button" id="close-enhancement" class="btn btn-secondary btn-sm">
                Close
            </button>
        </div>
    `;
    // Re-attach close button event listener
    const closeBtn = document.getElementById('close-enhancement');
    closeBtn?.addEventListener('click', hideEnhancementUI);
}
/**
 * Accept enhancement and update the prompt field
 */
function acceptEnhancement() {
    if (!currentEnhancement || !currentEnhancement.enhancedPrompt)
        return;
    const promptInput = document.getElementById('recipe-prompt');
    if (promptInput) {
        promptInput.value = currentEnhancement.enhancedPrompt;
        // Trigger validation to update form state
        validateField('prompt', currentEnhancement.enhancedPrompt);
    }
    hideEnhancementUI();
    currentEnhancement = null;
}
/**
 * Reject enhancement and keep original prompt
 */
function rejectEnhancement() {
    hideEnhancementUI();
    currentEnhancement = null;
}
/**
 * Hide enhancement UI
 */
function hideEnhancementUI() {
    const enhancementUI = document.getElementById('enhancement-ui');
    if (enhancementUI) {
        enhancementUI.style.display = 'none';
    }
    currentEnhancement = null;
}
// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
}
else {
    initialize();
}
//# sourceMappingURL=sidepanel.js.map