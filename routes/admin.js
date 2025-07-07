// ✅ Load Required Modules
const mongoose = require("mongoose");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.get("/admin/debug-password", async (req, res) => {
  const testPassword = "Test123!";
  const hashFromDB = "$2b$10$rAKm9Nk5o/Po9lp0dy6Jae/jfVSPvVL/MZfw3HsentclsKsXv9Zju"; // use your exact stored hash

  try {
    const match = await bcrypt.compare(testPassword, hashFromDB);
    res.json({ match });
  } catch (err) {
    res.status(500).json({ message: "Error comparing passwords", error: err.message });
  }
});


// ✅ Load Middleware
const { authenticateToken, verifyAdminApiKey } = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const { loginLimiter } = require("../middleware/rateLimiter");

console.log("🔍 loginLimiter type:", typeof loginLimiter, loginLimiter);

// ✅ Admin Login (NO verifyAdminApiKey here — allow login to proceed with correct credentials)
router.post("/login", loginLimiter, async (req, res) => {
	console.log("🔌 Mongoose readyState before findOne:", mongoose.connection.readyState);
	console.log("🔥 Login request received:", req.body);

  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    if (!user.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
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
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


// ✅ Promote User to Admin
router.post("/promote/:email", verifyAdminApiKey, authenticateToken, adminOnly, async (req, res) => {
  const email = req.params.email.trim().toLowerCase();

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: `${email} promoted to admin.`, user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Admin Dashboard Test
router.get("/dashboard", verifyAdminApiKey, authenticateToken, adminOnly, (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.email}` });
});

// ✅ Lock User
router.post("/lock/:email", verifyAdminApiKey, authenticateToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email.trim().toLowerCase() },
      { status: "locked" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User locked.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Unlock User
router.post("/unlock/:email", verifyAdminApiKey, authenticateToken, adminOnly, async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { email: req.params.email.trim().toLowerCase() },
      { status: "active" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User unlocked.", user });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Reset Password
router.post("/reset-password", verifyAdminApiKey, authenticateToken, adminOnly, async (req, res) => {
  const { email, newPassword } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      message: "Password must be at least 8 characters long and include uppercase, lowercase, and a number."
    });
  }

  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password reset successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
