// ✅ JWT and Admin API Key Authentication Middleware
const jwt = require('jsonwebtoken');

// ✅ JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
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
    req.user = decoded;
    console.log("[AuthMiddleware] ✅ Token decoded:", decoded);
    next();
  } catch (err) {
    console.warn('[AuthMiddleware] ❌ Invalid or expired token:', err.message);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

// ✅ Admin API Key Middleware (with trim fix and debug logging)
function verifyAdminApiKey(req, res, next) {
  const providedKey = req.headers['x-api-key']?.trim();
  const expectedKey = process.env.ADMIN_API_KEY?.trim();

  console.log("🔍 Incoming x-api-key:", providedKey);
  console.log("🔐 Expected ADMIN_API_KEY:", expectedKey);
  console.log("🧪 Provided Key: [", providedKey, "] length:", providedKey?.length);
  console.log("🧪 Expected Key: [", expectedKey, "] length:", expectedKey?.length);

  if (!providedKey || providedKey !== expectedKey) {
    console.warn('[AuthMiddleware] ❌ Invalid API Key');
    return res.status(403).json({ message: 'Forbidden: Invalid API Key' });
  }

  next();
}

// ✅ Export both middlewares
module.exports = {
  authenticateToken,
  verifyAdminApiKey
};
