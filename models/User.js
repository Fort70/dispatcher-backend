// User.js - MongoDB User Schema

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    userPlan: {
      type: String,
      default: 'starter'
    },
    status: {
      type: String,
      default: 'active'
    },
    role: {
      type: String,
      default: 'user', // 'user' or 'admin'
      enum: ['user', 'admin']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

