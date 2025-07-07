const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const nodemailer = require("nodemailer");

// Create transporter using SMTP creds from .env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: false, // set to true if you use port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send email using Nodemailer transporter
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

// ✅ Request reset code
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Email not found" });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await PasswordReset.deleteMany({ email }); // Remove old codes
  await PasswordReset.create({ email, code, expiresAt });

  await sendEmail(
    email,
    "SpecLode Password Reset Code",
    `Your reset code is: ${code}`
  );

  res.json({ message: "Reset code sent" });
});

// ✅ Confirm code and update password
router.post("/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body;
  const record = await PasswordReset.findOne({ email, code });

  if (!record || record.expiresAt < new Date()) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email }, { password: hashed });
  await PasswordReset.deleteMany({ email }); // Clean up used code

  res.json({ message: "Password successfully reset" });
});

module.exports = router;

