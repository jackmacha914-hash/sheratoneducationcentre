const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const PROD_URL = 'https://school-management-system-av07.onrender.com';

// Files that need updates with specific patterns
const FILES_TO_UPDATE = [
    {
        path: 'js/marks-clean.js',
        patterns: [
            {
                search: /const API_BASE_URL = 'http:\/\/localhost:3000'/,
                replace: `const API_BASE_URL = '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/marks.js',
        patterns: [
            {
                search: /const API_BASE_URL = 'http:\/\/localhost:3000'/,
                replace: `const API_BASE_URL = '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'js/report-cards.js.bak',
        patterns: [
            {
                search: /'Access-Control-Allow-Origin': 'http:\/\/localhost:8000'/,
                replace: `'Access-Control-Allow-Origin': '${PROD_URL}'`
            }
        ]
    },
    {
        path: 'pages/index.html',
        patterns: [
            {
                search: /onclick="window\.location\.href='http:\/\/localhost:8000(\/pages\/login)'"/,
                replace: `onclick="window.location.href='$1'"`
            }
        ]
    },
    {
        path: 'pages/student.html',
        patterns: [
            {
                search: /onclick="window\.location\.href='http:\/\/localhost:8000(\/pages\/login)'"/,
                replace: `onclick="window.location.href='$1'"`
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
    console.log('🚀 Cleaning up remaining hardcoded localhost URLs...\n');
    
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
    
    // Clean up backup files
    console.log('\n🧹 Cleaning up backup files...');
    const backupFiles = [
        'js/report-cards.js.bak',
        'js/accountant-fees.js.bak',
        'js/take-quiz.js.bak'
    ];
    
    let deletedCount = 0;
    for (const file of backupFiles) {
        const fullPath = path.join(FRONTEND_DIR, file);
        try {
            if (fs.existsSync(fullPath)) {
                fs.unlinkSync(fullPath);
                console.log(`✅ Deleted: ${file}`);
                deletedCount++;
            }
        } catch (error) {
            console.error(`❌ Error deleting ${file}:`, error.message);
        }
    }
    
    console.log(`\n🧹 Deleted ${deletedCount} backup files`);
    console.log('\n✅ Cleanup complete!');
}

// Run the updates
runUpdates().catch(console.error);
