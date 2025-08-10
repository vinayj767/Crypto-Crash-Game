const { Player, Transaction } = require('../models');
const cryptoPrices = require('../utils/cryptoPrices');

// Create a new player
const createPlayer = async (req, res) => {
  try {
    const { playerId, name, initialBtcBalance = 0.001, initialEthBalance = 0.1 } = req.body;

    // Check if player already exists
    const existingPlayer = await Player.findByPlayerId(playerId);
    if (existingPlayer) {
      return res.status(400).json({
        success: false,
        message: 'Player ID already exists'
      });
    }

    // Get current crypto prices
    const prices = await cryptoPrices.getCurrentPrices();

    // Create new player
    const player = new Player({
      playerId,
      name,
      wallets: {
        BTC: {
          balance: initialBtcBalance,
          usdValue: initialBtcBalance * prices.BTC
        },
        ETH: {
          balance: initialEthBalance,
          usdValue: initialEthBalance * prices.ETH
        }
      },
      isOnline: true
    });

    await player.save();

    // Create initial deposit transactions
    if (initialBtcBalance > 0) {
      const btcTransaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        playerId,
        type: 'deposit',
        currency: 'BTC',
        amount: initialBtcBalance,
        amountUsd: initialBtcBalance * prices.BTC,
        cryptoPrice: prices.BTC,
        balanceBefore: 0,
        balanceAfter: initialBtcBalance,
        blockchainHash: Transaction.generateBlockchainHash(),
        sender: 'system',
        receiver: playerId,
        metadata: { notes: 'Initial deposit' }
      });
      await btcTransaction.save();
    }

    if (initialEthBalance > 0) {
      const ethTransaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        playerId,
        type: 'deposit',
        currency: 'ETH',
        amount: initialEthBalance,
        amountUsd: initialEthBalance * prices.ETH,
        cryptoPrice: prices.ETH,
        balanceBefore: 0,
        balanceAfter: initialEthBalance,
        blockchainHash: Transaction.generateBlockchainHash(),
        sender: 'system',
        receiver: playerId,
        metadata: { notes: 'Initial deposit' }
      });
      await ethTransaction.save();
    }

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      data: {
        playerId: player.playerId,
        name: player.name,
        wallets: player.wallets,
        totalUsdValue: player.totalUsdValue,
        createdAt: player.createdAt
      }
    });

  } catch (error) {
    console.error('Error in createPlayer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create player',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get player wallet information
const getPlayerWallet = async (req, res) => {
  try {
    const { playerId } = req.params;

    const player = await Player.findByPlayerId(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Update USD values with current prices
    const prices = await cryptoPrices.getCurrentPrices();
    player.wallets.BTC.usdValue = player.wallets.BTC.balance * prices.BTC;
    player.wallets.ETH.usdValue = player.wallets.ETH.balance * prices.ETH;
    player.totalUsdValue = player.wallets.BTC.usdValue + player.wallets.ETH.usdValue;

    await player.save();

    res.json({
      success: true,
      data: {
        playerId: player.playerId,
        name: player.name,
        wallets: player.wallets,
        totalUsdValue: player.totalUsdValue,
        statistics: player.statistics,
        lastActive: player.lastActive,
        isOnline: player.isOnline
      }
    });

  } catch (error) {
    console.error('Error in getPlayerWallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player wallet',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get player transaction history
const getPlayerHistory = async (req, res) => {
  try {
    const { playerId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    // Check if player exists
    const player = await Player.findByPlayerId(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Get transaction history
    const transactions = await Transaction.find({ playerId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    const totalTransactions = await Transaction.countDocuments({ playerId });

    res.json({
      success: true,
      data: {
        transactions: transactions.map(tx => tx.toAPIResponse()),
        pagination: {
          total: totalTransactions,
          limit,
          offset,
          hasMore: offset + limit < totalTransactions
        }
      }
    });

  } catch (error) {
    console.error('Error in getPlayerHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get player history',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update player online status
const updatePlayerStatus = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { isOnline } = req.body;

    const player = await Player.findByPlayerId(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    player.isOnline = isOnline;
    player.lastActive = new Date();
    await player.save();

    res.json({
      success: true,
      message: 'Player status updated',
      data: {
        playerId: player.playerId,
        isOnline: player.isOnline,
        lastActive: player.lastActive
      }
    });

  } catch (error) {
    console.error('Error in updatePlayerStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update player status',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all players (for admin/debugging)
const getAllPlayers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const players = await Player.find()
      .sort({ lastActive: -1 })
      .limit(limit)
      .skip(offset)
      .select('playerId name totalUsdValue isOnline lastActive statistics');

    const totalPlayers = await Player.countDocuments();

    res.json({
      success: true,
      data: {
        players,
        pagination: {
          total: totalPlayers,
          limit,
          offset,
          hasMore: offset + limit < totalPlayers
        }
      }
    });

  } catch (error) {
    console.error('Error in getAllPlayers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get players',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  createPlayer,
  getPlayerWallet,
  getPlayerHistory,
  updatePlayerStatus,
  getAllPlayers
};
