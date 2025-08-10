const fs = require('fs');
const path = require('path');

// Read the App.jsx file
const appPath = path.join(__dirname, 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// Replace the API URL with production URL
content = content.replace(
  /const API_BASE_URL = '.*?';/,
  "const API_BASE_URL = 'https://crypto-crash-game-h8w6.onrender.com';"
);

// Write back to file
fs.writeFileSync(appPath, content);

console.log('✅ Production API URL set in App.jsx');
console.log('🔗 Backend URL: https://crypto-crash-game-h8w6.onrender.com');
