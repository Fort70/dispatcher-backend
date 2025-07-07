const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// ✅ Replace with your real MongoDB connection string if different
//mongoose.connect("mongodb://specuser2:StickFigureVFort70B05T09@localhost:27017/test?authSource=admin", {
  //useNewUrlParser: true,
  //useUnifiedTopology: true
//});

const updatePassword = async () => {
  try {
    // ✅ Change the new password here
    const newHashedPassword = await bcrypt.hash("Test123!", 10);

    const updated = await User.findOneAndUpdate(
      { email: "nitroflat@gmail.com" },
      { password: newHashedPassword }
    );

    if (updated) {
      console.log("✅ Password updated.");
    } else {
      console.log("❌ User not found.");
    }
  } catch (err) {
    console.error("❌ Error updating password:", err.message);
  } finally {
    mongoose.disconnect();
  }
};

updatePassword();
