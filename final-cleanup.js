const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const PROD_URL = 'https://school-management-system-av07.onrender.com';

// Files that need updates with specific patterns
const FILES_TO_UPDATE = [
    {
        path: 'js/profile.js',
        patterns: [
            {
                search: /\/\/ Clean up any existing localhost:8000 URLs\s+if \(photoUrl\.includes\('localhost:8000'\)\) \{\s+photoUrl = photoUrl\.replace\('http:\/\/localhost:8000', window\.API_CONFIG\?\.BASE_URL \|\| '[^']+'\);\s+\}/,
                replace: '// Clean up any existing localhost URLs\n      if (photoUrl.includes(\'localhost:8000\')) {\n        photoUrl = photoUrl.replace(\'http://localhost:8000\', window.API_CONFIG?.BASE_URL || \'' + PROD_URL + '\');\n      }'
            }
        ]
    },
    {
        path: 'js/config.js',
        patterns: [
            {
                search: /return path\.replace\('http:\/\/localhost:8000', window\.API_CONFIG\?\.BASE_URL \|\| '[^']+'\)/,
                replace: `return path.replace('http://localhost:8000', window.API_CONFIG?.BASE_URL || '${PROD_URL}')`
            }
        ]
    },
    {
        path: 'js/accountant-new.js',
        patterns: [
            {
                search: /const isLocalhost = window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1';/,
                replace: 'const isLocalhost = false; // Local development check disabled for production'
            },
            {
                search: /\$\{isLocalhost \? `[^`]+` : ''\}/g,
                replace: ''
            }
        ]
    },
    {
        path: 'js/take-quiz.js',
        patterns: [
            {
                search: /\/\/ Add debug button and run initial debug\s+if \(window\.location\.hostname === 'localhost' \|\| window\.location\.hostname === '127\.0\.0\.1'\) \{[\s\S]+?\/\/ Also run debug after a short delay to catch any dynamic content/,
                replace: '// Debug functionality disabled in production'
            }
        ]
    }
];

function updateFile(fileConfig) {
    try {
        const fullPath = path.join(FRONTEND_DIR, fileConfig.path);
        if (!fs.existsSync(fullPath)) {
            console.log(`File not found: ${fileConfig.path}`);
            return false;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        let changesMade = false;

        // Apply all patterns for this file
        for (const pattern of fileConfig.patterns) {
            if (pattern.search.test(content)) {
                content = content.replace(pattern.search, pattern.replace);
                changesMade = true;
            }
        }

        if (changesMade) {
            // Ensure the directory exists before writing
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated: ${fileConfig.path}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error updating ${fileConfig.path}:`, error.message);
        return false;
    }
}

async function runUpdates() {
    console.log('🚀 Performing final cleanup of localhost references...\n');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const fileConfig of FILES_TO_UPDATE) {
        const result = await updateFile(fileConfig);
        if (result === true) {
            updatedCount++;
        } else if (result === false) {
            errorCount++;
        }
    }
    
    console.log('\n📊 Cleanup Summary:');
    console.log(`✅ ${updatedCount} files updated successfully`);
    console.log(`❌ ${errorCount} files had errors`);
    console.log(`ℹ️  ${FILES_TO_UPDATE.length - updatedCount - errorCount} files were already up to date`);
    console.log('\n✅ Final cleanup complete!');
}

// Run the updates
runUpdates().catch(console.error);
