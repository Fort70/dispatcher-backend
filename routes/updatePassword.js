const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

mongoose.connect("mongodb://specuser2:StickFigureVFort70B05T09@localhost:27017/test?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const updatePassword = async () => {
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

  mongoose.disconnect();
};

updatePassword();
