const rateLimit = require('express-rate-limit');

// Applies to login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 attempts per window per IP
  message: {
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
