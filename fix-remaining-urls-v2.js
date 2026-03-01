const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const PROD_URL = 'https://school-management-system-av07.onrender.com';

// Files that need updates
const FILES_TO_UPDATE = [
    'js/profile.js',
    'js/quiz-management.js',
    'js/quiz-creation.js',
    'js/quizzes-fixed-v2.js',
    'js/quizzes-fixed.js',
    'js/quizzes-new.js',
    'js/quizzes.js',
    'js/student.js',
    'js/teacher.js'
];

function updateFile(filePath) {
    try {
        const fullPath = path.join(FRONTEND_DIR, filePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`File not found: ${filePath}`);
            return false;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        let changesMade = false;

        // Pattern 1: const API_BASE_URL = 'http://localhost:5000';
        const pattern1 = /(const|let|var)\s+API_BASE_URL\s*=\s*['"]http:\/\/localhost:5000['"]/g;
        if (pattern1.test(content)) {
            content = content.replace(pattern1, `const API_BASE_URL = '${PROD_URL}'`);
            changesMade = true;
        }

        // Pattern 2: window.API_BASE_URL || 'http://localhost:5000'
        const pattern2 = /window\.API_BASE_URL\s*\|\|\s*['"]http:\/\/localhost:5000['"]/g;
        if (pattern2.test(content)) {
            content = content.replace(pattern2, `window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'`);
            changesMade = true;
        }

        // Pattern 3: 'http://localhost:5000/uploads/...'
        const pattern3 = /['"]http:\/\/localhost:5000(\/uploads\/[^'"\s]+)['"]/g;
        if (pattern3.test(content)) {
            content = content.replace(pattern3, `'${PROD_URL}$1'`);
            changesMade = true;
        }

        // Pattern 4: `http://localhost:5000/api/...` (template literals)
        const pattern4 = /`http:\/\/localhost:5000(\/api\/[^`]+)`/g;
        if (pattern4.test(content)) {
            content = content.replace(pattern4, `\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'}$1\``);
            changesMade = true;
        }

        // Pattern 5: fetch(`http://localhost:5000/...`)
        const pattern5 = /fetch\([`']http:\/\/localhost:5000(\/api\/[^`']+)[`']/g;
        if (pattern5.test(content)) {
            content = content.replace(pattern5, `fetch(\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}'}$1\``);
            changesMade = true;
        }

        // Pattern 6: const baseUrl = 'http://localhost:5000';
        const pattern6 = /const\s+baseUrl\s*=\s*['"]http:\/\/localhost:5000['"]/g;
        if (pattern6.test(content)) {
            content = content.replace(pattern6, `const baseUrl = '${PROD_URL}'`);
            changesMade = true;
        }

        if (changesMade) {
            // Ensure the directory exists before writing
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated: ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

async function runUpdates() {
    console.log('🚀 Updating remaining hardcoded URLs in frontend files...\n');
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const file of FILES_TO_UPDATE) {
        const result = await updateFile(file);
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
