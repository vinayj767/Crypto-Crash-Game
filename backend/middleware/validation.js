const { body, param, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Bet validation rules
const validateBet = [
  body('playerId')
    .notEmpty()
    .withMessage('Player ID is required')
    .isString()
    .withMessage('Player ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Player ID must be between 1 and 100 characters'),
  
  body('betAmountUsd')
    .notEmpty()
    .withMessage('Bet amount is required')
    .isFloat({ min: 0.01, max: 10000 })
    .withMessage('Bet amount must be between $0.01 and $10,000'),
  
  body('currency')
    .notEmpty()
    .withMessage('Currency is required')
    .isIn(['BTC', 'ETH'])
    .withMessage('Currency must be BTC or ETH'),
  
  handleValidationErrors
];

// Cashout validation rules
const validateCashout = [
  body('playerId')
    .notEmpty()
    .withMessage('Player ID is required')
    .isString()
    .withMessage('Player ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Player ID must be between 1 and 100 characters'),
  
  handleValidationErrors
];

// Player ID validation for route params
const validatePlayerId = [
  param('playerId')
    .notEmpty()
    .withMessage('Player ID is required')
    .isString()
    .withMessage('Player ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Player ID must be between 1 and 100 characters'),
  
  handleValidationErrors
];

// Player creation validation
const validatePlayerCreation = [
  body('playerId')
    .notEmpty()
    .withMessage('Player ID is required')
    .isString()
    .withMessage('Player ID must be a string')
    .isLength({ min: 3, max: 50 })
    .withMessage('Player ID must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Player ID can only contain letters, numbers, underscores and hyphens'),
  
  body('name')
    .notEmpty()
    .withMessage('Player name is required')
    .isString()
    .withMessage('Player name must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Player name must be between 1 and 50 characters')
    .trim(),
  
  body('initialBtcBalance')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Initial BTC balance must be between 0 and 10 BTC'),
  
  body('initialEthBalance')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Initial ETH balance must be between 0 and 100 ETH'),
  
  handleValidationErrors
];

// History query validation
const validateHistoryQuery = [
  param('playerId')
    .optional()
    .isString()
    .withMessage('Player ID must be a string')
    .isLength({ min: 1, max: 100 })
    .withMessage('Player ID must be between 1 and 100 characters'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  body('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  handleValidationErrors
];

// Sanitize input data
const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS or injection attempts
  const sanitizeString = (str) => {
    if (typeof str === 'string') {
      return str.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return str;
  };

  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);

  next();
};

// Rate limiting per player
const playerActionLimits = new Map();

const validatePlayerActionRate = (maxActions = 10, windowMs = 60000) => {
  return (req, res, next) => {
    const playerId = req.body.playerId || req.params.playerId;
    if (!playerId) {
      return next();
    }

    const now = Date.now();
    const playerKey = `${playerId}_${req.route.path}`;
    
    if (!playerActionLimits.has(playerKey)) {
      playerActionLimits.set(playerKey, []);
    }

    const actions = playerActionLimits.get(playerKey);
    
    // Remove old actions outside the window
    const validActions = actions.filter(actionTime => now - actionTime < windowMs);
    
    if (validActions.length >= maxActions) {
      return res.status(429).json({
        success: false,
        message: 'Too many actions. Please slow down.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    validActions.push(now);
    playerActionLimits.set(playerKey, validActions);
    
    next();
  };
};

module.exports = {
  validateBet,
  validateCashout,
  validatePlayerId,
  validatePlayerCreation,
  validateHistoryQuery,
  sanitizeInput,
  validatePlayerActionRate,
  handleValidationErrors
};
