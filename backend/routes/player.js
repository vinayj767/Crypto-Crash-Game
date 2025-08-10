const express = require('express');
const router = express.Router();

const playerController = require('../controllers/playerController');
const { 
  validatePlayerId, 
  validatePlayerCreation, 
  validateHistoryQuery,
  validatePlayerActionRate 
} = require('../middleware/validation');

// Create a new player
router.post('/',
  validatePlayerActionRate(3, 3600000), // Max 3 player creations per hour per IP
  validatePlayerCreation,
  playerController.createPlayer
);

// Get player wallet information
router.get('/:playerId/wallet',
  validatePlayerId,
  playerController.getPlayerWallet
);

// Get player transaction history
router.get('/:playerId/history',
  validatePlayerId,
  validateHistoryQuery,
  playerController.getPlayerHistory
);

// Update player online status
router.put('/:playerId/status',
  validatePlayerId,
  validatePlayerActionRate(30, 60000), // Max 30 status updates per minute per player
  playerController.updatePlayerStatus
);

// Get all players (for admin/monitoring)
router.get('/',
  validatePlayerActionRate(10, 60000), // Max 10 requests per minute
  playerController.getAllPlayers
);

module.exports = router;
