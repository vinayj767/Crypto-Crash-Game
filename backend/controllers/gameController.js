const gameService = require('../services/gameService');
const { Player } = require('../models');
const cryptoPrices = require('../utils/cryptoPrices');

// Place a bet
const placeBet = async (req, res) => {
  try {
    const { playerId, betAmountUsd, currency } = req.body;

    const result = await gameService.placeBet(playerId, betAmountUsd, currency);

    res.json({
      success: true,
      message: 'Bet placed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in placeBet:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Cash out bet
const cashOut = async (req, res) => {
  try {
    const { playerId } = req.body;

    const result = await gameService.cashOut(playerId);

    res.json({
      success: true,
      message: 'Cashed out successfully',
      data: result
    });

  } catch (error) {
    console.error('Error in cashOut:', error);
    res.status(400).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get current game state
const getGameState = async (req, res) => {
  try {
    const state = gameService.getCurrentState();
    const prices = await cryptoPrices.getCurrentPrices();

    res.json({
      success: true,
      data: {
        ...state,
        cryptoPrices: prices
      }
    });

  } catch (error) {
    console.error('Error in getGameState:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get game state',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get round history
const getRoundHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await gameService.getRoundHistory(limit);

    res.json({
      success: true,
      data: {
        rounds: history,
        total: history.length
      }
    });

  } catch (error) {
    console.error('Error in getRoundHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get round history',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get crypto prices
const getCryptoPrices = async (req, res) => {
  try {
    const prices = await cryptoPrices.getCurrentPrices();
    const priceChange = await cryptoPrices.getPriceChange24h();

    res.json({
      success: true,
      data: {
        prices,
        priceChange24h: priceChange,
        lastUpdate: prices.timestamp
      }
    });

  } catch (error) {
    console.error('Error in getCryptoPrices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get crypto prices',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  placeBet,
  cashOut,
  getGameState,
  getRoundHistory,
  getCryptoPrices
};
