/**
 * Side Panel Controller for LLM Shortcuts
 * Handles UI interactions and AI API integration
 */

// Import AI client functions - will be available globally after script loads
declare const getAIClient: () => any;
declare const isAIAvailable: () => boolean;

// Recipe Manager will be loaded via script tag
declare const RecipeManager: any;
declare const Recipe: any;

// Prompt Executor will be loaded via script tag
declare const PromptExecutor: any;
declare const getPromptExecutor: () => any;

// Prompt interpolation utilities will be loaded via script tag
declare const interpolatePrompt: (template: string, userInput: string, options?: any, guide?: string) => string;

// Prompt Enhancer will be loaded via script tag
declare const PromptEnhancer: any;
declare const getPromptEnhancer: () => any;

// Storage Service will be loaded via script tag
declare const getStorageService: () => any;

// Type definitions for Recipe
interface Recipe {
    id: string;
    name: string;
    description: string;
    prompt: string;
    originalPrompt: string;
    inputType: 'text' | 'image' | 'both';
    tags?: string[];
    pinned?: boolean;
    createdAt: number;
    lastUsedAt: number | null;
}

// Type definitions for Response History
interface ResponseHistoryItem {
    id: string;
    recipeId: string;
    userInput: string;
    response: string;
    timestamp: number;
    executionTime: number;
}

// DOM Elements
const aiStatusEl = document.getElementById('ai-status') as HTMLElement;
const recipeListEl = document.getElementById('recipe-list') as HTMLElement;
const recipeFormEl = document.getElementById('recipe-form') as HTMLElement;
const recipeExecutionEl = document.getElementById('recipe-execution') as HTMLElement;

// Buttons
const createRecipeBtn = document.getElementById('create-recipe-btn') as HTMLButtonElement;
const cancelRecipeBtn = document.getElementById('cancel-recipe') as HTMLButtonElement;
const backToListBtn = document.getElementById('back-to-list') as HTMLButtonElement;
const executeRecipeBtn = document.getElementById('execute-recipe') as HTMLButtonElement;
const copyResultBtn = document.getElementById('copy-result') as HTMLButtonElement;
const rerunResultBtn = document.getElementById('rerun-result') as HTMLButtonElement;
const clearResultBtn = document.getElementById('clear-result') as HTMLButtonElement;

// Form elements
const recipeForm = document.getElementById('recipe-form-element') as HTMLFormElement;
const userInputEl = document.getElementById('user-input') as HTMLTextAreaElement;
const resultContentEl = document.getElementById('result-content') as HTMLElement;

// Search elements
let searchInput: HTMLInputElement | null = null;
let sortSelect: HTMLSelectElement | null = null;

// State
let aiClient: any = null;
let recipeManager: any = null;
let promptExecutor: any = null;
let promptEnhancer: any = null;
let storageService: any = null;
let currentRecipes: Recipe[] = [];
let currentRecipe: Recipe | null = null;
let isExecuting = false;
let editingRecipeId: string | null = null;
let formValidationState: { [key: string]: boolean } = {};
let isEnhancing = false;
let currentEnhancement: any = null;
let userGuide: string = '';

// Response history state
let responseHistory: Map<string, ResponseHistoryItem[]> = new Map();
let currentHistoryIndex = -1;

// Performance optimization state
let responseCache: Map<string, string> = new Map();
let streamingAnimationFrame: number | null = null;

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

    // Initialize storage service
    storageService = getStorageService();

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

    // Load user guide
    await loadGuide();
}

/**
 * Check if Chrome AI API is available directly in sidepanel
 */
async function checkAIAvailabilityDirect() {
    const statusEl = aiStatusEl.querySelector('.loading') as HTMLElement;

    try {
        console.log('=== AI Availability Debug ===');
        console.log('Checking AI availability in sidepanel...');
        console.log('LanguageModel exists:', !!(window as any).LanguageModel);

        const aiWindow = window as any;

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
          AI is available and working
        </div>
      `;
        aiStatusEl.className = 'ai-status success';

        // Show recipe list
        recipeListEl.style.display = 'block';
    } catch (error) {
        console.error('AI availability check failed:', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || 'Unknown';

        statusEl.innerHTML = `
      <div class="error">
        AI not available: ${errorMessage}
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
    executeRecipeBtn?.addEventListener('click', () => handleRecipeExecution());
    copyResultBtn?.addEventListener('click', copyResult);
    rerunResultBtn?.addEventListener('click', handleRerunResult);
    clearResultBtn?.addEventListener('click', clearResult);


    // Search functionality
    searchInput?.addEventListener('input', debounce(handleSearch, 300));
    sortSelect?.addEventListener('change', handleSortChange);

    // Recipe list interactions (event delegation)
    recipeListEl?.addEventListener('click', handleRecipeListClick);

    // Enhancement functionality
    const enhancePromptBtn = document.getElementById('enhance-prompt-btn') as HTMLButtonElement;
    const closeEnhancementBtn = document.getElementById('close-enhancement') as HTMLButtonElement;
    const acceptEnhancementBtn = document.getElementById('accept-enhancement') as HTMLButtonElement;
    const rejectEnhancementBtn = document.getElementById('reject-enhancement') as HTMLButtonElement;

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

    // Guide management
    const toggleGuideBtn = document.getElementById('toggle-guide-btn') as HTMLButtonElement;
    const closeGuideModalBtn = document.getElementById('close-guide-modal') as HTMLButtonElement;
    const saveGuideBtn = document.getElementById('save-guide-btn') as HTMLButtonElement;
    const clearGuideBtn = document.getElementById('clear-guide-btn') as HTMLButtonElement;
    const guideContentInput = document.getElementById('guide-content') as HTMLTextAreaElement;

    toggleGuideBtn?.addEventListener('click', showGuideModal);
    closeGuideModalBtn?.addEventListener('click', hideGuideModal);
    saveGuideBtn?.addEventListener('click', handleSaveGuide);
    clearGuideBtn?.addEventListener('click', handleClearGuide);
    guideContentInput?.addEventListener('input', updateGuideCharCount);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
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
    } catch (error) {
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
    const submitBtn = recipeForm.querySelector('button[type="submit"]') as HTMLButtonElement;
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
    const enhancePromptBtn = document.getElementById('enhance-prompt-btn') as HTMLButtonElement;
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
async function handleRecipeSubmit(event: Event) {
    event.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
        return;
    }

    const formData = new FormData(recipeForm);

    // Parse tags from comma-separated string
    const tagsString = formData.get('tags') as string;
    const tags = tagsString ? tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0) : [];

    // Get pinned status
    const pinned = formData.get('pinned') === 'on';

    const recipeData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        prompt: formData.get('prompt') as string,
        originalPrompt: formData.get('prompt') as string, // Same as prompt for now
        tags: tags,
        pinned: pinned
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
        } else {
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

    } catch (error) {
        console.error('Failed to save recipe:', error);
        alert(`Failed to save recipe: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}


/**
 * Handle recipe execution
 */
async function handleRecipeExecution(bypassCache = false) {
    if (!promptExecutor) {
        alert('Prompt executor not available');
        return;
    }

    if (!currentRecipe) {
        alert('No recipe selected');
        return;
    }

    const userInput = userInputEl.value.trim();
    const imageInput = document.getElementById('image-input') as HTMLInputElement;
    const imageFile = imageInput?.files?.[0];

    if (!userInput && !imageFile) {
        alert('Please provide either text input or an image');
        return;
    }

    if (isExecuting) {
        alert('Recipe is already executing');
        return;
    }

    // Check for cached response first (unless bypassing cache)
    if (!bypassCache && userInput && !imageFile) {
        const cacheKey = `${currentRecipe.id}_${userInput}`;
        const cachedResponse = responseCache.get(cacheKey);
        if (cachedResponse) {
            console.log('Using cached response');
            resultContentEl.innerHTML = formatResponse(cachedResponse);
            document.getElementById('execution-result')!.style.display = 'block';
            return;
        }
    }

    // Show loading state
    isExecuting = true;
    executeRecipeBtn.disabled = true;
    executeRecipeBtn.textContent = 'Executing...';

    // Clear previous result
    resultContentEl.textContent = '';
    document.getElementById('execution-result')!.style.display = 'none';

    try {
        console.log('Executing recipe:', currentRecipe.name);

        // Execute recipe with streaming
        const result = await executeRecipeWithStreaming(currentRecipe, userInput, imageFile);

        if (result.success) {
            // Show result (already displayed during streaming)
            document.getElementById('execution-result')!.style.display = 'block';

            // Store in response history
            if (currentRecipe) {
                addToResponseHistory(currentRecipe.id, userInput, result.response || '', result.executionTime || 0);
            }

            // Mark recipe as used
            try {
                await recipeManager.markRecipeAsUsed(currentRecipe.id);
                console.log('Recipe marked as used');
            } catch (error) {
                console.warn('Failed to mark recipe as used:', error);
                // Don't show error to user as this is not critical
            }
        } else {
            throw new Error(result.error || 'Execution failed');
        }

    } catch (error) {
        console.error('Recipe execution failed:', error);
        showExecutionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
        isExecuting = false;
        executeRecipeBtn.disabled = false;
        executeRecipeBtn.textContent = 'Execute Recipe';
    }
}

/**
 * Execute recipe with streaming response
 */
async function executeRecipeWithStreaming(recipe: Recipe, userInput: string, imageFile?: File): Promise<any> {
    try {
        // Use streaming execution for better UX
        return await executeWithStreaming(recipe, userInput, imageFile);
    } catch (error) {
        console.error('Streaming execution failed:', error);
        throw error;
    }
}

/**
 * Execute recipe with streaming response
 */
async function executeWithStreaming(recipe: Recipe, userInput: string, imageFile?: File): Promise<any> {
    try {
        console.log('Executing recipe with streaming:', recipe.name);

        // Use proper prompt interpolation with sanitization and guide
        const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, {
            maxLength: 10000,
            allowHtml: false,
            escapeSpecialChars: true
        }, userGuide);

        // Log image file if provided (for future implementation)
        if (imageFile) {
            console.log('Image file provided:', imageFile.name, imageFile.size, 'bytes');
        }

        console.log('Interpolated prompt:', interpolatedPrompt);

        // Check if AI is available
        const aiWindow = window as any;
        if (!aiWindow.LanguageModel) {
            throw new Error('Chrome AI API not available');
        }

        // Create AI session
        const session = await aiWindow.LanguageModel.create({
            temperature: 0.7,
            topK: 40
        });

        try {
            // Show typing indicator
            showTypingIndicator();

            // Execute streaming prompt
            const stream = session.promptStreaming(interpolatedPrompt);
            let fullResponse = '';

            // Process streaming response
            for await (const chunk of stream) {
                fullResponse += chunk;
                // Update UI with new chunk
                updateStreamingResponse(fullResponse);
            }

            // Hide typing indicator
            hideTypingIndicator();

            session.destroy();

            console.log('Streaming execution successful');

            return {
                success: true,
                response: fullResponse
            };
        } catch (error) {
            hideTypingIndicator();
            session.destroy();
            throw error;
        }
    } catch (error) {
        console.error('Streaming execution failed:', error);
        throw error;
    }
}

/**
 * Execute recipe using direct AI access (fallback)
 */
async function executeWithContentScript(recipe: Recipe, userInput: string, imageFile?: File): Promise<any> {
    try {
        console.log('Executing recipe via direct AI access:', recipe.name);

        // Use proper prompt interpolation with sanitization and guide
        const interpolatedPrompt = interpolatePrompt(recipe.prompt, userInput, {
            maxLength: 10000,
            allowHtml: false,
            escapeSpecialChars: true
        }, userGuide);

        // Log image file if provided (for future implementation)
        if (imageFile) {
            console.log('Image file provided:', imageFile.name, imageFile.size, 'bytes');
        }

        console.log('Interpolated prompt:', interpolatedPrompt);

        // Check if AI is available
        const aiWindow = window as any;
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
        } catch (error) {
            session.destroy();
            throw error;
        }
    } catch (error) {
        console.error('Direct AI execution failed:', error);
        throw error;
    }
}


/**
 * Show typing indicator during streaming
 */
function showTypingIndicator() {
    const typingHtml = `
        <div class="typing-indicator">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
            <span class="typing-text">AI is thinking...</span>
        </div>
    `;

    resultContentEl.innerHTML = typingHtml;
    document.getElementById('execution-result')!.style.display = 'block';
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const typingIndicator = resultContentEl.querySelector('.typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Update streaming response with new content (optimized with requestAnimationFrame)
 */
function updateStreamingResponse(response: string) {
    // Cancel previous animation frame if still pending
    if (streamingAnimationFrame) {
        cancelAnimationFrame(streamingAnimationFrame);
    }

    // Use requestAnimationFrame for smooth updates
    streamingAnimationFrame = requestAnimationFrame(() => {
        // Format the response with markdown support
        const formattedResponse = formatResponse(response);

        // Update the content
        resultContentEl.innerHTML = formattedResponse;
        document.getElementById('execution-result')!.style.display = 'block';

        // Scroll to bottom to show latest content
        const executionResult = document.getElementById('execution-result');
        if (executionResult) {
            executionResult.scrollTop = executionResult.scrollHeight;
        }

        streamingAnimationFrame = null;
    });
}

/**
 * Format response with rich markdown support
 */
function formatResponse(response: string): string {
    // First, escape HTML to prevent XSS
    let formatted = escapeHtml(response);

    // Process code blocks first (before other formatting)
    formatted = formatted
        // Code blocks with language specification
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Process headers (must be before other formatting)
    formatted = formatted
        // H1 headers
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        // H2 headers
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        // H3 headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        // H4 headers
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        // H5 headers
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
        // H6 headers
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>');

    // Process lists
    formatted = formatted
        // Unordered lists
        .replace(/^[\s]*[-*+] (.+)$/gm, '<li>$1</li>')
        // Ordered lists
        .replace(/^[\s]*\d+\. (.+)$/gm, '<li>$1</li>');

    // Wrap consecutive list items in ul/ol tags
    formatted = formatted
        .replace(/(<li>.*<\/li>)(\s*<li>.*<\/li>)*/g, (match) => {
            const listItems = match.match(/<li>.*?<\/li>/g);
            if (listItems) {
                return '<ul>' + listItems.join('') + '</ul>';
            }
            return match;
        });

    // Process blockquotes
    formatted = formatted
        .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Process horizontal rules
    formatted = formatted
        .replace(/^---$/gm, '<hr>')
        .replace(/^\*\*\*$/gm, '<hr>')
        .replace(/^___$/gm, '<hr>');

    // Process links
    formatted = formatted
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Process text formatting
    formatted = formatted
        // Bold text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic text
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Strikethrough
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        // Underline (not standard markdown but useful)
        .replace(/__(.*?)__/g, '<u>$1</u>');

    // Process line breaks and paragraphs
    formatted = formatted
        // Convert double line breaks to paragraphs
        .replace(/\n\n/g, '</p><p>')
        // Convert single line breaks to <br>
        .replace(/\n/g, '<br>')
        // Wrap in paragraph tags
        .replace(/^(.*)$/gm, '<p>$1</p>')
        // Clean up empty paragraphs
        .replace(/<p><\/p>/g, '')
        .replace(/<p><br><\/p>/g, '');

    // Clean up code blocks that got wrapped in paragraphs
    formatted = formatted
        .replace(/<p><pre>/g, '<pre>')
        .replace(/<\/pre><\/p>/g, '</pre>')
        .replace(/<p><code>/g, '<code>')
        .replace(/<\/code><\/p>/g, '</code>')
        .replace(/<p><blockquote>/g, '<blockquote>')
        .replace(/<\/blockquote><\/p>/g, '</blockquote>')
        .replace(/<p><hr><\/p>/g, '<hr>')
        .replace(/<p><ul>/g, '<ul>')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><li>/g, '<li>')
        .replace(/<\/li><\/p>/g, '</li>')
        .replace(/<p><h[1-6]>/g, '<h$1>')
        .replace(/<\/h[1-6]><\/p>/g, '</h$1>');

    return formatted;
}

/**
 * Show execution error
 */
function showExecutionError(errorMessage: string) {
    const errorHtml = `
        <div class="error-message">
            <h4>Execution Failed</h4>
            <p>${escapeHtml(errorMessage)}</p>
            <button onclick="retryExecution()" class="btn btn-secondary">Retry</button>
        </div>
    `;

    resultContentEl.innerHTML = errorHtml;
    document.getElementById('execution-result')!.style.display = 'block';
}

/**
 * Retry execution (called from error message)
 */
function retryExecution() {
    if (currentRecipe && !isExecuting) {
        handleRecipeExecution(true);
    }
}

/**
 * Copy result to clipboard
 */
async function copyResult() {
    try {
        if (!resultContentEl.innerHTML.trim()) {
            alert('No result to copy');
            return;
        }

        // Try modern Clipboard API first
        try {
            // Create a temporary div to hold the formatted content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = resultContentEl.innerHTML;

            // Try to copy as HTML using Clipboard API
            const clipboardData = new ClipboardItem({
                'text/html': new Blob([resultContentEl.innerHTML], { type: 'text/html' }),
                'text/plain': new Blob([resultContentEl.textContent || ''], { type: 'text/plain' })
            });

            await navigator.clipboard.write([clipboardData]);

            // Visual feedback
            showCopySuccess();
            return;

        } catch (clipboardError) {
            console.log('Clipboard API failed, trying fallback:', clipboardError);
        }

        // Fallback 1: Try document.execCommand for rich text
        try {
            // Create a temporary div to hold the formatted content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = resultContentEl.innerHTML;
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);

            // Create a range and select the content
            const range = document.createRange();
            range.selectNodeContents(tempDiv);

            // Create a selection
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);

            // Copy the selection (this preserves formatting)
            const successful = document.execCommand('copy');
            selection?.removeAllRanges();

            // Clean up
            document.body.removeChild(tempDiv);

            if (successful) {
                showCopySuccess();
                return;
            }
        } catch (execCommandError) {
            console.log('execCommand failed, falling back to plain text:', execCommandError);
        }

        // Fallback 2: Plain text only
        const resultText = resultContentEl.textContent || '';
        if (!resultText.trim()) {
            alert('No result to copy');
            return;
        }

        await navigator.clipboard.writeText(resultText);
        showCopySuccess();

    } catch (error) {
        console.error('Failed to copy result:', error);
        alert('Failed to copy result');
    }
}

/**
 * Show copy success feedback
 */
function showCopySuccess() {
    const originalIcon = copyResultBtn.innerHTML;
    copyResultBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
    `;
    copyResultBtn.style.color = '#4CAF50'; // Green color for success

    setTimeout(() => {
        copyResultBtn.innerHTML = originalIcon;
        copyResultBtn.style.color = ''; // Reset to default color
    }, 2000);
}

/**
 * Clear result
 */
function clearResult() {
    resultContentEl.textContent = '';
    document.getElementById('execution-result')!.style.display = 'none';
    document.getElementById('execution-stats')!.style.display = 'none';
}

/**
 * Handle rerun result button click
 */
function handleRerunResult() {
    if (isExecuting) {
        return; // Don't allow rerun if already executing
    }

    // Force fresh execution by calling the execution handler with bypass cache flag
    handleRecipeExecution(true);
}


/**
 * Load recipes from storage
 */
async function loadRecipes() {
    try {
        currentRecipes = await recipeManager.getAllRecipes();
        renderRecipeList();
    } catch (error) {
        console.error('Failed to load recipes:', error);
        currentRecipes = [];
        renderRecipeList();
    }
}

/**
 * Get unique tags from all recipes
 */
function getUniqueTags(): string[] {
    const allTags = currentRecipes.flatMap(recipe => recipe.tags || []);
    return [...new Set(allTags)].sort();
}

/**
 * Render the recipe list
 */
function renderRecipeList() {
    if (!recipeListEl) return;

    if (currentRecipes.length === 0) {
        recipeListEl.innerHTML = `
            <div class="empty-state">
            <img src="images/new-recipe.svg" alt="No recipes found" />
                <h3>No recipes yet</h3>
                <p>Create your first recipe to get started!</p>
                <button id="create-recipe-btn" class="btn btn-primary">Create Recipe</button>
            </div>
        `;

        // Re-attach event listener for the new button
        const newCreateBtn = document.getElementById('create-recipe-btn') as HTMLButtonElement;
        newCreateBtn?.addEventListener('click', showRecipeForm);
        return;
    }

    // Sort recipes: pinned first, then by name
    const sortedRecipes = [...currentRecipes].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return a.name.localeCompare(b.name);
    });

    const recipesHtml = sortedRecipes.map(recipe => `
        <div class="recipe-item ${recipe.pinned ? 'pinned' : ''}" data-recipe-id="${recipe.id}">
            <div class="recipe-header">
                <div class="recipe-title-section">
                    ${recipe.pinned ? '<span class="pin-indicator" title="Pinned Recipe">📌</span>' : ''}
                    <h3 class="recipe-name">${escapeHtml(recipe.name)}</h3>
                </div>
                <div class="recipe-actions">
                    <button class="btn-icon" data-action="toggle-pin" title="${recipe.pinned ? 'Unpin Recipe' : 'Pin Recipe'}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    </button>
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
            ${recipe.tags && recipe.tags.length > 0 ? `
                <div class="recipe-tags">
                    ${recipe.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            <div class="recipe-meta">
                ${recipe.lastUsedAt ? `<span class="recipe-last-used">Last used: ${formatDate(recipe.lastUsedAt)}</span>` : ''}
                <span class="recipe-created">Created: ${formatDate(recipe.createdAt)}</span>
            </div>
        </div>
    `).join('');

    recipeListEl.innerHTML = `
                <div class="search-container">
                <div class="search-input-wrapper">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <path d="m21 21-4.35-4.35"></path>
                    </svg>
                    <input type="text" id="search-recipes" placeholder="Search recipes..." class="search-input">
                </div>
                <div class="filter-container">
                    <select id="tag-filter" class="filter-select">
                        <option value="">All Tags</option>
                        ${getUniqueTags().map(tag => `<option value="${escapeHtml(tag)}">${escapeHtml(tag)}</option>`).join('')}
                    </select>
                </div>
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
                <button id="create-recipe-btn" class="btn btn-primary"> <svg class="w-[9px] h-[9px] text-gray-800" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7.757v8.486M7.757 12h8.486M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
</svg>&nbsp;
New Recipe</button>
            </div>
        </div>
        <div class="recipe-list-content">
            ${recipesHtml}
        </div>
    `;

    // Re-attach event listeners for search and sort
    const newSearchInput = document.getElementById('search-recipes') as HTMLInputElement;
    const newSortSelect = document.getElementById('sort-recipes') as HTMLSelectElement;
    const newCreateBtn = document.getElementById('create-recipe-btn') as HTMLButtonElement;
    const tagFilter = document.getElementById('tag-filter') as HTMLSelectElement;
    const pinnedOnlyFilter = document.getElementById('pinned-only-filter') as HTMLInputElement;

    if (newSearchInput) {
        searchInput = newSearchInput;
        newSearchInput.addEventListener('input', debounce(handleSearch, 300));
    }

    if (newSortSelect) {
        sortSelect = newSortSelect;
        newSortSelect.addEventListener('change', handleSortChange);
    }

    if (tagFilter) {
        tagFilter.addEventListener('change', applyFilters);
    }

    if (pinnedOnlyFilter) {
        pinnedOnlyFilter.addEventListener('change', applyFilters);
    }

    if (newCreateBtn) {
        newCreateBtn.addEventListener('click', showRecipeForm);
    }
}

/**
 * Handle recipe list click events (event delegation)
 */
function handleRecipeListClick(event: Event) {
    const target = event.target as HTMLElement;
    const recipeItem = target.closest('.recipe-item') as HTMLElement;

    if (!recipeItem) return;

    const recipeId = recipeItem.dataset['recipeId'];
    if (!recipeId) return;

    // Find the button element that was clicked (in case user clicked on SVG inside button)
    const button = target.closest('button[data-action]') as HTMLElement;
    const action = button?.dataset['action'];

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
        case 'toggle-pin':
            toggleRecipePin(recipeId);
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
    applyFilters();
}

/**
 * Apply all active filters
 */
function applyFilters() {
    if (!searchInput) return;

    const searchTerm = searchInput.value.toLowerCase().trim();
    const tagFilter = (document.getElementById('tag-filter') as HTMLSelectElement)?.value || '';
    const pinnedOnly = (document.getElementById('pinned-only-filter') as HTMLInputElement)?.checked || false;

    let filteredRecipes = [...currentRecipes];

    // Apply search term filter
    if (searchTerm) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.description.toLowerCase().includes(searchTerm) ||
            recipe.prompt.toLowerCase().includes(searchTerm) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
    }

    // Apply tag filter
    if (tagFilter) {
        filteredRecipes = filteredRecipes.filter(recipe =>
            recipe.tags && recipe.tags.includes(tagFilter)
        );
    }

    // Apply pinned filter
    if (pinnedOnly) {
        filteredRecipes = filteredRecipes.filter(recipe => recipe.pinned);
    }

    renderFilteredRecipeList(filteredRecipes);
}

/**
 * Handle sort change
 */
function handleSortChange() {
    if (!sortSelect) return;

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
function renderFilteredRecipeList(recipes: Recipe[]) {
    if (!recipeListEl) return;

    const recipeListContent = recipeListEl.querySelector('.recipe-list-content');
    if (!recipeListContent) return;

    if (recipes.length === 0) {
        recipeListContent.innerHTML = `
            <div class="empty-state">
            <img src="images/empty-search.svg" alt="No recipes found" />
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
async function executeRecipe(recipeId: string) {
    try {
        const recipe = await recipeManager.getRecipe(recipeId);
        if (!recipe) {
            alert('Recipe not found');
            return;
        }

        currentRecipe = recipe;
        showRecipeExecution();
    } catch (error) {
        console.error('Failed to load recipe:', error);
        alert('Failed to load recipe');
    }
}

/**
 * Edit a recipe
 */
async function editRecipe(recipeId: string) {
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
        const submitBtn = recipeForm.querySelector('button[type="submit"]') as HTMLButtonElement;
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

    } catch (error) {
        console.error('Failed to load recipe for editing:', error);
        alert('Failed to load recipe for editing');
    }
}

/**
 * Toggle recipe pin status
 */
async function toggleRecipePin(recipeId: string) {
    try {
        const updatedRecipe = await recipeManager.toggleRecipePin(recipeId);
        console.log('Recipe pin toggled:', updatedRecipe.id, 'pinned:', updatedRecipe.pinned);

        // Reload recipes to reflect the change
        await loadRecipes();
        renderRecipeList();
    } catch (error) {
        console.error('Failed to toggle recipe pin:', error);
        alert('Failed to toggle recipe pin');
    }
}

/**
 * Delete a recipe
 */
async function deleteRecipe(recipeId: string) {
    if (!confirm('Are you sure you want to delete this recipe?')) {
        return;
    }

    try {
        await recipeManager.deleteRecipe(recipeId);
        await loadRecipes(); // Reload the list
    } catch (error) {
        console.error('Failed to delete recipe:', error);
        alert('Failed to delete recipe');
    }
}

/**
 * Show recipe execution view
 */
function showRecipeExecution() {
    if (!currentRecipe) return;

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

    // Image input is always visible now

    // Clear previous input
    if (userInputEl) {
        userInputEl.value = '';
    }

    // Hide previous result
    const executionResult = document.getElementById('execution-result');
    if (executionResult) {
        executionResult.style.display = 'none';
    }

    // Initialize response history UI
    updateResponseHistoryUI();
}

/**
 * Utility function to escape HTML
 */
function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Utility function to format dates
 */
function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}

/**
 * Debounce utility function
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Populate form with recipe data for editing
 */
function populateFormWithRecipe(recipe: Recipe) {
    const nameInput = document.getElementById('recipe-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('recipe-description') as HTMLTextAreaElement;
    const promptInput = document.getElementById('recipe-prompt') as HTMLTextAreaElement;
    const tagsInput = document.getElementById('recipe-tags') as HTMLInputElement;
    const pinnedInput = document.getElementById('recipe-pinned') as HTMLInputElement;

    if (nameInput) nameInput.value = recipe.name;
    if (descriptionInput) descriptionInput.value = recipe.description;
    if (promptInput) promptInput.value = recipe.prompt;
    if (tagsInput) tagsInput.value = recipe.tags ? recipe.tags.join(', ') : '';
    if (pinnedInput) pinnedInput.checked = recipe.pinned || false;
}

/**
 * Set up real-time form validation
 */
function setupFormValidation() {
    const nameInput = document.getElementById('recipe-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('recipe-description') as HTMLTextAreaElement;
    const promptInput = document.getElementById('recipe-prompt') as HTMLTextAreaElement;

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

}

/**
 * Validate a single form field
 */
function validateField(fieldName: string, value: string): boolean {
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
        case 'name':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Name is required';
            } else if (value.trim().length < 1) {
                isValid = false;
                errorMessage = 'Name must be at least 1 character long';
            } else if (value.trim().length > 100) {
                isValid = false;
                errorMessage = 'Name must be no more than 100 characters long';
            }
            break;

        case 'description':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Description is required';
            } else if (value.trim().length > 500) {
                isValid = false;
                errorMessage = 'Description must be no more than 500 characters long';
            }
            break;

        case 'prompt':
            if (!value || value.trim().length === 0) {
                isValid = false;
                errorMessage = 'Prompt is required';
            } else if (value.trim().length < 1) {
                isValid = false;
                errorMessage = 'Prompt must be at least 1 character long';
            } else if (value.trim().length > 10000) {
                isValid = false;
                errorMessage = 'Prompt must be no more than 10,000 characters long';
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
function showFieldValidationError(fieldName: string, isValid: boolean, errorMessage: string) {
    const field = document.getElementById(`recipe-${fieldName}`) as HTMLElement;
    if (!field) return;

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
    const fields = ['name', 'description', 'prompt'];

    fields.forEach(fieldName => {
        const field = document.getElementById(`recipe-${fieldName}`) as HTMLElement;
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
function validateForm(): boolean {
    const nameInput = document.getElementById('recipe-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('recipe-description') as HTMLTextAreaElement;
    const promptInput = document.getElementById('recipe-prompt') as HTMLTextAreaElement;

    const nameValid = validateField('name', nameInput?.value || '');
    const descriptionValid = validateField('description', descriptionInput?.value || '');
    const promptValid = validateField('prompt', promptInput?.value || '');

    return nameValid && descriptionValid && promptValid;
}

/**
 * Update submit button state based on validation
 */
function updateSubmitButtonState() {
    const submitBtn = recipeForm.querySelector('button[type="submit"]') as HTMLButtonElement;
    if (!submitBtn) return;

    // Get current form values
    const nameInput = document.getElementById('recipe-name') as HTMLInputElement;
    const descriptionInput = document.getElementById('recipe-description') as HTMLTextAreaElement;
    const promptInput = document.getElementById('recipe-prompt') as HTMLTextAreaElement;

    // Check if all required fields have values
    const hasName = nameInput?.value.trim().length > 0;
    const hasDescription = descriptionInput?.value.trim().length > 0;
    const hasPrompt = promptInput?.value.trim().length > 0;

    // Check if any field has validation errors (only if validation state exists)
    const hasValidationErrors = Object.keys(formValidationState).length > 0 &&
        Object.values(formValidationState).some(valid => valid === false);

    // Enable button if all fields have values and no validation errors
    submitBtn.disabled = !(hasName && hasDescription && hasPrompt) || hasValidationErrors;
}

/**
 * Handle prompt enhancement request
 */
async function handleEnhancePrompt() {
    if (!promptEnhancer) {
        alert('Prompt enhancer not available');
        return;
    }

    const promptInput = document.getElementById('recipe-prompt') as HTMLTextAreaElement;
    if (!promptInput) return;

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
        } else {
            console.log('Enhancement failed, showing error');
            showEnhancementError(result.error || 'Enhancement failed');
        }

    } catch (error) {
        console.error('Prompt enhancement failed:', error);
        showEnhancementError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
        isEnhancing = false;
    }
}

/**
 * Show enhancement loading state
 */
function showEnhancementLoading() {
    console.log('Showing enhancement loading state');

    const enhancementUI = document.getElementById('enhancement-ui') as HTMLElement;
    const enhancementContent = enhancementUI?.querySelector('.enhancement-content') as HTMLElement;

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
function showEnhancementResult(result: any) {
    console.log('Showing enhancement result:', result);

    const enhancementUI = document.getElementById('enhancement-ui') as HTMLElement;
    const originalDisplay = document.getElementById('original-prompt-display') as HTMLElement;
    const enhancedDisplay = document.getElementById('enhanced-prompt-display') as HTMLElement;
    const improvementsList = document.getElementById('enhancement-improvements') as HTMLElement;

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
    const originalDisplayRetry = document.getElementById('original-prompt-display') as HTMLElement;
    const enhancedDisplayRetry = document.getElementById('enhanced-prompt-display') as HTMLElement;
    const improvementsListRetry = document.getElementById('enhancement-improvements') as HTMLElement;

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
                ${result.improvements.map((improvement: string) => `<li>${escapeHtml(improvement)}</li>`).join('')}
            </ul>
        `;
    } else {
        improvementsListRetry.innerHTML = '';
    }

    console.log('Enhancement result displayed successfully');
}

/**
 * Show enhancement error
 */
function showEnhancementError(errorMessage: string) {
    const enhancementUI = document.getElementById('enhancement-ui') as HTMLElement;
    const enhancementContent = enhancementUI?.querySelector('.enhancement-content') as HTMLElement;

    if (!enhancementUI || !enhancementContent) return;

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
    const closeBtn = document.getElementById('close-enhancement') as HTMLButtonElement;
    closeBtn?.addEventListener('click', hideEnhancementUI);
}

/**
 * Accept enhancement and update the prompt field
 */
function acceptEnhancement() {
    if (!currentEnhancement || !currentEnhancement.enhancedPrompt) return;

    const promptInput = document.getElementById('recipe-prompt') as HTMLTextAreaElement;
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
    const enhancementUI = document.getElementById('enhancement-ui') as HTMLElement;
    if (enhancementUI) {
        enhancementUI.style.display = 'none';
    }
    currentEnhancement = null;
}

/**
 * Add response to history
 */
function addToResponseHistory(recipeId: string, userInput: string, response: string, executionTime: number) {
    const historyItem: ResponseHistoryItem = {
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipeId,
        userInput,
        response,
        timestamp: Date.now(),
        executionTime
    };

    if (!responseHistory.has(recipeId)) {
        responseHistory.set(recipeId, []);
    }

    const recipeHistory = responseHistory.get(recipeId)!;
    recipeHistory.unshift(historyItem); // Add to beginning

    // Keep only last 10 responses per recipe
    if (recipeHistory.length > 10) {
        recipeHistory.splice(10);
    }

    // Cache the response for quick access
    const cacheKey = `${recipeId}_${userInput}`;
    responseCache.set(cacheKey, response);

    // Limit cache size to prevent memory issues
    if (responseCache.size > 50) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) {
            responseCache.delete(firstKey);
        }
    }

    // Update history UI if we're in execution view
    updateResponseHistoryUI();
}

/**
 * Update response history UI
 */
function updateResponseHistoryUI() {
    if (!currentRecipe) return;

    const historyContainer = document.getElementById('response-history');
    if (!historyContainer) return;

    const recipeHistory = responseHistory.get(currentRecipe.id) || [];

    if (recipeHistory.length === 0) {
        historyContainer.style.display = 'none';
        return;
    }

    historyContainer.style.display = 'block';

    const historyHtml = recipeHistory.map((item, index) => `
        <div class="history-item ${index === currentHistoryIndex ? 'active' : ''}" 
             data-history-id="${item.id}">
            <div class="history-content" onclick="loadHistoryItem('${item.id}')">
                <div class="history-meta">
                    ${formatDate(item.timestamp)} • ${Math.round(item.executionTime)}ms
                </div>
                <div class="history-preview">
                    ${escapeHtml(item.userInput.substring(0, 100))}${item.userInput.length > 100 ? '...' : ''}
                </div>
            </div>
            <div class="history-actions">
                <button class="btn-icon history-copy-btn" 
                        data-history-id="${item.id}" 
                        title="Copy response"
                        onclick="event.stopPropagation(); copyHistoryResponse('${item.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');

    historyContainer.innerHTML = `
        <h4>Recent Responses</h4>
        ${historyHtml}
    `;
}

/**
 * Load a history item
 */
function loadHistoryItem(historyId: string) {
    if (!currentRecipe) return;

    const recipeHistory = responseHistory.get(currentRecipe.id) || [];
    const historyItem = recipeHistory.find(item => item.id === historyId);

    if (!historyItem) return;

    // Update current history index
    currentHistoryIndex = recipeHistory.indexOf(historyItem);

    // Load the response
    resultContentEl.innerHTML = formatResponse(historyItem.response);
    document.getElementById('execution-result')!.style.display = 'block';

    // Update history UI
    updateResponseHistoryUI();
}

/**
 * Copy response from history item
 */
async function copyHistoryResponse(historyId: string) {
    if (!currentRecipe) return;

    const recipeHistory = responseHistory.get(currentRecipe.id) || [];
    const historyItem = recipeHistory.find(item => item.id === historyId);

    if (!historyItem) {
        alert('Response not found');
        return;
    }

    try {
        await navigator.clipboard.writeText(historyItem.response);

        // Show feedback on the copy button
        const copyBtn = document.querySelector(`[data-history-id="${historyId}"].history-copy-btn`) as HTMLButtonElement;
        if (copyBtn) {
            const originalTitle = copyBtn.title;
            copyBtn.title = 'Copied!';
            copyBtn.style.color = '#4CAF50';

            setTimeout(() => {
                copyBtn.title = originalTitle;
                copyBtn.style.color = '';
            }, 2000);
        }
    } catch (error) {
        console.error('Failed to copy response:', error);
        alert('Failed to copy response');
    }
}

/**
 * Clear response history for current recipe
 */
function clearResponseHistory() {
    if (!currentRecipe) return;

    responseHistory.delete(currentRecipe.id);
    currentHistoryIndex = -1;
    updateResponseHistoryUI();
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event: KeyboardEvent) {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    switch (event.key.toLowerCase()) {
        case 'k':
            if (ctrlKey) {
                event.preventDefault();
                focusSearchInput();
            }
            break;
        case 'escape':
            event.preventDefault();
            handleEscapeKey();
            break;
        case 'enter':
            if (ctrlKey) {
                event.preventDefault();
                handleCtrlEnter();
            }
            break;
        case '?':
            if (ctrlKey) {
                event.preventDefault();
                showShortcutsHelp();
            }
            break;
    }
}

/**
 * Focus search input (Ctrl/Cmd + K)
 */
function focusSearchInput() {
    if (searchInput) {
        searchInput.focus();
        searchInput.select();
    }
}

/**
 * Handle Escape key
 */
function handleEscapeKey() {
    // Close any open dialogs or modals
    const enhancementUI = document.getElementById('enhancement-ui') as HTMLElement;
    if (enhancementUI && enhancementUI.style.display !== 'none') {
        hideEnhancementUI();
        return;
    }

    const shortcutsHelp = document.getElementById('shortcuts-help') as HTMLElement;
    if (shortcutsHelp && shortcutsHelp.classList.contains('show')) {
        hideShortcutsHelp();
        return;
    }

    // If guide modal is open, close it
    const guideModal = document.getElementById('guide-modal') as HTMLElement;
    if (guideModal && guideModal.style.display !== 'none') {
        hideGuideModal();
        return;
    }

    // If in execution view, go back to list
    if (recipeExecutionEl.style.display !== 'none') {
        showRecipeList();
        return;
    }

    // If in form view, go back to list
    if (recipeFormEl.style.display !== 'none') {
        showRecipeList();
        return;
    }
}

/**
 * Handle Ctrl/Cmd + Enter
 */
function handleCtrlEnter() {
    // If in execution view, execute recipe
    if (recipeExecutionEl.style.display !== 'none' && !isExecuting) {
        handleRecipeExecution();
        return;
    }

    // If in form view, submit form
    if (recipeFormEl.style.display !== 'none') {
        const submitBtn = recipeForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        if (submitBtn && !submitBtn.disabled) {
            recipeForm.dispatchEvent(new Event('submit'));
        }
        return;
    }
}

/**
 * Show keyboard shortcuts help
 */
function showShortcutsHelp() {
    const shortcutsHelp = document.getElementById('shortcuts-help') as HTMLElement;
    if (!shortcutsHelp) {
        createShortcutsHelp();
    } else {
        shortcutsHelp.classList.add('show');
    }
}

/**
 * Hide keyboard shortcuts help
 */
function hideShortcutsHelp() {
    const shortcutsHelp = document.getElementById('shortcuts-help') as HTMLElement;
    if (shortcutsHelp) {
        shortcutsHelp.classList.remove('show');
    }
}

/**
 * Create keyboard shortcuts help modal
 */
function createShortcutsHelp() {
    const shortcutsHelp = document.createElement('div');
    shortcutsHelp.id = 'shortcuts-help';
    shortcutsHelp.className = 'shortcuts-help';
    shortcutsHelp.innerHTML = `
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcut-item">
            <span class="shortcut-key">${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+K</span>
            <span class="shortcut-description">Focus search</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">Esc</span>
            <span class="shortcut-description">Close dialogs / Go back</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+Enter</span>
            <span class="shortcut-description">Execute recipe / Submit form</span>
        </div>
        <div class="shortcut-item">
            <span class="shortcut-key">${navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+?</span>
            <span class="shortcut-description">Show this help</span>
        </div>
        <div style="margin-top: 16px; text-align: center;">
            <button onclick="hideShortcutsHelp()" class="btn btn-secondary">Close</button>
        </div>
    `;

    document.body.appendChild(shortcutsHelp);
    shortcutsHelp.classList.add('show');

    // Close on outside click
    shortcutsHelp.addEventListener('click', (e) => {
        if (e.target === shortcutsHelp) {
            hideShortcutsHelp();
        }
    });
}

/**
 * Load user guide from storage
 */
async function loadGuide() {
    try {
        if (!storageService) {
            console.warn('Storage service not available');
            return;
        }
        userGuide = await storageService.getGuide();
        console.log('User guide loaded:', userGuide ? 'Set' : 'Not set');
        updateGuideButtonState();
    } catch (error) {
        console.error('Failed to load guide:', error);
        userGuide = '';
    }
}

/**
 * Show guide modal
 */
function showGuideModal() {
    const guideModal = document.getElementById('guide-modal') as HTMLElement;
    const guideContentInput = document.getElementById('guide-content') as HTMLTextAreaElement;

    if (!guideModal || !guideContentInput) return;

    // Populate with current guide content
    guideContentInput.value = userGuide;
    updateGuideCharCount();

    // Show modal
    guideModal.style.display = 'flex';

    // Focus on the textarea
    setTimeout(() => {
        guideContentInput.focus();
    }, 100);

    // Add click outside to close
    const handleClickOutside = (event: MouseEvent) => {
        if (event.target === guideModal) {
            hideGuideModal();
            guideModal.removeEventListener('click', handleClickOutside);
        }
    };
    guideModal.addEventListener('click', handleClickOutside);
}

/**
 * Hide guide modal
 */
function hideGuideModal() {
    const guideModal = document.getElementById('guide-modal') as HTMLElement;
    if (guideModal) {
        guideModal.style.display = 'none';
    }
}

/**
 * Handle save guide
 */
async function handleSaveGuide() {
    const guideContentInput = document.getElementById('guide-content') as HTMLTextAreaElement;
    if (!guideContentInput || !storageService) return;

    const guideContent = guideContentInput.value.trim();

    try {
        await storageService.saveGuide(guideContent);
        userGuide = guideContent;
        updateGuideButtonState();
        hideGuideModal();

        // Show success feedback
        const saveBtn = document.getElementById('save-guide-btn') as HTMLButtonElement;
        const originalText = saveBtn.textContent;
        saveBtn.textContent = '✓ Saved!';
        saveBtn.style.backgroundColor = '#4CAF50';

        setTimeout(() => {
            saveBtn.textContent = originalText;
            saveBtn.style.backgroundColor = '';
        }, 2000);

        console.log('Guide saved successfully');
    } catch (error) {
        console.error('Failed to save guide:', error);
        alert('Failed to save guide. Please try again.');
    }
}

/**
 * Handle clear guide
 */
async function handleClearGuide() {
    if (!confirm('Are you sure you want to clear your guide? This will remove the persistent context from all recipe executions.')) {
        return;
    }

    try {
        if (!storageService) return;

        await storageService.clearGuide();
        userGuide = '';
        updateGuideButtonState();

        // Clear the textarea
        const guideContentInput = document.getElementById('guide-content') as HTMLTextAreaElement;
        if (guideContentInput) {
            guideContentInput.value = '';
            updateGuideCharCount();
        }

        console.log('Guide cleared successfully');
    } catch (error) {
        console.error('Failed to clear guide:', error);
        alert('Failed to clear guide. Please try again.');
    }
}

/**
 * Update guide character count display
 */
function updateGuideCharCount() {
    const guideContentInput = document.getElementById('guide-content') as HTMLTextAreaElement;
    const charCountEl = document.getElementById('guide-char-current') as HTMLElement;

    if (!guideContentInput || !charCountEl) return;

    const currentLength = guideContentInput.value.length;
    charCountEl.textContent = currentLength.toString();

    // Change color based on length
    const charCountContainer = charCountEl.parentElement;
    if (charCountContainer) {
        if (currentLength > 1000) {
            charCountContainer.style.color = '#f44336'; // Red
        } else if (currentLength > 800) {
            charCountContainer.style.color = '#ff9800'; // Orange
        } else {
            charCountContainer.style.color = '';
        }
    }
}

/**
 * Update guide button state to show if guide is set
 */
function updateGuideButtonState() {
    const toggleGuideBtn = document.getElementById('toggle-guide-btn') as HTMLButtonElement;
    if (!toggleGuideBtn) return;

    if (userGuide && userGuide.trim().length > 0) {
        toggleGuideBtn.classList.add('active');
        toggleGuideBtn.title = 'Guide Active - Click to edit';
    } else {
        toggleGuideBtn.classList.remove('active');
        toggleGuideBtn.title = 'Set Guide';
    }
}

// Make functions globally available for onclick handlers
(window as any).loadHistoryItem = loadHistoryItem;
(window as any).copyHistoryResponse = copyHistoryResponse;
(window as any).hideShortcutsHelp = hideShortcutsHelp;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}
