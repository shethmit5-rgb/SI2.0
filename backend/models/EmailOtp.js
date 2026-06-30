const mongoose = require("mongoose");

const EmailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
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
    verified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // Expires and self-deletes in 5 minutes (300 seconds)
    },
  }
);

module.exports = mongoose.model("EmailOtp", EmailOtpSchema);
