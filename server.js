// ✅ Load environment variables BEFORE anything else
require("dotenv").config({ path: __dirname + "/.env" });

// ✅ Load express and core modules
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoSanitize = require("mongo-sanitize");
const bodyParser = require("body-parser"); // for Stripe webhooks
const path = require("path");

// ✅ Load config & middleware
const connectDB = require("./config/db");
const comboRoutes = require("./routes/combo");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const { authenticateToken, verifyAdminApiKey } = require("./middleware/authMiddleware");
const updatePassword = require('./utils/updatePassword');
const passwordResetRoutes = require("./routes/passwordReset");
const { loginLimiter, resetLimiter, getKey } = require("./middleware/rateLimiter");

// Initialize Express
const app = express();

// ✅ Serve static files
console.log("🗂️  Serving static from:", path.join(__dirname, "public"));
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

// Admin routes
app.use("/admin", adminRoutes);

// User routes (login is unprotected inside router; everything else protected)
app.use("/api/users", userRoutes);

// Combo routes (protected)
app.use("/api/combo", authenticateToken, comboRoutes);

// Password-reset (rate-limited)
app.use("/api/password-reset", resetLimiter, passwordResetRoutes);

// Stripe Checkout session
app.post("/api/create-checkout-session", authenticateToken, async (req, res) => {
  const { plan } = req.body;
  const priceMap = {
    starter: "prod_SRiYs9GYhEZ6PE",
    pro:     "prod_SRiZMGjirozmLn",
    elite:   "prod_SRidKbTQuxGmU1"
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
      cancel_url:  `${process.env.YOUR_DOMAIN}/subscription.html`
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Stripe webhook for payment events
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
    // handle events …
    res.status(200).send("OK");
  }
);

// Static front-end fallbacks
//app.get("/", (req, res) => res.redirect("/login.html"));
app.get("/payment", (req, res) =>
  res.sendFile(path.join(__dirname, "public/payment.html"))
);

// ✅ Bootstrap the server **after** MongoDB is connected
(async () => {
  try {
    await connectDB();
    console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    app.listen(process.env.PORT || 5000, "0.0.0.0");
  } catch (err) {
    console.error("❌ Server failed to start:", err);
    process.exit(1);
  }
})();
