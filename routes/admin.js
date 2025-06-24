// ✅ Load Required Modules
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Load Middleware
const { authenticateToken, verifyAdminApiKey } = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminOnly");
const loginLimiter = require("../middleware/rateLimiter");


// ✅ Admin Login (NO verifyAdminApiKey here — allow login to proceed with correct credentials)
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    console.log("➡️ Login attempt for:", normalizedEmail);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    console.log("🔑 Raw password from login form:", password);
    console.log("🔐 Hashed password from DB:", user.password);

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
  } catch (err) {
    console.error("🔥 Login error:", err);
    res.status(500).json({ message: "Server error" });
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
    const user = await User.findOne({ email: normalizedEmail });
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



