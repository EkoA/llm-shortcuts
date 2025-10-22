# LLM Shortcuts - Chrome Extension

A Chrome extension that enables users to create reusable LLM prompt templates ("recipes"), eliminating repetitive prompt engineering and context switching across AI chat sessions.

## Phase 1 Implementation

This is the initial implementation focusing on:
- ✅ Chrome extension project setup with manifest v3
- ✅ TypeScript compilation pipeline
- ✅ Basic extension file structure (background, side panel)
- ✅ Chrome Built-in AI Prompt API wrapper
- ✅ Development build script with hot reload

## Prerequisites

- Chrome browser version 127+ (for AI features)
- Node.js 18+ 
- Chrome flags enabled for AI features (during experimental phase):
  - `chrome://flags/#optimization-guide-on-device-model`
  - `chrome://flags/#prompt-api-for-gemini-nano`

## Installation & Development

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Extension

```bash
npm run build
```

### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" and select the `dist/` folder
4. The extension icon will appear in the toolbar

### 4. Development Mode (Hot Reload)

```bash
npm run dev
```

This will:
- Watch for file changes
- Automatically rebuild the extension
- Copy files to the `dist/` folder
- You can reload the extension in Chrome to see changes

## Project Structure

```
llm-shortcuts/
├── src/
│   ├── core/
│   │   └── ai-client.ts          # Chrome AI API wrapper
│   ├── background.ts              # Service worker
│   └── sidepanel.ts              # Side panel controller
├── sidepanel.html                 # Side panel HTML
├── sidepanel.css                  # Side panel styles
├── manifest.json                  # Extension manifest
├── package.json                   # Dependencies and scripts
├── tsconfig.json                  # TypeScript configuration
├── build.js                       # Build script
├── dev.js                         # Development watcher
└── dist/                          # Built extension (generated)
```

## Current Features (Phase 1)

- **AI API Integration**: Chrome Built-in AI Prompt API wrapper with error handling
- **Side Panel Interface**: Basic UI for recipe management
- **Development Tools**: Hot reload and build automation
- **TypeScript Support**: Full type safety and modern JavaScript features

## Testing the Extension

1. **Check AI Availability**: The side panel will show if Chrome AI API is available
2. **Create Recipe**: Click "Create Recipe" to test the form (storage not implemented yet)
3. **Execute Recipe**: Test basic AI prompt execution

## Known Limitations (Phase 1)

- Recipe storage not implemented (will be added in Phase 2)
- No recipe list display (will be added in Phase 2)
- Basic error handling only
- No data persistence

## Next Steps

Phase 2 will add:
- Recipe data models and storage
- Chrome Storage API integration
- Recipe CRUD operations
- Recipe list display

## Troubleshooting

### AI API Not Available
- Ensure you're using Chrome 127+
- Check that AI flags are enabled
- Verify the extension has proper permissions

### Build Errors
- Run `npm run clean` to clear the dist folder
- Check TypeScript compilation with `npx tsc`
- Ensure all dependencies are installed

### Extension Not Loading
- Check Chrome developer console for errors
- Verify manifest.json is valid
- Ensure all files are in the dist/ folder

## Development Notes

- The extension uses Chrome's side panel API
- AI functionality requires Chrome 127+ with experimental flags
- All processing happens locally via Chrome's on-device model
- No external API calls or data transmission
