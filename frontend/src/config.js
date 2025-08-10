// Production Configuration - This file is loaded directly
export const CONFIG = {
  API_BASE_URL: 'https://crypto-crash-game-h8w6.onrender.com',
  NODE_ENV: 'production',
  BUILD_TIME: new Date().toISOString()
};

// Log immediately when this file is loaded
console.log('🔧 Config file loaded:', CONFIG);
console.log('🔗 API URL:', CONFIG.API_BASE_URL);
