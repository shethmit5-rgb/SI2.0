const mongoose = require("mongoose");

const sponsorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    logo: { type: String }, // 🔥 sponsor logo
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["standard", "title", "inkind"],
      default: "standard",
    },
    winnerPrize: {
      type: Number,
      default: 0,
    },
    runnerUpPrize: {
      type: Number,
      default: 0,
    },
    equipment: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "active", "failed"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Sponsor", sponsorSchema);
