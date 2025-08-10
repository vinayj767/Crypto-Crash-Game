const express = require('express');
const router = express.Router();

const gameController = require('../controllers/gameController');
const { validateBet, validateCashout, validatePlayerActionRate } = require('../middleware/validation');
const { bettingRateLimit } = require('../middleware/security');

// Place a bet
router.post('/bet', 
  bettingRateLimit,
  validatePlayerActionRate(5, 60000), // Max 5 bets per minute per player
  validateBet,
  gameController.placeBet
);

// Cash out current bet
router.post('/cashout',
  bettingRateLimit,
  validatePlayerActionRate(10, 60000), // Max 10 cashouts per minute per player
  validateCashout,
  gameController.cashOut
);

// Get current game state
router.get('/state', gameController.getGameState);

// Get round history
router.get('/history', gameController.getRoundHistory);

// Get current crypto prices
router.get('/prices', gameController.getCryptoPrices);

module.exports = router;
