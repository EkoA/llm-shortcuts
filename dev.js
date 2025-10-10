#!/usr/bin/env node

/**
 * Development script for LLM Shortcuts Chrome Extension
 * Watches for changes and rebuilds automatically
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chokidar = require('chokidar');

const { build } = require('./build.js');

let isBuilding = false;
let buildTimeout: NodeJS.Timeout | null = null;

/**
 * Debounced build function
 */
function debouncedBuild() {
    if (buildTimeout) {
        clearTimeout(buildTimeout);
    }

    buildTimeout = setTimeout(() => {
        if (!isBuilding) {
            isBuilding = true;
            console.log('\n🔄 File changed, rebuilding...');

            try {
                build();
                console.log('✅ Rebuild completed\n');
            } catch (error) {
                console.error('❌ Rebuild failed:', error.message);
            } finally {
                isBuilding = false;
            }
        }
    }, 1000); // 1 second debounce
}

/**
 * Start development watcher
 */
function startDevWatcher() {
    console.log('👀 Starting development watcher...\n');

    // Initial build
    build();

    // Watch for changes
    const watcher = chokidar.watch([
        'src/**/*.ts',
        'src/**/*.js',
        'sidepanel.html',
        'sidepanel.css',
        'manifest.json'
    ], {
        ignored: /(^|[\/\\])\../, // ignore dotfiles
        persistent: true
    });

    watcher.on('change', (filePath) => {
        console.log(`📝 File changed: ${filePath}`);
        debouncedBuild();
    });

    watcher.on('add', (filePath) => {
        console.log(`➕ File added: ${filePath}`);
        debouncedBuild();
    });

    watcher.on('unlink', (filePath) => {
        console.log(`🗑️  File removed: ${filePath}`);
        debouncedBuild();
    });

    console.log('🚀 Development server started!');
    console.log('📝 Watching for changes...');
    console.log('🛑 Press Ctrl+C to stop\n');

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping development watcher...');
        watcher.close();
        process.exit(0);
    });
}

/**
 * Check if chokidar is available
 */
function checkDependencies() {
    try {
        require.resolve('chokidar');
    } catch (error) {
        console.error('❌ chokidar is required for development mode');
        console.log('📦 Install it with: npm install --save-dev chokidar');
        process.exit(1);
    }
}

/**
 * Main development function
 */
function dev() {
    console.log('🔧 Starting LLM Shortcuts development mode...\n');

    checkDependencies();
    startDevWatcher();
}

// Run dev if called directly
if (require.main === module) {
    dev();
}

module.exports = { dev };
