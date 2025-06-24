// ✅ Load environment variables BEFORE anything else
require("dotenv").config();
console.log("✅ Loaded ENV ADMIN_API_KEY:", process.env.ADMIN_API_KEY);

console.log("✅ Starting server.js");
console.log("🎯 THIS IS VS CODE VERSION A");

// ✅ Load express and core modules
console.log("🔄 Loading express");
const express = require("express");

console.log("🔄 Loading mongoose");
const mongoose = require("mongoose");

console.log("🔄 Loading cors");
const cors = require("cors");

console.log("🔄 Loading helmet");
const helmet = require("helmet");

console.log("🔄 Loading mongo-sanitize");
const mongoSanitize = require("mongo-sanitize");

console.log("🔄 Loading stripe");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const bodyParser = require("body-parser"); // for Stripe webhooks

console.log("🔄 Loading ./config/db");
const connectDB = require("./config/db");

console.log("🔄 Loading ./routes/combos");
const comboRoutes = require("./routes/combos");

console.log("🔄 Loading ./middleware/authMiddleware");
const authMiddleware = require("./middleware/authMiddleware");

// ✅ DEBUG: Show full object
console.log("✅ authMiddleware contents:", authMiddleware);

// ✅ Destructure and log types
const { verifyAdminApiKey: verifyKey, authenticateToken } = authMiddleware;
console.log("✅ verifyKey type:", typeof verifyKey);
console.log("✅ authenticateToken type:", typeof authenticateToken);

// ✅ Connect to MongoDB
connectDB();

const app = express();

// ✅ Serve static files from public folder
app.use(express.static("public"));

// ✅ Setup CORS with allowed origins
const allowedOrigins = [
  "https://speclode.com",
  "https://www.speclode.com",
  "http://localhost:3000",
  "http://localhost:5000",
  "null",
  "file://"
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("🌍 Origin received:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ BLOCKED Origin:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "x-api-key"],
  credentials: true
};


app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ✅ Use JSON parser
app.use(express.json());

// ✅ Apply secure helmet config
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

// ✅ Sanitize all incoming requests
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});

// ✅ Register routes
console.log("📦 Registering /admin routes");
app.use("/admin", require("./routes/admin"));

console.log("📦 Registering /api/combos routes");
app.use("/api/combos", authenticateToken, comboRoutes);

// ✅ Register Stripe Checkout route
app.post("/api/create-checkout-session", async (req, res) => {
  const { plan } = req.body;

  const priceMap = {
    starter: "prod_SRiYs9GYhEZ6PE",
    pro: "prod_SRiZMGjirozmLn",
    elite: "prod_SRidKbTQuxGmU1"
  };

  const priceId = priceMap[plan];

  if (!priceId) {
    return res.status(400).json({ error: "Invalid plan selected" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: 7
      },
      success_url: "https://speclode.com/dispatcher.html?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://speclode.com/payment.html"
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Default route redirect
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ✅ Stripe webhook (with signature verification)
app.post('/webhook/payment', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data } = event;
  const User = require('./models/User');

  try {
    if (type === 'invoice.payment_failed') {
      const email = data.object?.customer_email;
      if (email) {
        const user = await User.findOne({ email });
        if (user) {
          user.status = 'locked';
          await user.save();
          console.log('🔒 User locked due to failed payment:', email);
        }
      }
    }

    else if (type === 'invoice.payment_succeeded') {
      const email = data.object?.customer_email;
      if (email) {
        const user = await User.findOne({ email });
        if (user) {
          user.status = 'active';
          await user.save();
          console.log('✅ User unlocked after successful payment:', email);
        }
      }
    }

    else if (type === 'checkout.session.completed') {
      const session = data.object;
      const email = session.customer_email;
      const selectedPlan = session.metadata?.plan || 'starter';

      if (email) {
        const user = await User.findOne({ email });
        if (user) {
          user.userPlan = selectedPlan;
          await user.save();
          console.log(`💳 User plan upgraded to "${selectedPlan}" for email: ${email}`);
        } else {
          console.warn(`⚠️ No user found for email: ${email}`);
        }
      }
    }

    res.status(200).send('✅ Webhook received');
  } catch (error) {
    console.error('❌ Webhook processing error:', error.message);
    res.status(500).send('Internal server error');
  }
});


// ✅ Start server
const PORT = process.env.PORT || 5000;
console.log("✅ ENV PORT =", process.env.PORT);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
