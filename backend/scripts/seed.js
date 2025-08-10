require('dotenv').config();

const mongoose = require('mongoose');
const { Player, Round, Transaction } = require('../models');
const provablyFair = require('../utils/provablyFair');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-crash-game';

// Sample player data
const samplePlayers = [
  {
    playerId: 'alice_crypto',
    name: 'Alice Cooper',
    btcBalance: 0.005,
    ethBalance: 0.2
  },
  {
    playerId: 'bob_trader',
    name: 'Bob Johnson',
    btcBalance: 0.003,
    ethBalance: 0.15
  },
  {
    playerId: 'charlie_whale',
    name: 'Charlie Wilson',
    btcBalance: 0.01,
    ethBalance: 0.5
  },
  {
    playerId: 'diana_lucky',
    name: 'Diana Prince',
    btcBalance: 0.002,
    ethBalance: 0.1
  },
  {
    playerId: 'eve_gamer',
    name: 'Eve Adams',
    btcBalance: 0.004,
    ethBalance: 0.25
  }
];

// Sample crypto prices (mock data)
const mockPrices = {
  BTC: 60000,
  ETH: 3000
};

async function clearDatabase() {
  console.log('🗑️  Clearing existing data...');
  
  await Promise.all([
    Player.deleteMany({}),
    Round.deleteMany({}),
    Transaction.deleteMany({})
  ]);
  
  console.log('✅ Database cleared');
}

async function createPlayers() {
  console.log('👥 Creating sample players...');
  
  const players = [];
  
  for (const playerData of samplePlayers) {
    const btcUsdValue = playerData.btcBalance * mockPrices.BTC;
    const ethUsdValue = playerData.ethBalance * mockPrices.ETH;
    
    const player = new Player({
      playerId: playerData.playerId,
      name: playerData.name,
      wallets: {
        BTC: {
          balance: playerData.btcBalance,
          usdValue: btcUsdValue
        },
        ETH: {
          balance: playerData.ethBalance,
          usdValue: ethUsdValue
        }
      },
      statistics: {
        totalBets: Math.floor(Math.random() * 50) + 10,
        totalWins: Math.floor(Math.random() * 30) + 5,
        totalLosses: Math.floor(Math.random() * 20) + 3,
        biggestWin: Math.random() * 500 + 50,
        biggestLoss: Math.random() * 200 + 20,
        totalWagered: Math.random() * 2000 + 500,
        totalWon: Math.random() * 1800 + 400
      },
      isOnline: Math.random() > 0.5,
      lastActive: new Date(Date.now() - Math.random() * 86400000) // Random time in last 24 hours
    });
    
    await player.save();
    players.push(player);
    
    // Create initial deposit transactions
    const btcTransaction = new Transaction({
      transactionId: `seed_${Transaction.generateTransactionId()}`,
      playerId: playerData.playerId,
      type: 'deposit',
      currency: 'BTC',
      amount: playerData.btcBalance,
      amountUsd: btcUsdValue,
      cryptoPrice: mockPrices.BTC,
      balanceBefore: 0,
      balanceAfter: playerData.btcBalance,
      blockchainHash: Transaction.generateBlockchainHash(),
      sender: 'system',
      receiver: playerData.playerId,
      metadata: { notes: 'Initial seed deposit' },
      createdAt: new Date(Date.now() - Math.random() * 86400000)
    });
    
    const ethTransaction = new Transaction({
      transactionId: `seed_${Transaction.generateTransactionId()}`,
      playerId: playerData.playerId,
      type: 'deposit',
      currency: 'ETH',
      amount: playerData.ethBalance,
      amountUsd: ethUsdValue,
      cryptoPrice: mockPrices.ETH,
      balanceBefore: 0,
      balanceAfter: playerData.ethBalance,
      blockchainHash: Transaction.generateBlockchainHash(),
      sender: 'system',
      receiver: playerData.playerId,
      metadata: { notes: 'Initial seed deposit' },
      createdAt: new Date(Date.now() - Math.random() * 86400000)
    });
    
    await Promise.all([btcTransaction.save(), ethTransaction.save()]);
  }
  
  console.log(`✅ Created ${players.length} players`);
  return players;
}

async function createSampleRounds(players) {
  console.log('🎮 Creating sample game rounds...');
  
  const rounds = [];
  const roundCount = 15;
  
  for (let i = 1; i <= roundCount; i++) {
    const roundNumber = 1000 + i;
    const roundData = provablyFair.generateRoundData(roundNumber);
    
    // Create round with some random historical time
    const roundStartTime = new Date(Date.now() - (roundCount - i + 1) * 15000); // 15 seconds apart
    const roundEndTime = new Date(roundStartTime.getTime() + 10000); // 10 second rounds
    
    const round = new Round({
      roundId: `round_${roundNumber}`,
      startTime: roundStartTime,
      endTime: roundEndTime,
      crashPoint: roundData.crashPoint,
      finalMultiplier: roundData.crashPoint,
      seed: roundData.seed,
      hash: roundData.hash,
      isActive: false,
      cryptoPrices: mockPrices,
      bets: []
    });
    
    // Add some random bets to the round
    const numBets = Math.floor(Math.random() * 4) + 1; // 1-4 bets per round
    const roundPlayers = players.sort(() => 0.5 - Math.random()).slice(0, numBets);
    
    for (const player of roundPlayers) {
      const currency = Math.random() > 0.5 ? 'BTC' : 'ETH';
      const betAmountUsd = Math.random() * 100 + 10; // $10-$110
      const betAmountCrypto = betAmountUsd / mockPrices[currency];
      const cryptoPrice = mockPrices[currency];
      
      // Determine if player cashed out
      const cashedOut = Math.random() > 0.3; // 70% chance of cashing out
      let cashoutMultiplier = null;
      let winAmount = 0;
      let winAmountUsd = 0;
      
      if (cashedOut) {
        // Random cashout between 1.1x and crash point
        const maxCashout = Math.max(1.1, Math.min(roundData.crashPoint - 0.1, roundData.crashPoint * 0.8));
        cashoutMultiplier = Math.max(1.1, Math.random() * (maxCashout - 1.1) + 1.1);
        winAmount = betAmountCrypto * cashoutMultiplier;
        winAmountUsd = winAmount * cryptoPrice;
      }
      
      const bet = {
        playerId: player.playerId,
        currency,
        betAmountUsd,
        betAmountCrypto,
        cryptoPrice,
        cashedOut,
        cashoutMultiplier,
        cashoutTime: cashedOut ? new Date(roundStartTime.getTime() + Math.random() * 9000) : null,
        winAmount,
        winAmountUsd,
        placedAt: new Date(roundStartTime.getTime() + Math.random() * 1000)
      };
      
      round.bets.push(bet);
      
      // Create transaction records
      const betTransaction = new Transaction({
        transactionId: `seed_${Transaction.generateTransactionId()}`,
        playerId: player.playerId,
        type: 'bet',
        currency,
        amount: -betAmountCrypto,
        amountUsd: betAmountUsd,
        cryptoPrice,
        balanceBefore: player.wallets[currency].balance,
        balanceAfter: player.wallets[currency].balance - betAmountCrypto,
        roundId: round.roundId,
        blockchainHash: Transaction.generateBlockchainHash(),
        status: 'confirmed',
        createdAt: bet.placedAt
      });
      
      await betTransaction.save();
      
      if (cashedOut) {
        const cashoutTransaction = new Transaction({
          transactionId: `seed_${Transaction.generateTransactionId()}`,
          playerId: player.playerId,
          type: 'cashout',
          currency,
          amount: winAmount,
          amountUsd: winAmountUsd,
          cryptoPrice,
          balanceBefore: player.wallets[currency].balance - betAmountCrypto,
          balanceAfter: player.wallets[currency].balance - betAmountCrypto + winAmount,
          roundId: round.roundId,
          blockchainHash: Transaction.generateBlockchainHash(),
          metadata: { multiplier: cashoutMultiplier },
          status: 'confirmed',
          createdAt: bet.cashoutTime
        });
        
        await cashoutTransaction.save();
      }
    }
    
    await round.save();
    rounds.push(round);
  }
  
  console.log(`✅ Created ${rounds.length} sample rounds`);
  return rounds;
}

async function updatePlayerStats(players) {
  console.log('📊 Updating player statistics...');
  
  for (const player of players) {
    // Get player's transactions
    const transactions = await Transaction.find({ playerId: player.playerId });
    
    const bets = transactions.filter(tx => tx.type === 'bet');
    const cashouts = transactions.filter(tx => tx.type === 'cashout');
    
    player.statistics.totalBets = bets.length;
    player.statistics.totalWins = cashouts.length;
    player.statistics.totalLosses = bets.length - cashouts.length;
    player.statistics.totalWagered = bets.reduce((sum, bet) => sum + bet.amountUsd, 0);
    player.statistics.totalWon = cashouts.reduce((sum, cashout) => sum + cashout.amountUsd, 0);
    
    if (cashouts.length > 0) {
      player.statistics.biggestWin = Math.max(...cashouts.map(c => c.amountUsd));
    }
    
    if (bets.length > 0) {
      player.statistics.biggestLoss = Math.max(...bets.map(b => b.amountUsd));
    }
    
    await player.save();
  }
  
  console.log('✅ Updated player statistics');
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    console.log(`📡 Connecting to MongoDB: ${MONGODB_URI}`);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear existing data
    await clearDatabase();
    
    // Create sample data
    const players = await createPlayers();
    const rounds = await createSampleRounds(players);
    
    // Update player statistics based on transactions
    await updatePlayerStats(players);
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📈 Summary:');
    console.log(`   👥 Players: ${players.length}`);
    console.log(`   🎮 Rounds: ${rounds.length}`);
    console.log(`   💰 Transactions: ${await Transaction.countDocuments()}`);
    
    console.log('\n🚀 You can now start the server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  clearDatabase,
  createPlayers,
  createSampleRounds
};

