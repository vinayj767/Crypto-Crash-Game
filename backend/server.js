require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

// Import middleware
const { 
  securityHeaders, 
  globalRateLimit, 
  limitInputSize,
  requestLogger,
  corsOptions,
  securityErrorHandler,
  healthCheckBypass
} = require('./middleware/security');
const { sanitizeInput } = require('./middleware/validation');

// Import routes
const apiRoutes = require('./routes');

// Import services
const gameService = require('./services/gameService');

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure Socket.IO
const io = socketIo(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling']
});

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto-crash-game';

// Middleware setup
app.use(healthCheckBypass);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(globalRateLimit);
app.use(limitInputSize());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(sanitizeInput);

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', (error) => {
  console.error('MongoDB error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`👤 Client connected: ${socket.id}`);

  // Send current game state to new client
  const gameState = gameService.getCurrentState();
  socket.emit('gameState', gameState);

  // Handle player joining
  socket.on('join_game', (data) => {
    try {
      const { playerId } = data;
      if (playerId) {
        socket.playerId = playerId;
        socket.join(`player_${playerId}`);
        console.log(`Player ${playerId} joined the game`);
      }
    } catch (error) {
      console.error('Error in join_game:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  // Handle bet placement via WebSocket
  socket.on('place_bet', async (data) => {
    try {
      const { playerId, betAmountUsd, currency } = data;
      
      if (!playerId || !betAmountUsd || !currency) {
        socket.emit('error', { message: 'Invalid bet data' });
        return;
      }

      const result = await gameService.placeBet(playerId, betAmountUsd, currency);
      
      socket.emit('bet_result', {
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in place_bet:', error);
      socket.emit('bet_result', {
        success: false,
        message: error.message
      });
    }
  });

  // Handle cashout via WebSocket
  socket.on('cash_out', async (data) => {
    try {
      const { playerId } = data;
      
      if (!playerId) {
        socket.emit('error', { message: 'Player ID required' });
        return;
      }

      const result = await gameService.cashOut(playerId);
      
      socket.emit('cashout_result', {
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error in cash_out:', error);
      socket.emit('cashout_result', {
        success: false,
        message: error.message
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`👤 Client disconnected: ${socket.id} (${reason})`);
    
    // Update player status if they were logged in
    if (socket.playerId) {
      const { Player } = require('./models');
      Player.findByPlayerId(socket.playerId)
        .then(player => {
          if (player) {
            player.isOnline = false;
            player.lastActive = new Date();
            return player.save();
          }
        })
        .catch(error => console.error('Error updating player status on disconnect:', error));
    }
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// API Routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Crypto Crash Game Backend API',
    version: '1.0.0',
    documentation: '/api/info',
    health: '/api/health',
    websocket: 'Connect to this same URL with Socket.IO client'
  });
});

// Error handling middleware
app.use(securityErrorHandler);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    suggestion: 'Try /api for API endpoints'
  });
});

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close((err) => {
    if (err) {
      console.error('Error during server close:', err);
      process.exit(1);
    }
    
    console.log('✅ HTTP server closed');
    
    // Close WebSocket connections
    io.close(() => {
      console.log('✅ WebSocket server closed');
      
      // Shutdown game service
      gameService.shutdown();
      
      // Close database connection
      mongoose.connection.close(() => {
        console.log('✅ MongoDB connection closed');
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 WebSocket enabled on the same port`);
  
  // Initialize game service
  gameService.initialize(io)
    .then(() => {
      console.log('✅ Game service initialized');
      console.log('🎮 Crypto Crash Game is ready!');
    })
    .catch((error) => {
      console.error('❌ Failed to initialize game service:', error);
      process.exit(1);
    });
});

// Export for testing
module.exports = { app, server, io };
