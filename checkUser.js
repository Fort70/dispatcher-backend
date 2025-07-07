const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect("mongodb://specuser2:YOUR_PASSWORD@localhost:27017/test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  authSource: "admin"
})

.then(async () => {
  const user = await User.findOne({ email: "nitroflat@gmail.com" });
  if (user) {
    console.log("✅ Found user:", user);
  } else {
    console.log("❌ User not found.");
  }
  mongoose.disconnect();
})
.catch(err => {
  console.error("❌ Connection error:", err);
});
