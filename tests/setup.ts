/**
 * Jest test setup
 * Configures the test environment for Chrome extension testing
 */

// Mock Chrome APIs
const mockChrome = {
    storage: {
        local: {
            get: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
            getBytesInUse: jest.fn(),
            QUOTA_BYTES: 5242880, // 5MB
            onChanged: {
                addListener: jest.fn(),
                removeListener: jest.fn(),
                hasListener: jest.fn()
            }
        }
    }
};

// Mock window.ai for AI client tests
const mockAI = {
    languageModel: {
        capabilities: jest.fn(),
        create: jest.fn()
    }
};

// Set up global mocks
Object.defineProperty(global, 'chrome', {
    value: mockChrome,
    writable: true
});

// Only define window if it doesn't exist
if (typeof global.window === 'undefined') {
    Object.defineProperty(global, 'window', {
        value: {
            ai: mockAI
        },
        writable: true
    });
} else {
    // @ts-ignore
    global.window.ai = mockAI;
}

// Mock crypto for UUID generation
let uuidCounter = 0;
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: jest.fn(() => {
            uuidCounter++;
            return `mock-uuid-${uuidCounter}-5678-9012`;
        }),
        getRandomValues: jest.fn((array) => {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
            return array;
        })
    },
    writable: true
});

// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();

    // Reset Chrome storage mocks
    mockChrome.storage.local.get.mockResolvedValue({});
    mockChrome.storage.local.set.mockResolvedValue(undefined);
    mockChrome.storage.local.remove.mockResolvedValue(undefined);
    mockChrome.storage.local.getBytesInUse.mockResolvedValue(0);

    // Reset AI mocks
    mockAI.languageModel.capabilities.mockResolvedValue({
        canUseAI: true,
        model: 'test-model',
        features: ['text', 'streaming']
    });
    mockAI.languageModel.create.mockResolvedValue({
        prompt: jest.fn().mockResolvedValue('Test response'),
        promptStreaming: jest.fn().mockResolvedValue(async function* () {
            yield 'Test';
            yield ' response';
        }()),
        destroy: jest.fn()
    });
});

// Helper function to create mock recipes
export const createMockRecipe = (overrides: Partial<any> = {}) => ({
    id: 'test-recipe-id',
    name: 'Test Recipe',
    description: 'A test recipe',
    prompt: 'Test prompt: {user_input}',
    originalPrompt: 'Test prompt: {user_input}',
    inputType: 'text' as const,
    tags: ['test'],
    pinned: false,
    createdAt: Date.now(),
    lastUsedAt: null,
    ...overrides
});

// Helper function to create mock storage data
export const createMockStorageData = (recipes: any[] = []) => ({
    version: {
        version: '1.0.0',
        lastUpdated: Date.now()
    },
    recipes
});

// Helper function to mock Chrome storage responses
export const mockChromeStorageGet = (data: any) => {
    mockChrome.storage.local.get.mockResolvedValue({
        'llm_shortcuts_data': data
    });
};

// Helper function to capture Chrome storage set calls
export const captureChromeStorageSet = () => {
    const calls: any[] = [];
    mockChrome.storage.local.set.mockImplementation((data) => {
        calls.push(data);
        return Promise.resolve();
    });
    return calls;
};
