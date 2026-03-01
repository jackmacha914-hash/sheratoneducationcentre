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
                search: /\/\/ Clean up any existing localhost URLs\s+if \(photoUrl\.includes\('localhost:8000'\)\) \{\s+photoUrl = photoUrl\.replace\('http:\/\/localhost:8000', window\.API_CONFIG\?\.BASE_URL \|\| '[^']+'\);\s+\}/,
                replace: '// Clean up any existing localhost URLs\n      if (photoUrl.includes(\'localhost:8000\')) {\n        photoUrl = photoUrl.replace(/^http:\/\/localhost:8000/, window.API_CONFIG?.BASE_URL || \'' + PROD_URL + '\');\n      }'
            }
        ]
    },
    {
        path: 'js/config.js',
        patterns: [
            {
                search: /return path\.replace\('http:\/\/localhost:8000', window\.API_CONFIG\?\.BASE_URL \|\| '[^']+'\)/,
                replace: `return path.replace(/^http:\/\\/localhost:8000/, window.API_CONFIG?.BASE_URL || '${PROD_URL}')`
            }
        ]
    },
    {
        path: 'js/accountant-new.js',
        patterns: [
            {
                search: /if \(isLocalhost\) \{[\s\S]+?\}/g,
                replace: '// Localhost-specific code removed for production'
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
            const match = content.match(pattern.search);
            if (match) {
                console.log(`Found pattern in ${fileConfig.path}:`, match[0].substring(0, 100) + '...');
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
        } else {
            console.log(`ℹ️  No changes needed for: ${fileConfig.path}`);
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
    
    // Final check for any remaining localhost references
    console.log('\n🔍 Checking for any remaining localhost references...');
    const grep = require('child_process').spawnSync('grep', [
        '-r', '--include=*.{js,jsx,ts,tsx,html,css}',
        '-l', 'localhost',
        '--exclude-dir=node_modules',
        '--exclude-dir=.git',
        'frontend/'
    ], { encoding: 'utf8' });
    
    if (grep.stdout) {
        const files = grep.stdout.trim().split('\n').filter(Boolean);
        if (files.length > 0) {
            console.log('\n⚠️  Found remaining localhost references in these files:');
            files.forEach(file => console.log(`  - ${file}`));
            console.log('\nPlease review these files and update them as needed.');
        } else {
            console.log('✅ No remaining localhost references found!');
        }
    } else {
        console.log('✅ No remaining localhost references found!');
    }
    
    console.log('\n✅ Final cleanup complete!');
}

// Run the updates
runUpdates().catch(console.error);
