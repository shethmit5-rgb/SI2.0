const mongoose = require("mongoose");

const RegistrationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
  },

  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
  },

  registrationDate: {
    type: Date,
    default: Date.now,
  },

  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "Pending", "Paid", "Failed", "Refunded"],
    default: "unpaid",
  },

  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  amount: Number,
  paidAt: Date,

  approvalStatus: {
    type: String,
    enum: ["pending", "approved_pending_payment", "approved", "rejected"],
    default: "pending",
  },
  paymentDeadline: Date,
});

module.exports = mongoose.model("Registration", RegistrationSchema);
