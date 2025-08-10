const express = require('express');
const router = express.Router();

// Import route modules
const gameRoutes = require('./game');
const playerRoutes = require('./player');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Crash Game API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ping endpoint for uptime monitoring
router.get('/ping', (req, res) => {
  res.json({ pong: true, timestamp: Date.now() });
});

// API Info endpoint
router.get('/info', (req, res) => {
  res.json({
    success: true,
    api: {
      name: 'Crypto Crash Game Backend',
      version: '1.0.0',
      description: 'Backend API for multiplayer crypto crash game',
      endpoints: {
        game: '/api/game',
        players: '/api/player',
        health: '/api/health',
        ping: '/api/ping'
      },
      websocket: {
        events: {
          client: ['join_game', 'place_bet', 'cash_out'],
          server: ['roundStart', 'multiplierUpdate', 'playerCashout', 'roundCrash', 'betPlaced']
        }
      },
      features: [
        'Real-time multiplayer crash game',
        'Provably fair algorithm',
        'Crypto price integration',
        'WebSocket real-time updates',
        'Transaction history',
        'Player wallet management'
      ]
    }
  });
});

// Mount route modules
router.use('/game', gameRoutes);
router.use('/player', playerRoutes);

// 404 handler for API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'GET /api/ping',
      'GET /api/info',
      'GET /api/game/state',
      'GET /api/game/history',
      'GET /api/game/prices',
      'POST /api/game/bet',
      'POST /api/game/cashout',
      'POST /api/player',
      'GET /api/player/:playerId/wallet',
      'GET /api/player/:playerId/history',
      'PUT /api/player/:playerId/status',
      'GET /api/player'
    ]
  });
});

module.exports = router;
