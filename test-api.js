#!/usr/bin/env node

/**
 * Test script for Chrome AI API capabilities
 * This script can be run in a browser console to test AI functionality
 */

// Test script that can be run in browser console
const testAICapabilities = `
// Test Chrome AI API availability and capabilities
console.log('🧪 Testing Chrome AI API capabilities...');

// Check if AI API is available
if (typeof window !== 'undefined' && window.ai && window.ai.languageModel) {
  console.log('✅ Chrome AI API is available');
  
  // Check AI availability status
  window.ai.languageModel.availability().then(availability => {
    console.log('📊 AI Availability Status:', availability);
    
    if (availability === 'unavailable') {
      throw new Error('AI model is not available on this device');
    }
    
    if (availability === 'downloadable') {
      console.log('📥 AI model needs to be downloaded. This may take some time...');
    }
    
    if (availability === 'downloading') {
      console.log('📥 AI model is currently downloading. Please wait...');
    }
    
    if (availability === 'available') {
      console.log('✅ AI model is ready to use');
    }
    
    // Test capabilities
    return window.ai.languageModel.capabilities();
  }).then(capabilities => {
    console.log('📊 AI Capabilities:', capabilities);
    
    // Test basic prompt execution
    return window.ai.languageModel.create({
      temperature: 0.7,
      topK: 40
    });
  }).then(session => {
    console.log('🔗 AI Session created successfully');
    
    // Test simple prompt
    return session.prompt('Say "Hello, AI is working!"');
  }).then(response => {
    console.log('🤖 AI Response:', response);
    console.log('✅ AI API test completed successfully');
  }).catch(error => {
    console.error('❌ AI API test failed:', error);
    console.log('🔧 Troubleshooting:');
    console.log('  - Ensure Chrome 127+ is being used');
    console.log('  - Check that AI flags are enabled:');
    console.log('    chrome://flags/#optimization-guide-on-device-model');
    console.log('    chrome://flags/#prompt-api-for-gemini-nano');
    console.log('  - Verify extension has proper permissions');
  });
} else {
  console.error('❌ Chrome AI API is not available');
  console.log('🔧 Requirements:');
  console.log('  - Chrome browser version 127+');
  console.log('  - AI features enabled in Chrome flags');
  console.log('  - Extension loaded with proper permissions');
}
`;

console.log('🧪 Chrome AI API Test Script');
console.log('============================');
console.log('');
console.log('To test the AI API capabilities:');
console.log('1. Load the extension in Chrome');
console.log('2. Open the side panel');
console.log('3. Open browser developer tools (F12)');
console.log('4. Go to Console tab');
console.log('5. Copy and paste the following code:');
console.log('');
console.log(testAICapabilities);
console.log('');
console.log('Expected results:');
console.log('✅ AI API available message');
console.log('📊 Capabilities object with model info');
console.log('🔗 Session creation success');
console.log('🤖 AI response with "Hello, AI is working!"');
console.log('');
console.log('If you see errors, check the troubleshooting steps above.');

// Export for use in other scripts
module.exports = { testAICapabilities };
