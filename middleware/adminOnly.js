// config/middleware/adminOnly.js

module.exports = function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    console.warn('[AdminOnly] Unauthorized access attempt.');
    return res.status(403).json({ message: 'Admin access only.' });
  }
  next();
};
