const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../models/User");

mongoose.connect("mongodb://specuser2:StickFigureVFort70B05T09@localhost:27017/test?authSource=admin", {

  useNewUrlParser: true,
  useUnifiedTopology: true
});

const createAdmin = async () => {
  const hashedPassword = await bcrypt.hash("Test123!", 10);

  const user = new User({
    email: "nitroflat@gmail.com",
    password: hashedPassword,
    role: "admin",
    userPlan: "starter",
    status: "active"
  });

  await user.save();
  console.log("✅ Admin user created.");
  mongoose.disconnect();
};

createAdmin();
