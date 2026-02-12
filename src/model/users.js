const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    minLength: 3,
    maxLength: 20,
    match: [
      /^[a-z0-9_]+$/,
      "Username can only contain lowercase letters, numbers, and underscores",
    ],
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false }, // Select false means it will not be returned by default
  googleId: { type: String, required: false },
  credits: { type: Number, default: 0 },
  subscription: {
    id: String,
    status: String,
    planId: String,
    startDate: Date,
    endDate: Date
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
