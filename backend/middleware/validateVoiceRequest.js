/**
 * AI Voice Assistant Request Validation & Rate Limiting Middleware
 * Validates audio file uploads, text inputs, and safeguards against API abuse.
 */

const multer = require('multer');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configure Multer memory storage for direct audio buffer processing
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/mp3',
    'audio/mpeg',
    'audio/ogg',
    'audio/aac',
    'audio/flac',
    'application/octet-stream' // Browsers sometimes report generic stream for recorded Blobs
  ];

  if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported audio format (${file.mimetype}). Please upload WAV, WebM, MP3 or OGG.`), false);
  }
};

const uploadAudio = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
    files: 1,
  },
  fileFilter,
});

/**
 * In-memory sliding window rate limiter for AI endpoints
 */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

const aiRateLimiter = (req, res, next) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();

  let clientData = rateLimitMap.get(clientIp);
  if (!clientData || now - clientData.startTime > RATE_LIMIT_WINDOW_MS) {
    clientData = { startTime: now, count: 1 };
    rateLimitMap.set(clientIp, clientData);
    return next();
  }

  clientData.count++;
  if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please wait a moment before sending more voice/chat queries.',
    });
  }

  next();
};

/**
 * Optional Authentication:
 * Extracts user if token is provided, but allows unauthenticated guests to use public assistant queries
 */
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'agriconnect_super_secret_jwt_key_2026_production_grade'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Token expired or invalid, proceed as unauthenticated guest
      req.user = null;
    }
  }
  next();
};

module.exports = {
  uploadAudio,
  aiRateLimiter,
  optionalAuth,
};
