const mongoose = require('mongoose');

const betSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    index: true
  },
  currency: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH']
  },
  betAmountUsd: {
    type: Number,
    required: true,
    min: 0.01
  },
  betAmountCrypto: {
    type: Number,
    required: true,
    min: 0
  },
  cryptoPrice: {
    type: Number,
    required: true,
    min: 0
  },
  cashedOut: {
    type: Boolean,
    default: false
  },
  cashoutMultiplier: {
    type: Number,
    default: null,
    min: 1
  },
  cashoutTime: {
    type: Date,
    default: null
  },
  winAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  winAmountUsd: {
    type: Number,
    default: 0,
    min: 0
  },
  placedAt: {
    type: Date,
    default: Date.now
  }
});

const roundSchema = new mongoose.Schema({
  roundId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  crashPoint: {
    type: Number,
    required: true,
    min: 1
  },
  finalMultiplier: {
    type: Number,
    default: null,
    min: 1
  },
  seed: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bets: [betSchema],
  totalBetsUsd: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPayoutsUsd: {
    type: Number,
    default: 0,
    min: 0
  },
  houseEdge: {
    type: Number,
    default: 0
  },
  cryptoPrices: {
    BTC: { type: Number, required: true },
    ETH: { type: Number, required: true }
  }
});

// Indexes for better query performance
roundSchema.index({ roundId: 1 });
roundSchema.index({ startTime: -1 });
roundSchema.index({ isActive: 1 });
roundSchema.index({ 'bets.playerId': 1 });

// Pre-save middleware to calculate totals
roundSchema.pre('save', function(next) {
  if (this.bets && this.bets.length > 0) {
    this.totalBetsUsd = this.bets.reduce((sum, bet) => sum + bet.betAmountUsd, 0);
    this.totalPayoutsUsd = this.bets
      .filter(bet => bet.cashedOut)
      .reduce((sum, bet) => sum + bet.winAmountUsd, 0);
    this.houseEdge = this.totalBetsUsd - this.totalPayoutsUsd;
  }
  next();
});

// Instance method to add bet
roundSchema.methods.addBet = function(betData) {
  this.bets.push(betData);
  return this.bets[this.bets.length - 1];
};

// Instance method to cash out bet
roundSchema.methods.cashOutBet = function(playerId, multiplier, cryptoPrice) {
  const bet = this.bets.find(b => b.playerId === playerId && !b.cashedOut);
  if (bet && this.isActive && multiplier <= this.crashPoint) {
    bet.cashedOut = true;
    bet.cashoutMultiplier = multiplier;
    bet.cashoutTime = new Date();
    bet.winAmount = bet.betAmountCrypto * multiplier;
    bet.winAmountUsd = bet.winAmount * cryptoPrice;
    return bet;
  }
  return null;
};

// Static method to find active round
roundSchema.statics.findActiveRound = function() {
  return this.findOne({ isActive: true });
};

// Static method to get recent rounds
roundSchema.statics.getRecentRounds = function(limit = 10) {
  return this.find({ isActive: false })
    .sort({ startTime: -1 })
    .limit(limit)
    .select('roundId crashPoint startTime endTime totalBetsUsd totalPayoutsUsd');
};

module.exports = mongoose.model('Round', roundSchema);
