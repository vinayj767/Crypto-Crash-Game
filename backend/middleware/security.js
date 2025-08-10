const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Basic security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Simple IP-based key generator
  keyGenerator: (req) => req.ip
});

// Strict rate limiting for betting actions
const bettingRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 betting actions per minute
  message: {
    success: false,
    message: 'Too many betting actions, please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// API key validation (if implemented)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  // For development, we'll skip API key validation
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key required'
    });
  }
  
  // In production, validate against known API keys
  const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');
  if (!validApiKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key'
    });
  }
  
  next();
};

// Input size limiting
const limitInputSize = (maxSize = '1mb') => {
  return (req, res, next) => {
    if (req.headers['content-length'] && 
        parseInt(req.headers['content-length']) > parseInt(maxSize) * 1024 * 1024) {
      return res.status(413).json({
        success: false,
        message: 'Request payload too large'
      });
    }
    next();
  };
};

// Request logging for monitoring
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      playerId: req.body?.playerId || req.params?.playerId || null
    };
    
    // Log errors and slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      console.error('Request Alert:', logData);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('Request:', logData);
    }
  });
  
  next();
};

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  maxAge: 86400 // 24 hours
};

// Error handling for security middleware
const securityErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation'
    });
  }
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File too large'
    });
  }
  
  next(err);
};

// Health check bypass (no rate limiting)
const healthCheckBypass = (req, res, next) => {
  if (req.path === '/health' || req.path === '/ping') {
    return next('route');
  }
  next();
};

module.exports = {
  securityHeaders,
  globalRateLimit,
  bettingRateLimit,
  validateApiKey,
  limitInputSize,
  requestLogger,
  corsOptions,
  securityErrorHandler,
  healthCheckBypass
};
