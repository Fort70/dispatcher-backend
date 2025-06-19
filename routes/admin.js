const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const loginLimiter = require('../middleware/rateLimiter');


// Admin Login
router.post('/login', loginLimiter, async (req, res) => {

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        userPlan: user.userPlan,
        status: user.status,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });

  }
});

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Ensure password is strong enough
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
if (!passwordRegex.test(password)) {
  return res.status(400).json({ message: 'Password must be at least 8 characters, include an uppercase letter, lowercase letter, and a number.' });
}

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      status: 'active',
      userPlan: 'starter',
      role: 'user'
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'yoursecret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        userPlan: user.userPlan,
        status: user.status,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });

  }
});

// Promote to Admin
router.post('/promote/:email', authenticateToken, adminOnly, async (req, res) => {
  const email = req.params.email.trim().toLowerCase();

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: 'admin' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: `${email} promoted to admin.`, user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });

  }
});

// Dashboard Test
router.get('/dashboard', authenticateToken, adminOnly, (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.email}` });
});

// Lock user
router.post('/lock/:email', authenticateToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email.trim().toLowerCase() },
      { status: 'locked' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User locked.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });

  }
});

// Unlock user
router.post('/unlock/:email', authenticateToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email.trim().toLowerCase() },
      { status: 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User unlocked.', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });

  }
});

// Reset password
router.post('/reset-password', authenticateToken, adminOnly, async (req, res) => {
  const { email, newPassword } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long and include uppercase, lowercase, and a number.'
    });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
