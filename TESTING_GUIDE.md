# Testing Guide: Phase 4 - Recipe Execution Engine

This guide will help you test the recipe execution functionality in Chrome.

---

## Prerequisites

### 1. Enable Chrome AI Features

Before loading the extension, ensure Chrome's AI features are enabled:

1. Open Chrome and navigate to:
   - `chrome://flags/#optimization-guide-on-device-model`
   - Set to **Enabled**

2. Navigate to:
   - `chrome://flags/#prompt-api-for-gemini-nano`
   - Set to **Enabled**

3. Navigate to:
   - `chrome://flags/#prompt-api-for-gemini-nano-inner-text`
   - Set to **Enabled BypassPerfRequirement** (this bypasses performance checks)

4. **Restart Chrome** for changes to take effect

5. After restart, verify AI is available:
   - Open DevTools Console (F12)
   - Run: `await window.ai.languageModel.availability()`
   - Expected result: `"available"` or `"downloadable"` or `"downloading"`
   - If `"downloadable"`, the model will download on first use

---

## Loading the Extension

### Step 1: Open Extensions Page
1. Navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to your project directory
3. Select the **`dist/`** folder
4. Click **"Select"** or **"Open"**

### Step 3: Verify Installation
- You should see "LLM Shortcuts (Dev)" in your extensions list
- The extension should show as enabled
- Note the extension ID (you'll need this if you see any errors)

### Step 4: Open the Side Panel
1. Click the LLM Shortcuts icon in your Chrome toolbar
   - If you don't see it, click the puzzle piece icon and pin "LLM Shortcuts"
2. The side panel should open on the right side of your browser

---

## Testing Checklist

### ✅ Phase 1: AI Availability Check

**What to Test:**
- [ ] Side panel opens successfully
- [ ] AI status banner appears at the top
- [ ] Status shows "✅ AI is available and working" (green banner)
- [ ] If AI is not available, you'll see error messages with flag instructions

**What to Look For:**
- Check browser console (F12) for any errors
- The AI client should initialize without errors
- Status should be determined within a few seconds

**Troubleshooting:**
- If you see "AI not available", double-check the Chrome flags above
- If you see "downloading", wait a few minutes for the model to download
- Check Chrome version: Must be 127+ (check with `chrome://version`)

---

### ✅ Phase 2: Create a Test Recipe

**What to Test:**
1. [ ] Click "Create Recipe" button
2. [ ] Recipe form appears with all fields
3. [ ] Fill in the form:
   - **Name:** `Test Recipe`
   - **Description:** `A simple test recipe for Phase 4`
   - **Prompt:** `Please summarize the following text in one sentence: {user_input}`
   - **Input Type:** Select `Text`
4. [ ] Click "Save Recipe"
5. [ ] Recipe appears in the main list

**What to Look For:**
- Form validation works (can't submit empty name/prompt)
- Recipe is saved successfully
- You're redirected back to the recipe list
- New recipe appears with correct name and description

**Troubleshooting:**
- If save fails, check browser console for errors
- If recipe doesn't appear, check Chrome Storage: `chrome://extensions/` → LLM Shortcuts → "Inspect views: service worker" → Console → `chrome.storage.local.get(console.log)`

---

### ✅ Phase 3: Test Recipe Execution (Non-Streaming)

**What to Test:**
1. [ ] Click on your test recipe (or click the ▶️ execute button)
2. [ ] Execution view appears showing:
   - Recipe name and description
   - Input textarea
   - "Execute Recipe" button
3. [ ] Enter test input:
   ```
   The quick brown fox jumps over the lazy dog. This pangram contains every letter of the English alphabet. It is commonly used for testing fonts and keyboards.
   ```
4. [ ] Click "Execute Recipe"
5. [ ] Observe execution process:
   - Button changes to "Executing..."
   - Button is disabled during execution
6. [ ] Wait for response (may take 5-30 seconds on first run)

**What to Look For:**
- Input is correctly displayed
- Loading state is shown during execution
- Response appears in the result area
- Response is relevant to the input
- Execution time is displayed
- Copy and Clear buttons appear

**Expected Result:**
You should see a one-sentence summary of the input text.

**Troubleshooting:**
- If execution hangs, check browser console for errors
- If you see "AI client not available", refresh the side panel
- First execution may take longer as the model loads

---

### ✅ Phase 4: Test Streaming Response

**What to Test:**
1. [ ] Execute the same recipe again (or create a new one)
2. [ ] Enter a longer input text (3-4 paragraphs)
3. [ ] Click "Execute Recipe"
4. [ ] Watch the response area

**What to Look For:**
- Response should appear progressively (word by word or chunk by chunk)
- Text should scroll automatically as new content arrives
- No visible lag or jank during streaming
- Complete response matches expected output

**Streaming Indicator:**
You should see text appearing gradually, not all at once.

---

### ✅ Phase 5: Test Copy-to-Clipboard

**What to Test:**
1. [ ] After a successful execution, click "Copy Result" button
2. [ ] Button text should change to "Copied!"
3. [ ] Paste the clipboard content somewhere (e.g., a text editor)

**What to Look For:**
- Button provides visual feedback
- Clipboard contains the full response text
- No extra formatting or artifacts

---

### ✅ Phase 6: Test Clear Result

**What to Test:**
1. [ ] After viewing a result, click "Clear" button
2. [ ] Result area should disappear
3. [ ] Input field should remain filled (so you can execute again)

**What to Look For:**
- Result area clears completely
- No visual glitches
- Can execute the recipe again immediately

---

### ✅ Phase 7: Test Error Handling

**Test 7a: Empty Input**
1. [ ] Try to execute recipe with empty input
2. [ ] Should see alert: "Please enter some input"
3. [ ] Execution should not proceed

**Test 7b: Navigation During Execution**
1. [ ] Start a recipe execution
2. [ ] Click "Back" button while it's executing
3. [ ] Should navigate back to list
4. [ ] Check console for any errors (cleanup should happen)

**Test 7c: Multiple Executions**
1. [ ] Execute a recipe successfully
2. [ ] Immediately click "Execute Recipe" again (without clearing)
3. [ ] Should work without errors
4. [ ] New result should replace old result

---

### ✅ Phase 8: Test Prompt Interpolation

**Create a test recipe with multiple placeholders:**
- **Name:** `Multi-Placeholder Test`
- **Prompt:** `Given this text: {user_input}, please analyze it.`
- **Input Type:** Text

**What to Test:**
1. [ ] Execute with normal text
2. [ ] Check browser console logs for "Interpolated prompt"
3. [ ] Verify `{user_input}` is replaced correctly

**Test Special Characters:**
Enter input with special characters:
```
<script>alert("test")</script>
Line 1
Line 2	Tab
"Quotes"
```

**What to Look For:**
- HTML tags should be stripped (check console logs)
- Special characters should be escaped
- Response should still be meaningful

---

### ✅ Phase 9: Test Recipe Usage Tracking

**What to Test:**
1. [ ] Execute a recipe successfully
2. [ ] Go back to the recipe list
3. [ ] Check the recipe metadata

**What to Look For:**
- Recipe should show "Last used: Today" (or similar recent timestamp)
- Timestamp should update each time you execute the recipe

---

### ✅ Phase 10: Test Multiple Recipes

**What to Test:**
1. [ ] Create 2-3 different recipes with different purposes:
   - **Recipe 1:** Summarize text
   - **Recipe 2:** Generate creative content (e.g., "Write a haiku about: {user_input}")
   - **Recipe 3:** Answer questions (e.g., "Explain this concept: {user_input}")
2. [ ] Execute each recipe with appropriate inputs
3. [ ] Navigate between recipes

**What to Look For:**
- Each recipe executes independently
- No cross-contamination of inputs or results
- Navigation works smoothly
- Can execute multiple recipes in sequence

---

## Performance Benchmarks

Track these metrics during testing:

| Metric | Expected Value | Your Result |
|--------|---------------|-------------|
| AI Status Check | < 2 seconds | _________ |
| First Execution | 5-30 seconds | _________ |
| Subsequent Executions | 2-10 seconds | _________ |
| Short Input (< 100 chars) | 2-5 seconds | _________ |
| Long Input (> 500 chars) | 5-15 seconds | _________ |
| Streaming Chunk Delay | < 100ms | _________ |

---

## Console Debugging

Open DevTools Console (F12) to see detailed logs:

**Expected Log Messages:**
```
✅ "AI Client: Functions exposed globally"
✅ "Initializing LLM Shortcuts side panel"
✅ "AI availability status: available"
✅ "Recipe created successfully: [recipe-id]"
✅ "Executing recipe: [recipe-name]"
✅ "Interpolated prompt: [prompt-with-input]"
✅ "Recipe marked as used"
```

**Warning Messages (Expected):**
```
⚠️  "Input truncated to 10000 characters" (only for very long inputs)
⚠️  "Unreplaced placeholders found: [...]" (only if using unknown placeholders)
```

**Error Messages (Should NOT Appear):**
```
❌ Any JavaScript errors
❌ "Failed to execute recipe"
❌ "AI client is not available" (after initial setup)
```

---

## Known Issues & Workarounds

### Issue: AI Model Not Available
**Symptoms:** "AI not available" error after enabling flags
**Solution:** 
1. Ensure you're on Chrome 127+
2. Restart Chrome completely
3. Wait for model download to complete
4. Try `chrome://components/` → look for "Optimization Guide On Device Model" → click "Check for update"

### Issue: First Execution Very Slow
**Symptoms:** First recipe execution takes 30+ seconds
**Solution:** This is normal! The AI model needs to load into memory. Subsequent executions will be much faster.

### Issue: Streaming Not Visible
**Symptoms:** Response appears all at once, not progressively
**Solution:** 
- This may happen with very short responses
- Try a longer input (3-4 paragraphs)
- Check if streaming is actually happening in console logs

### Issue: Extension Not Appearing in Toolbar
**Symptoms:** Can't find the extension icon
**Solution:**
1. Click the puzzle piece icon (extensions menu)
2. Find "LLM Shortcuts (Dev)"
3. Click the pin icon to pin it to toolbar

---

## Testing Completion Checklist

Before reporting results:

- [ ] All 10 test phases completed
- [ ] At least 3 different recipes created and tested
- [ ] Both short and long inputs tested
- [ ] Streaming behavior observed
- [ ] Error handling verified
- [ ] No console errors during normal operation
- [ ] Performance meets expected benchmarks
- [ ] Copy/clear functionality works
- [ ] Usage tracking updates correctly

---

## Reporting Issues

If you encounter any issues, please note:

1. **Chrome Version:** (check `chrome://version`)
2. **AI Status:** (from the extension's status banner)
3. **Error Message:** (exact text or screenshot)
4. **Console Errors:** (copy from DevTools Console)
5. **Steps to Reproduce:** (what you did before the error)
6. **Expected vs. Actual:** (what should happen vs. what happened)

---

## Next Steps After Testing

Once testing is complete:
1. Document any bugs or issues found
2. Note any UX improvements needed
3. Verify all Phase 4 functionality works as expected
4. Ready to proceed to Phase 5 (Recipe Creation & Editing)

Happy testing! 🚀

