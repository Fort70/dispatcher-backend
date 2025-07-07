const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User");

const MONGO_URI = "mongodb://specuser2:StickFigureVFort70B05T09@127.0.0.1:27017/test?authSource=admin";

async function run() {
  //await mongoose.connect(MONGO_URI);

  const hashedPassword = await bcrypt.hash("Test123!", 10);

  const user = new User({
    email: "nitroflat@gmail.com",
    password: hashedPassword,
    userPlan: "pro",
    status: "active",
    role: "admin"
  });

  await user.save();
  console.log("✅ Admin user created:", user);
  process.exit();
}

run();

