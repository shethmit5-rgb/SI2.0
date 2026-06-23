const mongoose = require("mongoose");

const PendingUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["player", "coach", "organizer", "admin", "sponsor"],
      default: "player",
    },
    otpCode: {
      type: String,
      required: true,
    },
    otpExpiry: {
      type: Date,
      required: true,
    },
    otpAttempts: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // 10 minutes in seconds. Document automatically deleted after this time.
    },
  }
);

module.exports = mongoose.model("PendingUser", PendingUserSchema);
