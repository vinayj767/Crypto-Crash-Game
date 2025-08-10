const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build process...');

// Force production API URL in App.jsx
const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Ensure the API URL is set to production
if (content.includes('localhost:3000')) {
  content = content.replace(/localhost:3000/g, 'https://crypto-crash-game-h8w6.onrender.com');
  console.log('✅ Replaced localhost:3000 with production URL');
}

// Ensure the hardcoded URL is correct
content = content.replace(
  /const API_BASE_URL = '.*?';/,
  "const API_BASE_URL = 'https://crypto-crash-game-h8w6.onrender.com';"
);

// Write back to file
fs.writeFileSync(appPath, content);

console.log('✅ Production API URL set in App.jsx');
console.log('🔗 Backend URL: https://crypto-crash-game-h8w6.onrender.com');
console.log('📦 Build script completed successfully');
