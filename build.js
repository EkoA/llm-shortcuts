#!/usr/bin/env node

/**
 * Build script for LLM Shortcuts Chrome Extension
 * Compiles TypeScript and copies static assets
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = 'dist';
const SRC_DIR = 'src';

/**
 * Clean the dist directory
 */
function cleanDist() {
    console.log('🧹 Cleaning dist directory...');

    if (fs.existsSync(DIST_DIR)) {
        fs.rmSync(DIST_DIR, { recursive: true, force: true });
    }

    fs.mkdirSync(DIST_DIR, { recursive: true });
}

/**
 * Compile TypeScript
 */
function compileTypeScript() {
    console.log('🔨 Compiling TypeScript...');

    try {
        execSync('npx tsc', { stdio: 'inherit' });
        console.log('✅ TypeScript compilation successful');
    } catch (error) {
        console.error('❌ TypeScript compilation failed:', error.message);
        process.exit(1);
    }
}

/**
 * Copy static assets
 */
function copyStaticAssets() {
    console.log('📁 Copying static assets...');

    const staticFiles = [
        'manifest.json',
        'sidepanel.html',
        'sidepanel.css'
    ];

    staticFiles.forEach(file => {
        if (fs.existsSync(file)) {
            fs.copyFileSync(file, path.join(DIST_DIR, file));
            console.log(`  ✓ Copied ${file}`);
        } else {
            console.warn(`  ⚠️  ${file} not found`);
        }
    });
}

/**
 * Copy compiled JavaScript files to root of dist
 */
function copyCompiledJS() {
    console.log('📦 Copying compiled JavaScript...');

    const jsFiles = [
        'background.js',
        'sidepanel.js'
    ];

    jsFiles.forEach(file => {
        const srcPath = path.join(DIST_DIR, file);
        const destPath = path.join(DIST_DIR, file);

        if (fs.existsSync(srcPath)) {
            // File is already in the right place, just confirm
            console.log(`  ✓ ${file} is ready`);
        } else {
            console.warn(`  ⚠️  ${file} not found in compiled output`);
        }
    });
}

/**
 * Bundle sidepanel with all dependencies
 */
function bundleSidepanel() {
    console.log('📦 Bundling sidepanel with dependencies...');

    const sidepanelPath = path.join(DIST_DIR, 'sidepanel.js');
    const bundledPath = path.join(DIST_DIR, 'sidepanel-bundled.js');

    if (!fs.existsSync(sidepanelPath)) {
        console.warn('  ⚠️  sidepanel.js not found');
        return;
    }

    // Read all dependency files in order
    const dependencyFiles = [
        'utils/uuid.js',
        'utils/validation.js',
        'utils/prompt-interpolation.js',
        'models/recipe.model.js',
        'core/storage.js',
        'core/recipe-manager.js',
        'core/ai-client.js',
        'core/prompt-executor.js'
    ];

    let bundledContent = '';

    // Add each dependency file
    dependencyFiles.forEach(file => {
        const filePath = path.join(DIST_DIR, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            // More aggressive cleaning for browser environment
            const cleanedContent = content
                .replace(/^"use strict";\s*$/gm, '') // Remove use strict
                .replace(/^Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);?\s*$/gm, '') // Remove esModule
                .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports
                .replace(/^exports\.\w+\s*=\s*\w+;?\s*$/gm, '') // Remove simple exports
                .replace(/^exports\[['"]\w+['"]\]\s*=\s*\w+;?\s*$/gm, '') // Remove bracket exports
                .replace(/^import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*$/gm, '') // Remove imports
                .replace(/^import\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '') // Remove simple imports
                .replace(/^export\s+{[^}]+};?\s*$/gm, '') // Remove export statements
                .replace(/^export\s+function\s+(\w+)/gm, 'function $1') // Convert export function to function
                .replace(/^export\s+const\s+(\w+)/gm, 'const $1') // Convert export const to const
                .replace(/^export\s+let\s+(\w+)/gm, 'let $1') // Convert export let to let
                .replace(/^export\s+var\s+(\w+)/gm, 'var $1') // Convert export var to var
                .replace(/^export\s+class\s+(\w+)/gm, 'class $1') // Convert export class to class
                .replace(/^\.\w+\s*=\s*\d+;?\s*$/gm, '') // Remove orphaned lines
                .replace(/^\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void assignments
                .replace(/^const\s+\w+_\d+\s*=\s*null;?\s*$/gm, '') // Remove module variables
                .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports (additional)
                .replace(/^exports\.\w+\s*=\s*undefined;?\s*$/gm, '') // Remove undefined exports
                .replace(/^exports\.\w+\s*=\s*null;?\s*$/gm, '') // Remove null exports
                .replace(/\w+_\d+\./g, ''); // Remove module prefixes

            bundledContent += cleanedContent + '\n\n';
            console.log(`  ✓ Added ${file}`);
        } else {
            console.warn(`  ⚠️  ${file} not found`);
        }
    });

    // Add the main sidepanel content
    const sidepanelContent = fs.readFileSync(sidepanelPath, 'utf8');
    const cleanedSidepanel = sidepanelContent
        .replace(/^"use strict";\s*$/gm, '') // Remove use strict
        .replace(/^Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);?\s*$/gm, '') // Remove esModule
        .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports
        .replace(/^exports\.\w+\s*=\s*\w+;?\s*$/gm, '') // Remove simple exports
        .replace(/^exports\[['"]\w+['"]\]\s*=\s*\w+;?\s*$/gm, '') // Remove bracket exports
        .replace(/^import\s+{[^}]+}\s+from\s+['"][^'"]+['"];?\s*$/gm, '') // Remove imports
        .replace(/^import\s+\w+\s+from\s+['"][^'"]+['"];?\s*$/gm, '') // Remove simple imports
        .replace(/^export\s+{[^}]+};?\s*$/gm, '') // Remove export statements
        .replace(/^export\s+function\s+(\w+)/gm, 'function $1') // Convert export function to function
        .replace(/^export\s+const\s+(\w+)/gm, 'const $1') // Convert export const to const
        .replace(/^export\s+let\s+(\w+)/gm, 'let $1') // Convert export let to let
        .replace(/^export\s+var\s+(\w+)/gm, 'var $1') // Convert export var to var
        .replace(/^export\s+class\s+(\w+)/gm, 'class $1') // Convert export class to class
        .replace(/^\.\w+\s*=\s*\d+;?\s*$/gm, '') // Remove orphaned lines
        .replace(/^\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void assignments
        .replace(/^const\s+\w+_\d+\s*=\s*null;?\s*$/gm, '') // Remove module variables
        .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports (additional)
        .replace(/^exports\.\w+\s*=\s*undefined;?\s*$/gm, '') // Remove undefined exports
        .replace(/^exports\.\w+\s*=\s*null;?\s*$/gm, '') // Remove null exports
        .replace(/\w+_\d+\./g, ''); // Remove module prefixes

    bundledContent += cleanedSidepanel;

    // Post-process to remove any remaining exports
    const finalContent = bundledContent
        .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports
        .replace(/^exports\.\w+\s*=\s*undefined;?\s*$/gm, '') // Remove undefined exports
        .replace(/^exports\.\w+\s*=\s*null;?\s*$/gm, '') // Remove null exports
        .replace(/^exports\.\w+\s*=\s*\w+;?\s*$/gm, '') // Remove simple exports
        .replace(/^exports\[['"]\w+['"]\]\s*=\s*\w+;?\s*$/gm, '') // Remove bracket exports
        .replace(/^exports\.\w+\s*=\s*exports\.\w+;?\s*$/gm, '') // Remove export assignments
        .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports (additional pass)
        .replace(/^exports\.\w+\s*=\s*exports\.\w+;?\s*$/gm, '') // Remove export assignments (additional pass)
        .replace(/^exports\.\w+\s*=\s*void\s+0;?\s*$/gm, '') // Remove void exports (final pass)
        .replace(/^exports\.\w+\s*=\s*exports\.\w+;?\s*$/gm, '') // Remove export assignments (final pass);

    // Write the bundled file
    fs.writeFileSync(bundledPath, finalContent);

    // Additional cleanup for any remaining exports and requires
    const finalCleanContent = finalContent
        .replace(/^exports\..*=.*void 0;$/gm, '') // Remove exports
        .replace(/^exports\..*=.*undefined;$/gm, '') // Remove undefined exports
        .replace(/^exports\..*=.*null;$/gm, '') // Remove null exports
        .replace(/^exports\..*=.*exports\..*;$/gm, '') // Remove export assignments
        .replace(/^exports\..*=.*;$/gm, '') // Remove any remaining exports
        .replace(/^const.*= require\(.*\);$/gm, '') // Remove require statements
        .replace(/^import.*from.*;$/gm, '') // Remove import statements
        .replace(/^export.*;$/gm, '') // Remove export statements
        .replace(/^Object\.defineProperty\(exports.*\);$/gm, ''); // Remove defineProperty exports
    fs.writeFileSync(bundledPath, finalCleanContent);

    console.log(`  ✓ Created bundled sidepanel: sidepanel-bundled.js`);
}

/**
 * Clean up src directory from dist
 */
function cleanupSrcDir() {
    console.log('🧹 Cleaning up src directory from dist...');

    // Keep the core directory but clean up other files
    const srcPath = path.join(DIST_DIR, SRC_DIR);
    if (fs.existsSync(srcPath)) {
        // Move core directory to root
        const coreSrcPath = path.join(srcPath, 'core');
        const coreDestPath = path.join(DIST_DIR, 'core');

        if (fs.existsSync(coreSrcPath)) {
            if (fs.existsSync(coreDestPath)) {
                fs.rmSync(coreDestPath, { recursive: true, force: true });
            }
            fs.renameSync(coreSrcPath, coreDestPath);
        }

        // Remove the src directory
        fs.rmSync(srcPath, { recursive: true, force: true });
    }

    // Clean up source map files
    const mapFiles = fs.readdirSync(DIST_DIR).filter(file => file.endsWith('.map'));
    mapFiles.forEach(file => {
        fs.unlinkSync(path.join(DIST_DIR, file));
    });

    // Clean up declaration files
    const dtsFiles = fs.readdirSync(DIST_DIR).filter(file => file.endsWith('.d.ts'));
    dtsFiles.forEach(file => {
        fs.unlinkSync(path.join(DIST_DIR, file));
    });
}

/**
 * Create development build
 */
function createDevBuild() {
    console.log('🚀 Creating development build...');

    // Add development markers
    const manifestPath = path.join(DIST_DIR, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifest.name = `${manifest.name} (Dev)`;
        manifest.version = `${manifest.version}-dev`;
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    }

    console.log('✅ Development build created');
}

/**
 * Main build function
 */
function build() {
    console.log('🏗️  Building LLM Shortcuts Chrome Extension...\n');

    try {
        cleanDist();
        compileTypeScript();
        copyStaticAssets();
        copyCompiledJS();
        bundleSidepanel();
        cleanupSrcDir();
        createDevBuild();

        console.log('\n🎉 Build completed successfully!');
        console.log(`📦 Extension files are in: ${DIST_DIR}/`);
        console.log('\n📋 Next steps:');
        console.log('  1. Open Chrome and go to chrome://extensions/');
        console.log('  2. Enable "Developer mode"');
        console.log('  3. Click "Load unpacked" and select the dist/ folder');
        console.log('  4. Click the extension icon to open the side panel');

    } catch (error) {
        console.error('\n❌ Build failed:', error.message);
        process.exit(1);
    }
}

// Run build if called directly
if (require.main === module) {
    build();
}

module.exports = { build };
