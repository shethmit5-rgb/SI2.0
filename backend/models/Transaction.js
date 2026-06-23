const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament"
  },
  registrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Registration"
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team"
  },
  paymentType: {
    type: String,
    enum: ["tournament_creation", "team_registration", "player_joining", "sponsorship"],
    default: "team_registration"
  },
  tempData: {
    type: mongoose.Schema.Types.Mixed
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: "INR"
  },
  status: {
    type: String,
    enum: ["created", "attempted", "paid", "failed", "refunded"],
    default: "created"
  },
  paymentMethod: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Transaction", TransactionSchema);