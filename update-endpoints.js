const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const PROD_URL = 'https://school-management-system-av07.onrender.com';

// Files to update
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

function updateEndpoints(filePath) {
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
            /fetch\('http:\/\/localhost:5000\/api\/([^']+)'/g,
            'fetch(`${window.API_CONFIG.API_BASE_URL}/$1`'
        );

        // Replace any remaining hardcoded localhost URLs
        content = content.replace(
            /'http:\/\/localhost:\d+\/api\/([^']+)'/g,
            '`${window.API_CONFIG.API_BASE_URL}/$1`'
        );

        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated endpoints in: ${filePath}`);
        } else {
            console.log(`ℹ️ No changes needed: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

console.log('🚀 Updating API endpoints in frontend files...\n');
FILES_TO_UPDATE.forEach(updateEndpoints);
console.log('\n✅ Endpoint update complete!');
