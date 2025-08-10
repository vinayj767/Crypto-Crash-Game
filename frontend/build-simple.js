const fs = require('fs');
const path = require('path');

console.log('🚀 Simple production build starting...');

// Copy production App to main App
const productionPath = path.join(__dirname, 'src', 'App.production.jsx');
const mainPath = path.join(__dirname, 'src', 'App.jsx');

try {
  // Read production file
  const productionContent = fs.readFileSync(productionPath, 'utf8');
  
  // Write to main App.jsx
  fs.writeFileSync(mainPath, productionContent);
  
  console.log('✅ Production App.jsx copied successfully');
  console.log('🔗 Backend URL: https://crypto-crash-game-h8w6.onrender.com');
  console.log('📦 Build ready for Vite');
} catch (error) {
  console.error('❌ Build script error:', error);
  process.exit(1);
}
