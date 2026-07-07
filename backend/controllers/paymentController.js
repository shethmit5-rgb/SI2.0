const Razorpay = require("razorpay");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Registration = require("../models/Registration");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const { triggerDashboardUpdate } = require("../utils/tournamentHelper");



// Initialize Razorpay with error handling
let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log("✅ Razorpay initialized successfully");
} catch (error) {
  console.log("⚠️ Razorpay not configured. Payment features disabled.");
}

// Get Razorpay Key for frontend
exports.getRazorpayKey = (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ 
      success: false, 
      message: "Payment service not configured" 
    });
  }
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};

// Create Order
exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        success: false, 
        message: "Payment service not configured" 
      });
    }

    const { amount, registrationId, tournamentId } = req.body;

    const options = {
      amount: amount * 100, // Convert to paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      notes: {
        registrationId: registrationId,
        tournamentId: tournamentId,
        userId: req.user.userId,
      },
    };

    const order = await razorpay.orders.create(options);

    // Save transaction to database
    const transaction = new Transaction({
      userId: req.user.userId,
      tournamentId: tournamentId,
      registrationId: registrationId,
      razorpayOrderId: order.id,
      amount: amount,
      status: "created",
    });

    await transaction.save();

    res.json({
      success: true,
      order,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify Payment
exports.verifyPayment = async (req, res) => {
  try {
    if (!razorpay) {
      return res.status(503).json({ 
        success: false, 
        message: "Payment service not configured" 
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId,
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Update transaction
      await Transaction.findByIdAndUpdate(transactionId, {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
        updatedAt: Date.now(),
      });

      // Update registration payment status
      const transaction = await Transaction.findById(transactionId);
      await Registration.findByIdAndUpdate(transaction.registrationId, {
        paymentStatus: "paid",
      });

      res.json({
        success: true,
        message: "Payment verified successfully",
      });
      triggerDashboardUpdate(req, "payment_completed");

    } else {
      await Transaction.findByIdAndUpdate(transactionId, {
        status: "failed",
      });
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Transaction History
exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId })
      .populate("tournamentId", "eventName")
      .populate("registrationId", "approvalStatus")
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllPaymentsAdmin = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const transactions = await Transaction.find()
      .populate("userId", "name email role")
      .populate("tournamentId", "eventName")
      .populate("teamId", "teamName")
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminOverridePayment = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { transactionId, status } = req.body;
    // Validated in validator schema

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const targetStatus = status.toLowerCase(); // paid, failed, refunded, created, attempted
    const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(); // Paid, Failed, Refunded, Pending, etc.

    if (targetStatus === "paid") {
      // Transitioning to Paid
      if (transaction.paymentType === "tournament_creation") {
        let tournament = await Tournament.findOne({ razorpayOrderId: transaction.razorpayOrderId });
        if (!tournament) {
          const tempData = transaction.tempData;
          if (!tempData) {
            return res.status(400).json({ message: "No temporary tournament data found in transaction to create tournament." });
          }
          tournament = await Tournament.create({
            eventName: tempData.eventName,
            sportId: tempData.sportId,
            venueId: tempData.venueId,
            location: tempData.location,
            startDate: tempData.startDate,
            endDate: tempData.endDate,
            maxParticipants: tempData.maxParticipants,
            description: tempData.description,
            rules: tempData.rules,
            organizerId: tempData.organizerId,
            createdBy: tempData.createdBy,
            logo: tempData.logo,
            status: "upcoming",
            teams: [],
            prizePool: 0,
            teamRegistrationFee: tempData.teamRegistrationFee || 0,
            paymentStatus: "Paid",
            razorpayOrderId: transaction.razorpayOrderId,
            amountPaid: transaction.amount,
            paymentDate: new Date()
          });
        } else {
          tournament.paymentStatus = "Paid";
          await tournament.save();
        }
        transaction.tournamentId = tournament._id;
      } else if (transaction.paymentType === "team_registration") {
        let reg = await Registration.findOne({ razorpayOrderId: transaction.razorpayOrderId });
        if (!reg) {
          reg = await Registration.create({
            userId: transaction.userId,
            tournamentId: transaction.tournamentId,
            teamId: transaction.teamId,
            paymentStatus: "Paid",
            approvalStatus: "approved",
            razorpayOrderId: transaction.razorpayOrderId,
            amount: transaction.amount,
            paidAt: new Date()
          });
        } else {
          reg.paymentStatus = "Paid";
          reg.approvalStatus = "approved";
          await reg.save();
        }
        transaction.registrationId = reg._id;

        // Add team to tournament
        await Tournament.findByIdAndUpdate(
          transaction.tournamentId,
          { $addToSet: { teams: transaction.teamId } }
        );
      } else if (transaction.paymentType === "player_joining") {
        const team = await Team.findById(transaction.teamId);
        if (team) {
          const player = team.players.find(p => p.userId && p.userId.toString() === transaction.userId.toString());
          if (player) {
            player.status = "approved";
            await team.save();
          }
        }
      }
      transaction.status = "paid";
    } else {
      // Transitioning to failed, refunded, pending, etc.
      if (transaction.paymentType === "tournament_creation") {
        if (transaction.tournamentId) {
          const tournament = await Tournament.findById(transaction.tournamentId);
          if (tournament) {
            tournament.paymentStatus = capitalizedStatus === "Created" || capitalizedStatus === "Attempted" ? "Pending" : capitalizedStatus;
            await tournament.save();
          }
        }
      } else if (transaction.paymentType === "team_registration") {
        if (transaction.registrationId) {
          const reg = await Registration.findById(transaction.registrationId);
          if (reg) {
            reg.paymentStatus = capitalizedStatus === "Created" || capitalizedStatus === "Attempted" ? "Pending" : capitalizedStatus;
            await reg.save();
          }
        }
      } else if (transaction.paymentType === "player_joining") {
        const team = await Team.findById(transaction.teamId);
        if (team) {
          const player = team.players.find(p => p.userId && p.userId.toString() === transaction.userId.toString());
          if (player) {
            player.status = "approved_pending_payment";
            await team.save();
          }
        }
      }
      transaction.status = targetStatus;
    }

    transaction.updatedAt = Date.now();
    await transaction.save();

    res.json({ success: true, message: `Payment status overridden to ${status} successfully`, transaction });
    triggerDashboardUpdate(req, "payment_overridden");

  } catch (error) {
    console.error("adminOverridePayment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};