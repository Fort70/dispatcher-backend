const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const User = require("../models/User"); // ← adjust this if you move it to /models later
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// GET /api/user — return current user info
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("email userPlan status createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      email: user.email,
      userPlan: user.userPlan,
      status: user.status,
      joined: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/users/login — authenticate and return a JWT

router.post('/login', async (req, res) => {
  console.log('🔑 Login attempt:', req.body);
  const { email, password } = req.body;   // grab both once

  // guard against missing inputs
  if (!email || !password) {
    return res.status(400).json({ message: 'Missing email or password' });
  }

  const user = await User.findOne({ email });
  console.log('👤 Found user hash:', user && user.password ? user.password : 'no user');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const match = await bcrypt.compare(password, user.password);
  console.log('🧮 bcrypt.compare result:', match);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  res.json({ token });
});

// All routes below this line require a valid JWT
router.use(authenticateToken);

module.exports = router;
