// Production Configuration
export const PRODUCTION_CONFIG = {
  API_BASE_URL: 'https://crypto-crash-game-h8w6.onrender.com',
  NODE_ENV: 'production',
  BUILD_TIME: new Date().toISOString(),
  VERSION: '1.0.0-production'
};

console.log('🚀 Production config loaded:', PRODUCTION_CONFIG);
