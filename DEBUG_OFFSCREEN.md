# Debug Offscreen Document

## Steps to Inspect Offscreen Document Console:

1. Open Chrome DevTools
2. Go to: `chrome://extensions/`
3. Find "LLM Shortcuts (Dev)"
4. Look for "Inspect views: offscreen.html" link
5. Click it to open the offscreen document's console

## What to Check:

In the offscreen document console, type:
```javascript
window.ai
```

Expected outcomes:
- If returns `undefined` → window.ai is NOT available in offscreen documents
- If returns an object → window.ai IS available, but there's a timing issue

## Alternative: Check from Offscreen Console

Also try typing in the offscreen console:
```javascript
console.log('=== Manual Check ===');
console.log('window.ai:', window.ai);
console.log('typeof window.ai:', typeof window.ai);
console.log('window keys:', Object.keys(window).filter(k => k.includes('ai')));
```

This will tell us definitively if `window.ai` exists in offscreen documents.

