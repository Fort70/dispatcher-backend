const bcrypt = require("bcrypt");
const User = require("../models/User");

// ✅ Update user password by ID
async function updatePassword(userId, newPassword) {
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(userId, { password: hashedPassword });
}

module.exports = updatePassword;
