const mongoose = require("mongoose");

const TournamentSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: true,
  },

  sportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Sport",
    required: true,
  },

  venueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue",
    required: true,
  },

  prizePool: {
    type: Number,
    default: 0,
  },

  location: String,

  startDate: {
    type: Date,
    required: true,
  },

  endDate: {
    type: Date,
    required: true,
  },

  maxParticipants: Number,

  description: String,
  rules: String,

  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  status: {
    type: String,
    enum: ["upcoming", "ongoing", "completed"],
    default: "upcoming",
  },

  teams: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Team" }
  ],

  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },

  runnerUp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    default: null,
  },

  logo: String,

  teamRegistrationFee: {
    type: Number,
    default: 0,
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Paid", "Failed", "Refunded"],
    default: "Paid",
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,

  amountPaid: {
    type: Number,
    default: 0,
  },

  paymentDate: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Tournament", TournamentSchema);
