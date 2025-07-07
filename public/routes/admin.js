const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const { authenticateToken, verifyAdminApiKey } = require("../middleware/authMiddleware");

// ✅ Admin Login (NO verifyAdminApiKey here — allow login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, email: user.email, userPlan: user.userPlan, status: user.status });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
