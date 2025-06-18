const mongoose = require("mongoose");
const User = require("./models/User");

// Replace with your actual MongoDB connection string if different!
const MONGO_URI = "mongodb://localhost:27017/testdb";

async function run() {
  await mongoose.connect(MONGO_URI);

  // Create a new user
  const user = new User({
    email: "test@example.com",
    password: "somehashedpassword", // just for demo—normally this should be hashed!
    userPlan: "pro",
    status: "active"
  });

  await user.save();
  console.log("✅ User saved:", user);

  // Fetch the user and show fields
  const found = await User.findOne({ email: "test@example.com" });
  console.log("🔍 User found in DB:", found);

  await mongoose.disconnect();
}

run().catch(console.error);
