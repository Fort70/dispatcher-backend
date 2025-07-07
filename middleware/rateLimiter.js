
const rateLimit = require('express-rate-limit');

// Applies to login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                  // Max 10 attempts per window per IP
  message: {
    message: 'Too many login attempts. Please try again later.'
  },
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false      // Disable the `X-RateLimit-*` headers
});

// Limit password-reset requests to 5 per 15 minutes
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                   // Limit each IP to 5 requests per window
  message: {
    message: 'Too many password reset requests. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = { loginLimiter, resetLimiter };

