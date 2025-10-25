# LLM Shortcuts - Chrome Extension

A Chrome extension that enables users to create reusable LLM prompt templates ("recipes"), eliminating repetitive prompt engineering and context switching across AI chat sessions.

## 🚀 Quick Start Guide

Follow these simple steps to get the LLM Shortcuts extension running on your Chrome browser.

## Prerequisites

Before you begin, make sure you have:

- **Chrome browser version 127+** (required for AI features)
- **Node.js 18+** (download from [nodejs.org](https://nodejs.org/))
- **Git** (to clone the repository)

## Step-by-Step Installation

### Step 1: Clone the Repository

Open your terminal/command prompt and run:

```bash
git clone <repository-url>
cd llm-shortcuts
```

### Step 2: Install Dependencies

Install the required packages:

```bash
npm install
```

*This may take a few minutes to download all dependencies.*

### Step 3: Enable Chrome AI Features

Since this extension uses Chrome's experimental AI features, you need to enable them:

1. **Open Chrome** and go to `chrome://flags`
2. **Search for and enable** these two flags:
   - `#optimization-guide-on-device-model` → Set to **Enabled**
   - `#prompt-api-for-gemini-nano` → Set to **Enabled**
3. **Restart Chrome** after enabling the flags

> **Note**: These flags are required for the AI functionality to work. Without them, the extension will show an error message.

### Step 3.5: Configure Trial Token (Required)

The extension requires a trial token to access Chrome's AI features. You need to:

1. **Get a trial token** from Google's Chrome Extension Developer Program
   - Visit the [Chrome Extension Developer Program](https://developer.chrome.com/docs/extensions/ai-features/)
   - Apply for access to AI features
   - Once approved, you'll receive a trial token

2. **Update the manifest.json** file:
   - Open `src/manifest.json` in your project
   - Replace the existing token in the `trial_tokens` array with your own token:
   ```json
   "trial_tokens": [
     "YOUR_TRIAL_TOKEN_HERE"
   ]
   ```

3. **Rebuild the extension** after updating the token:
   ```bash
   npm run build
   ```

> **Important**: Without a valid trial token, the AI features will not work. The token in the current manifest is a placeholder and will not function.

### Step 4: Build the Extension

Compile the TypeScript code and prepare the extension files:

```bash
npm run build
```

*You should see a success message and a `dist/` folder will be created.*

### Step 5: Load the Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions`
2. **Enable Developer mode** by toggling the switch in the top-right corner
   - ![Enable Developer Mode](screenshots/developer-mode.png) <!-- TODO: Add screenshot -->
3. **Click "Load unpacked"** button
4. **Select the `dist/` folder** from your project directory
   - ![Select dist folder](screenshots/select-dist-folder.png) <!-- TODO: Add screenshot -->
5. **The extension should now appear** in your extensions list
   - ![Extension loaded](screenshots/extension-loaded.png) <!-- TODO: Add screenshot -->

### Step 6: Access the Extension

1. **Look for the LLM Shortcuts icon** in your Chrome toolbar
2. **Click the icon** to open the side panel
3. **The extension interface should appear** on the right side of your browser
   - ![Extension side panel](screenshots/side-panel.png) <!-- TODO: Add screenshot -->

## ✅ Verification

To make sure everything is working:

1. **Check AI Status**: The side panel should show "AI API Available" (not an error message)
2. **Test Basic Functionality**: Try creating a simple recipe to verify the extension works

## 🔧 Development Mode (Optional)

If you plan to modify the code, use development mode for automatic rebuilding:

```bash
npm run dev
```

This will:
- Watch for file changes
- Automatically rebuild the extension
- Copy files to the `dist/` folder
- You can reload the extension in Chrome to see changes

## 🎯 Features Overview

LLM Shortcuts provides a powerful set of features to streamline your AI workflow. Here's what you can do:

### 📝 Recipe Creation

**What are Recipes?**
Recipes are reusable AI prompt templates that you create once and use repeatedly. Instead of typing the same prompts over and over, you create a "recipe" with placeholders for dynamic content.

**How to Create a Recipe:**
1. **Click "Create Recipe"** in the side panel
2. **Fill in the details:**
   - **Name**: A descriptive title (e.g., "Email Refiner", "Code Reviewer")
   - **Description**: What this recipe does
   - **Prompt**: Your AI instruction with placeholders like `{user_input}`
   - **Input Type**: Choose Text, Image, or Both
3. **Enhance Your Prompt**: Click "Enhance Prompt" to automatically improve your prompt using AI
4. **Save**: Your recipe is stored and ready to use

**Example Recipe:**
```
Name: Email Refiner
Description: Converts draft emails into professional, concise communication
Prompt: "Rewrite the following email to be more professional and concise while maintaining the core message: {user_input}"
Input Type: Text
```

### ⚡ Recipe Execution

**How to Use Recipes:**
1. **Select a Recipe**: Choose from your saved recipes in the main list
2. **Provide Input**: Enter your content (text, image, or both) based on the recipe type
3. **Execute**: Click "Send" to run the recipe
4. **Get Results**: View the AI-generated response with copy-to-clipboard functionality


### 📘 Guides Feature

**What are Guides?**
Guides are persistent context that gets automatically added to every recipe execution. Think of it as your personal AI assistant preferences that apply to all your recipes.

**How to Set a Guide:**
1. **Click "Set Guide"** in the side panel header
2. **Enter your context** (up to 1000 characters):
   - Your role or profession
   - Preferred response style
   - Domain-specific knowledge
   - Tone preferences
3. **Save**: The guide is now active for all future recipe executions

**Example Guides:**
```
I'm a software developer working with TypeScript and React. 
When explaining code, use technical terms and provide practical examples.
```


### 🔍 Recipe Management

**Recipe List Features:**
- **Search**: Find recipes quickly by name
- **Sort**: Organize by creation date or last used
- **Edit**: Modify existing recipes
- **Delete**: Remove recipes you no longer need
- **Usage Tracking**: See when recipes were last used

**Recipe Types:**
- **Text Recipes**: For text-based AI tasks (emails, summaries, translations)
- **Image Recipes**: For image analysis and description
- **Multimodal Recipes**: For tasks requiring both text and images


## 💡 Example Use Cases

### Email & Communication
- **Email Refinement**: "Make this email more professional and concise: {user_input}"
- **Tone Adjustment**: "Rewrite this message to be more friendly: {user_input}"
- **Meeting Summaries**: "Summarize this meeting transcript: {user_input}"

### Development & Code
- **Code Review**: "Review this code for bugs and best practices: {user_input}"
- **Documentation**: "Generate documentation for this function: {user_input}"
- **Debugging**: "Help me debug this error: {user_input}"

### Content Creation
- **Blog Posts**: "Write a blog post about: {user_input}"
- **Social Media**: "Create a Twitter thread about: {user_input}"
- **Product Descriptions**: "Write a product description for: {user_input}"

### Learning & Research
- **Explanations**: "Explain this concept in simple terms: {user_input}"
- **Study Notes**: "Create study notes from this text: {user_input}"
- **Question Generation**: "Generate practice questions about: {user_input}"

```

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


## 🧪 Testing the Extension

Once installed, test these features:

1. **Check AI Availability**: The side panel should show "AI API Available" (not an error)
2. **Set a Guide**: Click "Set Guide" to add persistent context
3. **Create Recipe**: Click "Create Recipe" to test the form with prompt enhancement
4. **Execute Recipe**: Test recipe execution with streaming responses
5. **Recipe Management**: Search, edit, and delete recipes

## ✅ Current Implementation Status

**Fully Implemented:**
- ✅ Recipe creation with AI-powered prompt enhancement
- ✅ Recipe execution with streaming responses
- ✅ Recipe storage and management (CRUD operations)
- ✅ Guides feature for persistent context
- ✅ Search and filtering of recipes
- ✅ Input validation and error handling
- ✅ Copy-to-clipboard functionality
- ✅ Usage tracking and statistics

**Ready for Use:**
- All core features are implemented and tested
- Extension is fully functional for daily use
- No major limitations or missing features

## 🛠️ Troubleshooting

### ❌ AI API Not Available

**Symptoms**: Extension shows "AI API not available" error

**Solutions**:
1. **Check Chrome Version**: Ensure you're using Chrome 127 or later
   - Go to `chrome://version` to check your version
2. **Verify AI Flags**: Make sure both flags are enabled:
   - `chrome://flags/#optimization-guide-on-device-model` → **Enabled**
   - `chrome://flags/#prompt-api-for-gemini-nano` → **Enabled**
3. **Check Trial Token**: Ensure you have a valid trial token in `src/manifest.json`
   - The token must be obtained from Google's Chrome Extension Developer Program
   - Replace the placeholder token with your own valid token
   - Rebuild the extension after updating the token: `npm run build`
4. **Restart Chrome**: After enabling flags, completely close and reopen Chrome
5. **Check Permissions**: Ensure the extension has proper permissions in `chrome://extensions`

### ❌ Build Errors

**Symptoms**: `npm run build` fails or shows errors

**Solutions**:
1. **Clear Build Cache**: Run `npm run clean` to clear the dist folder
2. **Check TypeScript**: Run `npx tsc` to see specific compilation errors
3. **Reinstall Dependencies**: Delete `node_modules` and run `npm install` again
4. **Check Node Version**: Ensure you're using Node.js 18+

### ❌ Extension Not Loading

**Symptoms**: Extension doesn't appear in Chrome or shows errors

**Solutions**:
1. **Check Console**: Open Chrome DevTools (F12) and check for error messages
2. **Verify Files**: Ensure all files are in the `dist/` folder after building
3. **Check Manifest**: Verify `dist/manifest.json` is valid JSON
4. **Reload Extension**: In `chrome://extensions`, click the reload button for your extension

### ❌ Extension Icon Not Appearing

**Symptoms**: No LLM Shortcuts icon in Chrome toolbar

**Solutions**:
1. **Check Extensions Page**: Go to `chrome://extensions` and ensure the extension is enabled
2. **Pin the Extension**: Click the puzzle piece icon in Chrome toolbar and pin LLM Shortcuts
3. **Check Side Panel**: The extension uses a side panel - look for it in the right side of your browser

### ❌ Side Panel Not Opening

**Symptoms**: Clicking the extension icon doesn't open the side panel

**Solutions**:
1. **Check Chrome Version**: Side panel API requires Chrome 114+
2. **Try Right-Click**: Right-click the extension icon and select "Open side panel"
3. **Check Permissions**: Ensure the extension has side panel permissions

## 📋 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "AI API not available" | Enable Chrome AI flags, get valid trial token, and restart browser |
| Extension won't load | Check that `dist/` folder exists and contains all files |
| Build fails | Run `npm install` and check Node.js version |
| Side panel not opening | Update Chrome to version 114+ |
| No AI responses | Verify AI flags are enabled, trial token is valid, and Chrome is restarted |
| Trial token invalid | Apply for Chrome Extension Developer Program access and update manifest.json |

## 🔧 Development Notes

- The extension uses Chrome's side panel API
- AI functionality requires Chrome 127+ with experimental flags
- All processing happens locally via Chrome's on-device model
- No external API calls or data transmission
- For development, use `npm run dev` for automatic rebuilding

## 📸 Screenshots Needed

To make this README even more helpful, we need to add screenshots for these steps:

1. **Enable Developer Mode**: Screenshot of `chrome://extensions` page with Developer mode toggle
2. **Select dist folder**: Screenshot of file picker selecting the `dist/` folder
3. **Extension loaded**: Screenshot of extensions page showing LLM Shortcuts extension
4. **Extension side panel**: Screenshot of the side panel interface

*To add these screenshots:*
1. Take screenshots during the installation process
2. Save them in a `screenshots/` folder in the project root
3. Update the image paths in this README

## 📞 Getting Help

If you're still having issues:

1. **Check the Console**: Open Chrome DevTools (F12) and look for error messages
2. **Verify Prerequisites**: Ensure you have Chrome 127+, Node.js 18+, and AI flags enabled
3. **Try Clean Install**: Delete `node_modules` and `dist/` folders, then run `npm install` and `npm run build`
4. **Check GitHub Issues**: Look for similar issues in the project's issue tracker

## 🎉 Success!

If you've followed all the steps and the extension is working:

- ✅ You should see the LLM Shortcuts icon in your Chrome toolbar
- ✅ Clicking it opens a side panel on the right side of your browser
- ✅ The side panel shows "AI API Available" (not an error message)
- ✅ You can create and test basic recipes

**Congratulations!** You now have the LLM Shortcuts extension running on your Chrome browser.

## 🔄 Updating the Extension

When you pull updates from the repository:

1. **Pull the latest changes**: `git pull origin main`
2. **Rebuild the extension**: `npm run build`
3. **Reload in Chrome**: Go to `chrome://extensions` and click the reload button for your extension

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
