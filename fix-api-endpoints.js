const fs = require('fs');
const path = require('path');

const FRONTEND_DIR = path.join(__dirname, 'frontend');
const PROD_URL = 'https://school-management-system-av07.onrender.com';

// Files to update
const FILES_TO_UPDATE = [
    'pages/index.html',
    'pages/teacher.html',
    'js/script.js',
    'js/accountant-fees.js',
    'js/student-management.new.js',
    'js/attendance.js',
    'js/teacher-dashboard.js',
    'js/accountant-new.js',
    'js/dashboard-analytics.js',
    'js/events.js',
    'js/library.js',
    'js/roles.js',
    'js/login.js'
];

function updateApiEndpoints(filePath) {
    try {
        const fullPath = path.join(FRONTEND_DIR, filePath);
        if (!fs.existsSync(fullPath)) {
            console.log(`File not found: ${filePath}`);
            return;
        }

        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;

        // Replace fetch calls to use window.API_CONFIG or the production URL
        content = content.replace(
            /fetch\(['"]http:\/\/localhost:5000\/api\/([^'"]+)['"]/g,
            `fetch(\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}/api'}/$1\`)`
        );

        // Replace any remaining hardcoded localhost URLs
        content = content.replace(
            /fetch\(['"]\/api\/([^'"]+)['"]/g,
            `fetch(\`\${window.API_CONFIG?.API_BASE_URL || '${PROD_URL}/api'}/$1\`)`
        );

        // Update API base URL in configuration
        if (content.includes('API_CONFIG') && !content.includes('API_BASE_URL')) {
            content = content.replace(
                /window\.API_CONFIG\s*=\s*\{/,
                `window.API_CONFIG = {\n    API_BASE_URL: '${PROD_URL}/api',\n    AUTH_URL: '${PROD_URL}/api/auth',`
            );
        }

        if (content !== originalContent) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log(`✅ Updated API endpoints in: ${filePath}`);
        } else {
            console.log(`ℹ️ No API endpoints to update in: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error updating ${filePath}:`, error.message);
    }
}

console.log('🚀 Updating API endpoints in frontend files...\n');
FILES_TO_UPDATE.forEach(updateApiEndpoints);
console.log('\n✅ API endpoint update complete!');
