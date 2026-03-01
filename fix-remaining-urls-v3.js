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
                search: /const response = await fetch\(`http:\/\/localhost:5000(\/api\/students\/profile`)`/,
                replace: 'const response = await fetch(`${window.API_CONFIG?.API_BASE_URL || \'' + PROD_URL + '\'}$1`)`'
            },
            {
                search: /photoUrl = `http:\/\/localhost:5000(\/uploads\/[^`]+)`/g,
                replace: `photoUrl = \`\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1\``
            }
        ]
    },
    {
        path: 'js/teacher.js',
        patterns: [
            {
                search: /<a href="http:\/\/localhost:5000([^"]+)" target="_blank">Download<\/a>/g,
                replace: `<a href="\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1" target="_blank">Download</a>`
            },
            {
                search: /const marksResponse = await fetch\(`http:\/\/localhost:5000(\/marks\/student\/[^`]+)`/g,
                replace: `const marksResponse = await fetch(\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'}$1\``
            },
            {
                search: /window\.open\(`http:\/\/localhost:5000([^`]+)`/g,
                replace: `window.open(\`\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1\``
            },
            {
                search: /link\.href = `http:\/\/localhost:5000([^`]+)`/g,
                replace: `link.href = \`\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1\``
            },
            {
                search: /const pdfUrl = `http:\/\/localhost:5000([^`]+)`/g,
                replace: `const pdfUrl = \`\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1\``
            }
        ]
    },
    {
        path: 'js/student.js',
        patterns: [
            {
                search: /link\.href = `http:\/\/localhost:5000(\/uploads\/resources\/[^`]+)`/g,
                replace: `link.href = \`\${window.API_CONFIG?.UPLOADS_PATH || '${PROD_URL}/uploads'}/resources/$1\``
            },
            {
                search: /<a href="http:\/\/localhost:5000([^"]+)" target="_blank"/g,
                replace: `<a href="\${window.API_CONFIG?.BASE_URL || '${PROD_URL}'}$1" target="_blank"`
            }
        ]
    },
    {
        path: 'pages/index.html',
        patterns: [
            {
                search: /const url = `http:\/\/localhost:5000(\${endpoint})`/,
                replace: 'const url = `' + PROD_URL + '$1`'
            }
        ]
    },
    {
        path: 'js/attendance-details.js',
        patterns: [
            {
                search: /const baseUrl = 'http:\/\/localhost:5000'/,
                replace: `const baseUrl = '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/accountant-new.js',
        patterns: [
            {
                search: /userMessage \+= 'Please make sure the backend server is running at http:\/\/localhost:5000'/,
                replace: `userMessage += 'Please make sure the backend server is running at ${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/accountant-fees.js.bak',
        patterns: [
            {
                search: /const deleteUrl = `http:\/\/localhost:5000(\/api\/fees\/[^`]+)`/g,
                replace: 'const deleteUrl = `' + PROD_URL + '$1`'
            },
            {
                search: /const apiUrl = 'http:\/\/localhost:5000(\/api\/fees\?[^']*)'/g,
                replace: `const apiUrl = '${PROD_URL}$1'`
            }
        ]
    },
    {
        path: 'js/library.js',
        patterns: [
            {
                search: /const API_CONFIG = window\.API_CONFIG \|\| \{ BASE_URL: 'http:\/\/localhost:5000' \}/,
                replace: `const API_CONFIG = window.API_CONFIG || { BASE_URL: '${PROD_URL}' }`
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
