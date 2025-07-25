console.log("🔔 PasswordReset routes loaded");

const express  = require("express");
const mongoose = require("mongoose");
const router   = express.Router();
const bcrypt   = require("bcrypt");
const User     = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const sgMail   = require("@sendgrid/mail");

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Ensure DB connection
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    console.log(`🔄 Mongoose not connected (state=${mongoose.connection.readyState}) — reconnecting…`);
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Mongoose re-connected");
  }
}

// Send email via SendGrid
async function sendEmail(to, subject, text) {
  try {
    await sgMail.send({
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject,
      text,
    });
    console.log(`✅ Reset code sent to ${to}`);
  } catch (err) {
    console.error("❌ SendGrid error:", err.response?.body || err);
  }
}

// POST /api/password-reset/request-password-reset
router.post("/request-password-reset", async (req, res) => {
  try {
    await ensureDbConnection();
    console.log("🔔 [passwordReset] request-password-reset called for:", req.body.email);

    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not found" });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await PasswordReset.deleteMany({ email });
    await PasswordReset.create({ email, code, expiresAt });

    await sendEmail(email, "SpecLode Password Reset Code", `Your reset code is: ${code}`);

    return res.json({ message: "Reset code sent" });
  } catch (err) {
    console.error("❌ [passwordReset] request-password-reset error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// POST /api/password-reset/reset-password
router.post("/reset-password", async (req, res) => {
  try {
    await ensureDbConnection();
    console.log("🔔 [passwordReset] reset-password called for:", req.body.email, req.body.code);

    const { email, code, newPassword } = req.body;
    const record = await PasswordReset.findOne({ email, code });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashed });
    await PasswordReset.deleteMany({ email });

    return res.json({ message: "Password successfully reset" });
  } catch (err) {
    console.error("❌ [passwordReset] reset-password error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
