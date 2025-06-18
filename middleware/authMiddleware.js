// config/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

module.exports = function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  // Expect format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('[AuthMiddleware] ❌ No token provided');
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('[AuthMiddleware] ❌ Missing JWT_SECRET in environment');
    return res.status(500).json({ message: 'Server misconfiguration. JWT secret missing.' });
  }

  try {
    const decoded = jwt.verify(token, secret);

    // Attach user info to the request
    req.user = decoded;

    next(); // Proceed
  } catch (err) {
    console.warn('[AuthMiddleware] ❌ Invalid or expired token:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};


