// ✅ Load environment variables BEFORE anything else
require("dotenv").config({ path: __dirname + "/.env" });
// ✅ Load express and core modules
const express = require("express");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => console.error("❌ MongoDB connection failed:", err.message));

const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("mongo-sanitize");
const bodyParser = require("body-parser"); // for Stripe webhooks
const path = require("path");

// ✅ Load config & middleware
const connectDB = require("./config/db");
const comboRoutes = require("./routes/combo");  // corrected path  // corrected path
const userRoutes = require("../routes/user");
const adminRoutes = require("./routes/admin");
const { authenticateToken, verifyAdminApiKey } = require("./middleware/authMiddleware");
const updatePassword = require('./utils/updatePassword');
const passwordResetRoutes = require("../routes/passwordReset");
const { resetLimiter } = require('../middleware/rateLimiter');

// ✅ Connect to MongoDB
connectDB();

const app = express();

// ✅ Serve static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Setup CORS
const allowedOrigins = [
  "https://speclode.com",
  "https://www.speclode.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "null",
  "file://"
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-api-key"],
    credentials: true
  })
);

// ✅ Security & parsing
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// ✅ Routes registration
app.use("/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/combos", authenticateToken, comboRoutes);
// rate-limit both request‐code and reset‐password calls
app.use('/api/password-reset', resetLimiter, passwordResetRoutes);
//app.use('/api/reset', require('./routes/passwordReset'));
//app.use("/api/update-password", require("./utils/updatePassword"));


// ✅ Stripe Checkout route
app.post("/api/create-checkout-session", authenticateToken, async (req, res) => {
  const { plan } = req.body;
  const priceMap = {
    starter: "prod_SRiYs9GYhEZ6PE",
    pro: "prod_SRiZMGjirozmLn",
    elite: "prod_SRidKbTQuxGmU1"
  };

  const priceId = priceMap[plan];
  if (!priceId) return res.status(400).json({ error: "Invalid plan selected" });

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${process.env.YOUR_DOMAIN}/dispatcher.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.YOUR_DOMAIN}/subscription.html`
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Stripe webhooks
app.post(
  "/webhook/payment",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    // handle events ...
    res.status(200).send("OK");
  }
);

// ✅ Default redirect
app.get("/", (req, res) => res.redirect("/login.html"));

app.get('/payment', (req, res) => {
  res.sendFile(__dirname + '/public/payment.html');
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
