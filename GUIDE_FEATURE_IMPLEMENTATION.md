# Guide Feature Implementation

## Overview
The Guide feature has been successfully implemented in LLM Shortcuts. This feature allows users to set persistent context that will be automatically included with all recipe executions.

## What is the Guide?
The Guide is a global, persistent text context that gets prepended to every recipe prompt execution. It allows users to:
- Set preferences that apply to all AI responses
- Provide background information about themselves
- Define consistent tone or style instructions
- Set domain-specific context

## Implementation Details

### 1. Data Model Updates
**File: `src/models/recipe.model.ts`**
- Added `UserGuide` interface:
  ```typescript
  export interface UserGuide {
      content: string;
      updatedAt: number;
  }
  ```
- Updated `StorageSchema` to include optional `guide` field

### 2. Storage Service Updates
**File: `src/core/storage.ts`**
- Added `getGuide()`: Retrieves user guide from storage
- Added `saveGuide(guideContent: string)`: Saves guide to storage
- Added `clearGuide()`: Removes guide from storage

### 3. Prompt Interpolation Updates
**File: `src/utils/prompt-interpolation.ts`**
- Updated `interpolatePrompt()` to accept optional `guide` parameter
- Guide is prepended to the final prompt: `[Guide] + \n\n + [Recipe prompt + User input]`
- Guide is only included if it exists and is not empty

### 4. User Interface
**File: `sidepanel.html`**
- Added "Set Guide" button in the header
- Created Guide modal with:
  - Guide content textarea (max 1000 characters)
  - Character counter with color-coded warnings
  - Example placeholders showing usage patterns
  - Save and Clear buttons

**File: `sidepanel.css`**
- Added Guide modal styling with modern UI
- Responsive modal design
- Character count indicators

### 5. Side Panel Controller
**File: `src/sidepanel.ts`**
- Added Guide state management
- Integrated storage service for Guide operations
- Updated recipe execution to include Guide in prompts
- Added Guide modal handlers:
  - `showGuideModal()`: Opens the Guide modal
  - `hideGuideModal()`: Closes the Guide modal
  - `handleSaveGuide()`: Saves Guide and updates state
  - `handleClearGuide()`: Clears Guide with confirmation
  - `updateGuideCharCount()`: Updates character count display
  - `updateGuideButtonState()`: Updates button to show "Guide Active" when set

## Usage Guide Length Recommendations
- **Minimum**: 50 characters (for meaningful context)
- **Recommended**: 200-500 characters (optimal balance)
- **Maximum**: 1000 characters (enforced limit)

## Example Guide Content

### Example 1: Professional Tone
```
You are a helpful assistant that always responds in a professional tone. 
Focus on clarity and conciseness.
```

### Example 2: Developer Context
```
I'm a software developer working with TypeScript and React. When explaining 
code, use technical terms and provide practical examples.
```

### Example 3: Concise Responses
```
I prefer responses that are concise and to the point. Skip pleasantries and 
get straight to the answer.
```

## Prompt Construction Flow

### Without Guide
```
[Recipe prompt] + [User input data]
```

### With Guide
```
[Guide content]

[Recipe prompt] + [User input data]
```

## User Experience Features

1. **Guide Active Indicator**: Button shows "📘 Guide Active" when a guide is set
2. **Character Counter**: Real-time character count with color warnings
3. **Clear Confirmation**: Prevents accidental Guide deletion
4. **Success Feedback**: Visual confirmation when Guide is saved
5. **Persistent Storage**: Guide persists across browser sessions

## Technical Notes

- Guide content is stored in Chrome Local Storage
- Guide is optional - recipes work normally without it
- Guide is NOT visible during execution (only prepended to the prompt)
- Guide is trimmed before being prepended to ensure clean formatting
- Empty guides are treated as if no guide is set

## Testing

The implementation has been tested and:
- ✅ TypeScript compilation successful
- ✅ All build steps complete without errors
- ✅ Existing prompt interpolation tests pass
- ✅ No breaking changes to existing functionality

## Future Enhancements (Optional)

1. Guide templates or presets
2. Multiple guides with switching capability
3. Guide categories (personal, professional, technical)
4. Import/export guides
5. Guide validation and suggestions
6. Per-recipe guide override

## Files Modified

1. `src/models/recipe.model.ts` - Added UserGuide interface
2. `src/core/storage.ts` - Added Guide storage methods
3. `src/utils/prompt-interpolation.ts` - Added Guide parameter to interpolation
4. `sidepanel.html` - Added Guide modal UI
5. `sidepanel.css` - Added Guide modal styling
6. `src/sidepanel.ts` - Added Guide management logic

## Installation/Update Instructions

1. Build the extension: `npm run build`
2. Reload the extension in Chrome
3. The "Set Guide" button will appear in the header
4. Click to set your Guide and start using it across all recipes

---

**Implementation Date**: October 16, 2025
**Status**: ✅ Complete and Ready for Use

