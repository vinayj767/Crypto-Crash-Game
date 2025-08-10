const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  playerId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['bet', 'cashout', 'deposit', 'withdrawal']
  },
  currency: {
    type: String,
    required: true,
    enum: ['BTC', 'ETH']
  },
  amount: {
    type: Number,
    required: true
  },
  amountUsd: {
    type: Number,
    required: true,
    min: 0
  },
  cryptoPrice: {
    type: Number,
    required: true,
    min: 0
  },
  balanceBefore: {
    type: Number,
    required: true,
    min: 0
  },
  balanceAfter: {
    type: Number,
    required: true,
    min: 0
  },
  roundId: {
    type: String,
    default: null,
    index: true
  },
  blockchainHash: {
    type: String,
    required: true
  },
  sender: {
    type: String,
    default: null
  },
  receiver: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'confirmed'
  },
  metadata: {
    multiplier: { type: Number, default: null },
    notes: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Indexes for better query performance
transactionSchema.index({ playerId: 1, createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ roundId: 1 });
transactionSchema.index({ transactionId: 1 });

// Static method to create transaction ID
transactionSchema.statics.generateTransactionId = function() {
  return 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

// Static method to create blockchain hash (mock)
transactionSchema.statics.generateBlockchainHash = function() {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// Static method to get player transaction history
transactionSchema.statics.getPlayerHistory = function(playerId, limit = 50) {
  return this.find({ playerId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get round transactions
transactionSchema.statics.getRoundTransactions = function(roundId) {
  return this.find({ roundId })
    .sort({ createdAt: 1 });
};

// Instance method to format for API response
transactionSchema.methods.toAPIResponse = function() {
  return {
    transactionId: this.transactionId,
    type: this.type,
    currency: this.currency,
    amount: this.amount,
    amountUsd: this.amountUsd,
    cryptoPrice: this.cryptoPrice,
    roundId: this.roundId,
    status: this.status,
    metadata: this.metadata,
    createdAt: this.createdAt,
    blockchainHash: this.blockchainHash
  };
};

module.exports = mongoose.model('Transaction', transactionSchema);
