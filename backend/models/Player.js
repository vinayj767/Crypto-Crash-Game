const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  wallets: {
    BTC: {
      balance: { type: Number, default: 0, min: 0 },
      usdValue: { type: Number, default: 0, min: 0 }
    },
    ETH: {
      balance: { type: Number, default: 0, min: 0 },
      usdValue: { type: Number, default: 0, min: 0 }
    }
  },
  totalUsdValue: {
    type: Number,
    default: 0,
    min: 0
  },
  statistics: {
    totalBets: { type: Number, default: 0 },
    totalWins: { type: Number, default: 0 },
    totalLosses: { type: Number, default: 0 },
    biggestWin: { type: Number, default: 0 },
    biggestLoss: { type: Number, default: 0 },
    totalWagered: { type: Number, default: 0 },
    totalWon: { type: Number, default: 0 }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  }
});

// Index for better query performance
playerSchema.index({ playerId: 1 });
playerSchema.index({ isOnline: 1 });

// Update lastActive on save
playerSchema.pre('save', function(next) {
  this.lastActive = new Date();
  
  // Calculate total USD value
  this.totalUsdValue = this.wallets.BTC.usdValue + this.wallets.ETH.usdValue;
  
  next();
});

// Instance method to update wallet balance
playerSchema.methods.updateWalletBalance = function(currency, cryptoAmount, usdValue) {
  if (['BTC', 'ETH'].includes(currency)) {
    this.wallets[currency].balance = Math.max(0, cryptoAmount);
    this.wallets[currency].usdValue = Math.max(0, usdValue);
    this.totalUsdValue = this.wallets.BTC.usdValue + this.wallets.ETH.usdValue;
  }
};

// Static method to find by playerId
playerSchema.statics.findByPlayerId = function(playerId) {
  return this.findOne({ playerId });
};

module.exports = mongoose.model('Player', playerSchema);
