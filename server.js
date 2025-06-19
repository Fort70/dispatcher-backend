const NODE_ENV = process.env.NODE_ENV || "development";


const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const comboRoutes = require("./routes/combos");
const authenticateToken = require('./middleware/authMiddleware');
const helmet = require("helmet");
const mongoSanitize = require('mongo-sanitize');
const xss = require("xss-clean");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5000",
    "https://speclode.com",
    "https://www.speclode.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use(helmet());             // Secure HTTP headers
app.use(xss());                // Prevent XSS injection

// ✅ Global request sanitization using mongo-sanitize
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

app.use("/api/combos", authenticateToken, comboRoutes);
app.use("/admin", require('./routes/admin'));

app.get("/", (req, res) => {
  res.send("🚀 Dispatcher Calculator backend is running!");
});

// ✅ Webhook payment logic
app.post('/webhook/payment', async (req, res) => {
  console.log("BODY:", req.body);
  const { email, event } = req.body;

  if (!email || !event) {
    return res.status(400).json({ message: "Missing email or event." });
  }

  const User = require('./models/User');
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  if (event === 'payment_failed') {
    user.status = 'locked';
    await user.save();
    return res.json({ message: "User locked due to failed payment.", user });
  } else if (event === 'payment_success') {
    user.status = 'active';
    await user.save();
    return res.json({ message: "User unlocked after payment.", user });
  } else {
    return res.status(400).json({ message: "Unknown event." });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("🚫 Something broke!");
});


const PORT = process.env.PORT || 5000;
console.log("✅ ENV PORT =", process.env.PORT);

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));





