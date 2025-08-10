const { Round, Player, Transaction } = require('../models');
const provablyFair = require('../utils/provablyFair');
const cryptoPrices = require('../utils/cryptoPrices');

class GameService {
  constructor() {
    this.currentRound = null;
    this.roundNumber = 1;
    this.gameState = 'waiting'; // waiting, active, crashed
    this.multiplier = 1.0;
    this.startTime = null;
    this.roundInterval = null;
    this.multiplierInterval = null;
    this.socketServer = null;
    
    // Game configuration
    this.roundDuration = parseInt(process.env.GAME_ROUND_DURATION) || 10000; // 10 seconds
    this.multiplierUpdateInterval = parseInt(process.env.MULTIPLIER_UPDATE_INTERVAL) || 100; // 100ms
  }

  // Initialize game service
  async initialize(socketServer) {
    this.socketServer = socketServer;
    
    try {
      // Get the latest round number from database
      const latestRound = await Round.findOne().sort({ startTime: -1 });
      if (latestRound) {
        this.roundNumber = parseInt(latestRound.roundId.split('_')[1]) + 1;
      }

      // Start price updates
      cryptoPrices.startPriceUpdates();
      
      console.log('Game service initialized, starting first round...');
      await this.startNewRound();
      
    } catch (error) {
      console.error('Failed to initialize game service:', error);
      throw error;
    }
  }

  // Start a new game round
  async startNewRound() {
    try {
      // End current round if exists
      if (this.currentRound) {
        await this.endCurrentRound();
      }

      // Clear any existing intervals
      if (this.roundInterval) clearTimeout(this.roundInterval);
      if (this.multiplierInterval) clearInterval(this.multiplierInterval);

      // Generate round data
      const roundData = provablyFair.generateRoundData(this.roundNumber);
      const prices = await cryptoPrices.getCurrentPrices();

      // Create new round in database
      this.currentRound = new Round({
        roundId: `round_${this.roundNumber}`,
        startTime: new Date(),
        crashPoint: roundData.crashPoint,
        seed: roundData.seed,
        hash: roundData.hash,
        isActive: true,
        cryptoPrices: {
          BTC: prices.BTC,
          ETH: prices.ETH
        }
      });

      await this.currentRound.save();

      // Reset game state
      this.gameState = 'active';
      this.multiplier = 1.0;
      this.startTime = Date.now();

      // Broadcast round start
      this.socketServer.emit('roundStart', {
        roundId: this.currentRound.roundId,
        roundNumber: this.roundNumber,
        hash: this.currentRound.hash,
        cryptoPrices: this.currentRound.cryptoPrices,
        timestamp: this.startTime
      });

      console.log(`Round ${this.roundNumber} started - Crash Point: ${roundData.crashPoint}x`);

      // Start multiplier updates
      this.startMultiplierUpdates();

      // Schedule round end
      this.roundInterval = setTimeout(() => {
        this.crashRound();
      }, this.roundDuration);

      this.roundNumber++;

    } catch (error) {
      console.error('Failed to start new round:', error);
      // Retry after 5 seconds
      setTimeout(() => this.startNewRound(), 5000);
    }
  }

  // Start multiplier updates
  startMultiplierUpdates() {
    this.multiplierInterval = setInterval(() => {
      if (this.gameState === 'active') {
        const currentTime = Date.now();
        this.multiplier = provablyFair.calculateMultiplier(this.startTime, currentTime);

        // Check if we've reached crash point
        if (this.multiplier >= this.currentRound.crashPoint) {
          this.crashRound();
          return;
        }

        // Broadcast multiplier update
        this.socketServer.emit('multiplierUpdate', {
          multiplier: this.multiplier,
          timestamp: currentTime
        });
      }
    }, this.multiplierUpdateInterval);
  }

  // Crash the current round
  async crashRound() {
    if (this.gameState !== 'active') return;

    try {
      this.gameState = 'crashed';
      
      // Clear intervals
      if (this.multiplierInterval) clearInterval(this.multiplierInterval);
      if (this.roundInterval) clearTimeout(this.roundInterval);

      // Set final multiplier to crash point
      this.multiplier = this.currentRound.crashPoint;

      // Broadcast crash
      this.socketServer.emit('roundCrash', {
        roundId: this.currentRound.roundId,
        crashPoint: this.currentRound.crashPoint,
        finalMultiplier: this.multiplier,
        timestamp: Date.now()
      });

      console.log(`Round ${this.currentRound.roundId} crashed at ${this.currentRound.crashPoint}x`);

      // Wait 3 seconds before starting new round
      setTimeout(() => {
        this.startNewRound();
      }, 3000);

    } catch (error) {
      console.error('Error during round crash:', error);
    }
  }

  // End current round
  async endCurrentRound() {
    if (!this.currentRound) return;

    try {
      this.currentRound.isActive = false;
      this.currentRound.endTime = new Date();
      this.currentRound.finalMultiplier = this.multiplier;
      
      await this.currentRound.save();

    } catch (error) {
      console.error('Error ending current round:', error);
    }
  }

  // Place a bet
  async placeBet(playerId, betAmountUsd, currency) {
    if (this.gameState !== 'active') {
      throw new Error('No active round for betting');
    }

    if (!cryptoPrices.isValidCurrency(currency)) {
      throw new Error('Invalid currency');
    }

    if (betAmountUsd < 0.01) {
      throw new Error('Minimum bet is $0.01');
    }

    try {
      // Get current crypto price
      const cryptoPrice = await cryptoPrices.getPrice(currency);
      const betAmountCrypto = cryptoPrices.usdToCrypto(betAmountUsd, cryptoPrice);

      // Get player
      const player = await Player.findByPlayerId(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Check if player has sufficient balance
      if (player.wallets[currency].balance < betAmountCrypto) {
        throw new Error('Insufficient balance');
      }

      // Check if player already has a bet in this round
      const existingBet = this.currentRound.bets.find(bet => bet.playerId === playerId);
      if (existingBet) {
        throw new Error('Player already has a bet in this round');
      }

      // Deduct from player balance
      player.wallets[currency].balance -= betAmountCrypto;
      player.wallets[currency].usdValue = player.wallets[currency].balance * cryptoPrice;
      player.statistics.totalBets += 1;
      player.statistics.totalWagered += betAmountUsd;
      
      await player.save();

      // Add bet to round
      const betData = {
        playerId,
        currency,
        betAmountUsd,
        betAmountCrypto,
        cryptoPrice,
        cashedOut: false,
        placedAt: new Date()
      };

      this.currentRound.addBet(betData);
      await this.currentRound.save();

      // Create transaction record
      const transaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        playerId,
        type: 'bet',
        currency,
        amount: -betAmountCrypto,
        amountUsd: betAmountUsd,
        cryptoPrice,
        balanceBefore: player.wallets[currency].balance + betAmountCrypto,
        balanceAfter: player.wallets[currency].balance,
        roundId: this.currentRound.roundId,
        blockchainHash: Transaction.generateBlockchainHash(),
        status: 'confirmed'
      });

      await transaction.save();

      // Broadcast bet placement
      this.socketServer.emit('betPlaced', {
        playerId,
        currency,
        betAmountUsd,
        betAmountCrypto,
        roundId: this.currentRound.roundId,
        timestamp: Date.now()
      });

      return {
        success: true,
        bet: betData,
        newBalance: player.wallets[currency].balance,
        newBalanceUsd: player.wallets[currency].usdValue
      };

    } catch (error) {
      console.error('Error placing bet:', error);
      throw error;
    }
  }

  // Cash out bet
  async cashOut(playerId) {
    if (this.gameState !== 'active') {
      throw new Error('No active round for cashout');
    }

    try {
      // Find player's bet in current round
      const bet = this.currentRound.bets.find(b => b.playerId === playerId && !b.cashedOut);
      if (!bet) {
        throw new Error('No active bet found for player');
      }

      // Get current crypto price
      const cryptoPrice = await cryptoPrices.getPrice(bet.currency);

      // Cash out the bet
      const cashedOutBet = this.currentRound.cashOutBet(playerId, this.multiplier, cryptoPrice);
      if (!cashedOutBet) {
        throw new Error('Failed to cash out bet');
      }

      await this.currentRound.save();

      // Update player balance
      const player = await Player.findByPlayerId(playerId);
      player.wallets[bet.currency].balance += cashedOutBet.winAmount;
      player.wallets[bet.currency].usdValue = player.wallets[bet.currency].balance * cryptoPrice;
      player.statistics.totalWins += 1;
      player.statistics.totalWon += cashedOutBet.winAmountUsd;
      
      if (cashedOutBet.winAmountUsd > player.statistics.biggestWin) {
        player.statistics.biggestWin = cashedOutBet.winAmountUsd;
      }

      await player.save();

      // Create transaction record
      const transaction = new Transaction({
        transactionId: Transaction.generateTransactionId(),
        playerId,
        type: 'cashout',
        currency: bet.currency,
        amount: cashedOutBet.winAmount,
        amountUsd: cashedOutBet.winAmountUsd,
        cryptoPrice,
        balanceBefore: player.wallets[bet.currency].balance - cashedOutBet.winAmount,
        balanceAfter: player.wallets[bet.currency].balance,
        roundId: this.currentRound.roundId,
        blockchainHash: Transaction.generateBlockchainHash(),
        metadata: {
          multiplier: cashedOutBet.cashoutMultiplier
        },
        status: 'confirmed'
      });

      await transaction.save();

      // Broadcast cashout
      this.socketServer.emit('playerCashout', {
        playerId,
        currency: bet.currency,
        multiplier: cashedOutBet.cashoutMultiplier,
        winAmount: cashedOutBet.winAmount,
        winAmountUsd: cashedOutBet.winAmountUsd,
        roundId: this.currentRound.roundId,
        timestamp: Date.now()
      });

      return {
        success: true,
        multiplier: cashedOutBet.cashoutMultiplier,
        winAmount: cashedOutBet.winAmount,
        winAmountUsd: cashedOutBet.winAmountUsd,
        newBalance: player.wallets[bet.currency].balance,
        newBalanceUsd: player.wallets[bet.currency].usdValue
      };

    } catch (error) {
      console.error('Error cashing out:', error);
      throw error;
    }
  }

  // Get current game state
  getCurrentState() {
    return {
      gameState: this.gameState,
      currentRound: this.currentRound ? {
        roundId: this.currentRound.roundId,
        hash: this.currentRound.hash,
        isActive: this.currentRound.isActive,
        cryptoPrices: this.currentRound.cryptoPrices
      } : null,
      multiplier: this.multiplier,
      startTime: this.startTime,
      timestamp: Date.now()
    };
  }

  // Get recent round history
  async getRoundHistory(limit = 10) {
    try {
      return await Round.getRecentRounds(limit);
    } catch (error) {
      console.error('Error getting round history:', error);
      return [];
    }
  }

  // Shutdown game service
  shutdown() {
    if (this.roundInterval) clearTimeout(this.roundInterval);
    if (this.multiplierInterval) clearInterval(this.multiplierInterval);
    
    if (this.currentRound) {
      this.endCurrentRound();
    }
    
    console.log('Game service shutdown completed');
  }
}

// Export singleton instance
module.exports = new GameService();
