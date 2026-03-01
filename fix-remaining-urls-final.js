const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const PROD_URL = 'https://school-management-system-av07.onrender.com';

// Files that need updates with specific patterns
const FILES_TO_UPDATE = [
    {
        path: 'js/student.js',
        patterns: [
            {
                search: /<a href="http:\/\/localhost:5000([^"]+)"\s+class="btn btn-outline-primary"\s+target="_blank">/g,
                replace: `<a href="\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1" class="btn btn-outline-primary" target="_blank">`
            }
        ]
    },
    {
        path: 'js/take-quiz.js',
        patterns: [
            {
                search: /const API_BASE_URL = window\.API_BASE_URL \|\| 'http:\/\/localhost:5000'/,
                replace: `const API_BASE_URL = window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/teacher-quiz.js',
        patterns: [
            {
                search: /const API_BASE_URL = window\.API_BASE_URL \|\| 'http:\/\/localhost:5000'/,
                replace: `const API_BASE_URL = window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/report-cards.js.bak',
        patterns: [
            {
                search: /const API_BASE_URL = 'http:\/\/localhost:5000'/,
                replace: `const API_BASE_URL = '${PROD_URL}'`
            },
            {
                search: /fetch\(`http:\/\/localhost:5000(\/api\/marks\/student\/[^`]+)`/g,
                replace: `fetch(\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'}$1\``
            }
        ]
    },
    {
        path: 'js/quizzes-backup.js',
        patterns: [
            {
                search: /const API_BASE_URL = window\.API_BASE_URL \|\| 'http:\/\/localhost:5000'/,
                replace: `const API_BASE_URL = window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/accountant-fees.js.bak',
        patterns: [
            {
                search: /const response = await fetch\(`http:\/\/localhost:5000(\/api\/fees\/[^`]+)`/g,
                replace: `const response = await fetch(\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'}$1\``
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
    console.log('🚀 Updating remaining hardcoded URLs in frontend files...\n');
    
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
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ ${updatedCount} files updated successfully`);
    console.log(`❌ ${errorCount} files had errors`);
    console.log(`ℹ️  ${FILES_TO_UPDATE.length - updatedCount - errorCount} files were already up to date`);
    console.log('\n✅ Update complete!');
}

// Run the updates
runUpdates().catch(console.error);
