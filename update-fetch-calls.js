 /*const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const FILES_TO_UPDATE = [
    'pages/teacher.html',
    'pages/index.html',
    'js/script.js',
    'js/accountant-fees.js',
    'js/student-management.new.js',
    'js/attendance.js',
    'js/teacher-dashboard.js',
    'js/accountant-new.js',
    'js/dashboard-analytics.js',
    'js/events.js',
    'js/library.js',
    'js/roles.js'
];

function updateFetchCalls(filePath) {
    try {
        const fullPath = path.join(FRONTEND_DIR, filePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;

        // Replace fetch calls to use window.API_CONFIG
        content = content.replace(
            /fetch\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g,
            'fetch(`${window.API_CONFIG.API_BASE_URL}/$1`'
        );

        // Replace any remaining hardcoded localhost URLs
        content = content.replace(
            /fetch\(['"]http:\/\/localhost:\d+\/api\/([^'"]+)['"]/g,
            'fetch(`${window.API_CONFIG.API_BASE_URL}/$1`'
        );

        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated fetch calls in: ${filePath}`);
        } else {
            console.log(`ℹ️ No fetch calls to update in: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

console.log('🚀 Updating fetch calls in frontend files...\n');
FILES_TO_UPDATE.forEach(updateFetchCalls);
console.log('\n✅ Fetch call update complete!');
