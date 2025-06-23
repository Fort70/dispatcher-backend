// routes/webhook.js

const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const User = require("../models/User");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Raw body middleware for Stripe
router.post(
  "/",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("⚠️ Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle successful payment
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const email = session.customer_email;
      const plan = session.metadata?.plan || "starter";

      try {
        const user = await User.findOneAndUpdate(
          { email },
          { userPlan: plan, status: "active" },
          { new: true }
        );
        if (user) {
          console.log(`✅ User updated: ${email} → ${plan}`);
        } else {
          console.log(`⚠️ No user found for email: ${email}`);
        }
      } catch (err) {
        console.error("❌ Failed to update user plan:", err.message);
      }
    }

    res.json({ received: true });
  }
);

module.exports = router;
