const Registration = require("../models/Registration");
const Tournament = require("../models/Tournament");
const Notification = require("../models/notification");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Razorpay = require("razorpay");
const Team = require("../models/Team");
const User = require("../models/User");
const { triggerDashboardUpdate } = require("../utils/tournamentHelper");


let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error("Razorpay initialization error in registrationController:", error);
}

const Match = require("../models/Match");

// Mutex lock map for tournament approvals: tournamentId -> Promise
const tournamentLocks = {};

const acquireLock = (tournamentId) => {
  if (!tournamentLocks[tournamentId]) {
    tournamentLocks[tournamentId] = Promise.resolve();
  }
  let release;
  const nextLock = new Promise(resolve => {
    release = resolve;
  });
  const currentLock = tournamentLocks[tournamentId];
  tournamentLocks[tournamentId] = nextLock;
  return currentLock.then(() => release);
};

// Deduplicating notification helper
async function sendNotificationToUsers(userIds, message, type, relatedId, req) {
  try {
    const io = req.app.get("io");
    const users = req.app.get("users") || {};
    const uniqueUserIds = [...new Set(userIds.map(id => id.toString()))];

    for (const userId of uniqueUserIds) {
      const exists = await Notification.findOne({
        userId,
        type,
        relatedId
      });
      if (exists) continue; // Skip duplicate

      const notification = await Notification.create({
        userId,
        message,
        type,
        relatedId
      });

      const userSocket = users[userId];
      if (userSocket && io) {
        io.to(userSocket).emit("new_notification", {
          _id: notification._id,
          message: notification.message,
          type: notification.type,
          relatedId: notification.relatedId,
          createdAt: notification.createdAt,
          isRead: false
        });
      }
    }
  } catch (error) {
    console.error("Error sending registration notification:", error);
  }
}

// Helper to retrieve admins and target organizer of a tournament
async function getAdminsAndOrganizer(tournament) {
  try {
    const admins = await User.find({ role: "admin" }).select("_id");
    const recipientIds = admins.map(a => a._id.toString());

    if (tournament.organizerId) {
      const orgUser = await User.findById(tournament.organizerId);
      if (orgUser && (orgUser.role === "admin" || orgUser.role === "organizer")) {
        recipientIds.push(tournament.organizerId.toString());
      }
    }

    if (tournament.createdBy) {
      const creatorUser = await User.findById(tournament.createdBy);
      if (creatorUser && (creatorUser.role === "admin" || creatorUser.role === "organizer")) {
        recipientIds.push(tournament.createdBy.toString());
      }
    }

    return [...new Set(recipientIds)];
  } catch (error) {
    console.error("Error getting notification recipients:", error);
    return [];
  }
}

// Helper to release registrations that have passed their payment deadline
async function checkAndReleaseExpiredRegistrations(tournamentId, req) {
  try {
    const now = new Date();
    const query = {
      approvalStatus: "approved_pending_payment",
      paymentDeadline: { $lte: now }
    };
    if (tournamentId) {
      query.tournamentId = tournamentId;
    }
    const expiredRegs = await Registration.find(query).populate("teamId", "teamName");

    for (const reg of expiredRegs) {
      reg.approvalStatus = "pending";
      reg.paymentStatus = "unpaid";
      reg.paymentDeadline = undefined;
      await reg.save();

      // Send notification to Coach
      const coachMsg = `Registration approval expired. Please wait for organizer approval again.`;
      await sendNotificationToUsers([reg.userId], coachMsg, "approval_expired", reg.tournamentId, req);
    }
  } catch (error) {
    console.error("Error releasing expired registrations:", error);
  }
}


exports.registerTeam = async (req, res, next) => {
  try {
    if (req.user.role === "organizer") {
      return res.status(403).json({ message: "Organizers are not permitted to perform this action." });
    }

    const { tournamentId, teamId } = req.body;

    const exists = await Registration.findOne({
      tournamentId,
      teamId,
      approvalStatus: { $in: ["pending", "approved_pending_payment", "approved"] }
    });

    if (exists) {
      if (exists.approvalStatus === "pending") {
        return res.status(200).json(exists);
      }
      return res.status(400).json({ message: "Team is already registered for this tournament." });
    }

    const reg = await Registration.create({
      userId: req.user.userId,
      tournamentId,
      teamId,
    });

    // Send submitted notification
    const tournament = await Tournament.findById(tournamentId);
    const team = await Team.findById(teamId);
    const coach = await User.findById(req.user.userId);
    if (tournament && team && coach) {
      const recipients = await getAdminsAndOrganizer(tournament);
      const submissionMsg = `📝 Team Registration Submitted\n- Team: ${team.teamName}\n- Tournament: ${tournament.eventName}\n- Coach: ${coach.name}\n- Date: ${new Date().toLocaleDateString()}\n- Status: pending`;
      await sendNotificationToUsers(recipients, submissionMsg, "registration_submitted", reg._id, req);
    }

    triggerDashboardUpdate(req, "registration_submitted");
    res.status(201).json(reg);

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.getMyRegistrations = async (req, res, next) => {
  try {
    await checkAndReleaseExpiredRegistrations(null, req);
    
    // Find all teams where this user is the captain (coach) or a member (player)
    const myTeams = await Team.find({
      $or: [
        { captainId: req.user.userId },
        { "players.userId": req.user.userId }
      ]
    }).select("_id");
    const myTeamIds = myTeams.map(t => t._id);

    const registrations = await Registration.find({
      $or: [
        { userId: req.user.userId },
        { teamId: { $in: myTeamIds } }
      ]
    })
      .populate("tournamentId", "eventName startDate status prizePool teamRegistrationFee")
      .populate("teamId", "teamName captainId players");

    res.json(registrations);
  } catch (err) {
    console.error("MY REGISTRATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch your registrations" });
  }
};

exports.getAllRegistrations = async (req, res, next) => {
  try {
    await checkAndReleaseExpiredRegistrations(null, req);
    let query = {};
    if (req.user.role === "organizer") {
      const organizerTournaments = await Tournament.find({
        $or: [
          { createdBy: req.user.userId },
          { organizerId: req.user.userId }
        ]
      }).select("_id");
      const tournamentIds = organizerTournaments.map(t => t._id);
      query = { tournamentId: { $in: tournamentIds } };
    }

    const registrations = await Registration.find(query)
      .populate("userId", "name email")
      .populate("teamId", "teamName")
      .populate({
        path: "tournamentId",
        select: "eventName sportId createdBy organizerId teamRegistrationFee",
        populate: {
          path: "sportId",
          select: "name"
        }
      });

    res.json(registrations);
  } catch (err) {
    console.error("FETCH REGISTRATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch registrations" });
  }
};

exports.updateRegistration = async (req, res, next) => {
  try {
    const { approvalStatus, paymentStatus } = req.body;

    let reg = await Registration.findById(req.params.id)
      .populate("userId", "name")
      .populate("teamId", "teamName");
      
    if (!reg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    if (reg.approvalStatus === "approved" && reg.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Paid registration has already been finalized." });
    }

    if (approvalStatus) {
      if (reg.approvalStatus !== "pending") {
        return res.status(400).json({ message: "Registration has already been processed." });
      }
    }

    const initialTournament = await Tournament.findById(reg.tournamentId);
    if (!initialTournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (req.user.role === "organizer") {
      const isOwner = 
        (initialTournament.createdBy && initialTournament.createdBy.toString() === req.user.userId) ||
        (initialTournament.organizerId && initialTournament.organizerId.toString() === req.user.userId);
      if (!isOwner) {
        return res.status(403).json({ message: "You no longer have permission to manage registrations for this tournament." });
      }
    }

    const tournamentIdStr = reg.tournamentId.toString();

    // Release expired registrations first
    await checkAndReleaseExpiredRegistrations(tournamentIdStr, req);

    const release = await acquireLock(tournamentIdStr);

    try {
      reg = await Registration.findById(req.params.id)
        .populate("userId", "name")
        .populate("teamId", "teamName");

      if (!reg) {
        return res.status(404).json({ message: "Registration not found" });
      }

      if (reg.approvalStatus === "approved" && reg.paymentStatus === "Paid") {
        return res.status(400).json({ message: "Paid registration has already been finalized." });
      }

      if (approvalStatus && reg.approvalStatus !== "pending") {
        return res.status(400).json({ message: "Registration has already been processed." });
      }

      const tournament = await Tournament.findById(reg.tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: "Tournament not found" });
      }

      if (req.user.role === "organizer") {
        const isOwner = 
          (tournament.createdBy && tournament.createdBy.toString() === req.user.userId) ||
          (tournament.organizerId && tournament.organizerId.toString() === req.user.userId);
        if (!isOwner) {
          return res.status(403).json({ message: "You no longer have permission to manage registrations for this tournament." });
        }
      }

      if (approvalStatus) {
        if (approvalStatus === "approved" || approvalStatus === "approved_pending_payment") {
          if (tournament.status !== "upcoming") {
            return res.status(400).json({ message: "Registration is closed because the tournament has already started." });
          }

          const matchCount = await Match.countDocuments({ tournamentId: reg.tournamentId });
          if (matchCount > 0) {
            return res.status(400).json({ message: "Registration is closed because tournament matches have already been created." });
          }

          const anotherApproved = await Registration.findOne({
            tournamentId: reg.tournamentId,
            teamId: reg.teamId,
            approvalStatus: { $in: ["approved", "approved_pending_payment"] },
            _id: { $ne: reg._id }
          });
          if (anotherApproved) {
            return res.status(400).json({ message: "Team is already registered for this tournament." });
          }

          const reservedSlotsCount = await Registration.countDocuments({
            tournamentId: reg.tournamentId,
            approvalStatus: { $in: ["approved", "approved_pending_payment"] }
          });
          if (reservedSlotsCount >= tournament.maxParticipants) {
            return res.status(400).json({ message: "Tournament has reached its maximum participant capacity." });
          }

          reg.approvalStatus = "approved_pending_payment";
          reg.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (approvalStatus === "rejected") {
          reg.approvalStatus = "rejected";
        }
      }

      if (paymentStatus) {
        reg.paymentStatus = paymentStatus;
      }

      await reg.save();

      if (approvalStatus) {
        const recipients = await getAdminsAndOrganizer(tournament);
        
        if (reg.approvalStatus === "approved_pending_payment") {
          // Notify coach
          const coachMsg = `Your registration has been approved. Complete payment to confirm participation.`;
          await sendNotificationToUsers([reg.userId._id], coachMsg, "registration_approved", reg.tournamentId, req);
        } else if (reg.approvalStatus === "rejected") {
          // Notify coach
          const coachMsg = `❌ Your team "${reg.teamId.teamName}" registration was REJECTED.`;
          await sendNotificationToUsers([reg.userId._id], coachMsg, "registration_rejected", reg.tournamentId, req);

          // Notify admins and organizer
          const statusMsg = `❌ Team Registration Rejected\n- Team: ${reg.teamId.teamName}\n- Tournament: ${tournament.eventName}\n- Coach: ${reg.userId.name}\n- Date: ${new Date().toLocaleDateString()}\n- Status: rejected`;
          await sendNotificationToUsers(recipients, statusMsg, "registration_rejected_admin", reg._id, req);
        }
      }

      triggerDashboardUpdate(req, "registration_updated");
      return res.json(reg);


    } finally {
      release();
    }

  } catch (err) {
    console.error("UPDATE REG ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
};

exports.checkRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findOne({
      tournamentId: req.params.tournamentId,
      teamId: req.params.teamId
    });
    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    // Only the user who registered can cancel
    if (registration.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "You can only cancel your own registrations" });
    }

    // Remove team from tournament if approved
    if (registration.approvalStatus === "approved") {
      await Tournament.findByIdAndUpdate(registration.tournamentId, {
        $pull: { teams: registration.teamId }
      });
    }

    await Registration.findByIdAndDelete(req.params.id);
    res.json({ message: "Registration cancelled successfully" });
  } catch (err) {
    console.error("Cancel registration error:", err);
    res.status(500).json({ message: "Failed to cancel registration" });
  }
};

exports.initiateRegistrationPayment = async (req, res) => {
  try {
    if (req.user.role === "organizer") {
      return res.status(403).json({ message: "Organizers are not permitted to register teams." });
    }

    const { tournamentId, teamId } = req.body;
    if (!tournamentId || !teamId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Expiry cleanup
    await checkAndReleaseExpiredRegistrations(tournamentId, req);

    // Find the existing Registration
    const reg = await Registration.findOne({ tournamentId, teamId });
    if (!reg) {
      return res.status(404).json({ message: "No approved registration found for this team." });
    }

    if (reg.approvalStatus === "pending") {
      return res.status(400).json({ message: "Your registration is pending approval." });
    }

    if (reg.approvalStatus === "rejected") {
      return res.status(400).json({ message: "Registration has been rejected." });
    }

    if (reg.approvalStatus === "approved" && reg.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Team is already registered for this tournament." });
    }

    if (reg.approvalStatus !== "approved_pending_payment") {
      return res.status(404).json({ message: "No approved registration found for this team." });
    }

    // Check duplicate transactions
    const existingTx = await Transaction.findOne({
      registrationId: reg._id,
      paymentType: "team_registration"
    });

    if (existingTx) {
      if (existingTx.status === "paid") {
        return res.status(400).json({ message: "Transaction already paid and verified" });
      }
      if (existingTx.status === "created") {
        // Reuse it
        existingTx.updatedAt = Date.now();
        await existingTx.save();
        return res.status(200).json({
          success: true,
          requiresPayment: true,
          order: {
            id: existingTx.razorpayOrderId,
            amount: existingTx.amount * 100,
            currency: existingTx.currency || "INR",
          },
          transactionId: existingTx._id
        });
      }
    }

    // If registration fee is 0, directly complete registration
    if (!tournament.teamRegistrationFee || tournament.teamRegistrationFee === 0) {
      // Re-verify constraints
      if (tournament.status !== "upcoming") {
        return res.status(400).json({ message: "Registration is closed because the tournament has already started." });
      }

      const matchCount = await Match.countDocuments({ tournamentId: reg.tournamentId });
      if (matchCount > 0) {
        return res.status(400).json({ message: "Registration is closed because tournament matches have already been created." });
      }

      const anotherApproved = await Registration.findOne({
        tournamentId: reg.tournamentId,
        teamId: reg.teamId,
        approvalStatus: "approved",
        _id: { $ne: reg._id }
      });
      if (anotherApproved) {
        return res.status(400).json({ message: "Team is already registered for this tournament." });
      }

      const approvedTeamsCount = await Registration.countDocuments({
        tournamentId: reg.tournamentId,
        approvalStatus: "approved"
      });
      if (approvedTeamsCount >= tournament.maxParticipants) {
        return res.status(400).json({ message: "Tournament has reached its maximum participant capacity." });
      }

      // Check deadline
      if (!reg.paymentDeadline || Date.now() > reg.paymentDeadline) {
        reg.approvalStatus = "pending";
        reg.paymentStatus = "unpaid";
        reg.paymentDeadline = undefined;
        await reg.save();
        return res.status(400).json({ message: "Payment approval window has expired. Please wait for organizer approval again." });
      }

      reg.approvalStatus = "approved";
      reg.paymentStatus = "Paid";
      reg.amount = 0;
      reg.paidAt = new Date();
      reg.paymentDeadline = undefined;
      await reg.save();

      await Tournament.findByIdAndUpdate(
        tournamentId,
        { $addToSet: { teams: teamId } }
      );

      // Send completed payment notifications
      const team = await Team.findById(teamId);
      const coach = await User.findById(req.user.userId);
      if (tournament && team && coach) {
        const recipients = await getAdminsAndOrganizer(tournament);
        const paymentMsg = `💳 Team Registration Payment Completed\n- Team: ${team.teamName}\n- Tournament: ${tournament.eventName}\n- Coach: ${coach.name}\n- Amount: INR 0\n- Date: ${new Date().toLocaleDateString()}`;
        await sendNotificationToUsers(recipients, paymentMsg, "registration_payment_completed", reg._id, req);
        await sendNotificationToUsers([req.user.userId], `✅ Your registration for team "${team.teamName}" in "${tournament.eventName}" is complete!`, "registration_payment_completed", reg._id, req);
      }

      return res.status(201).json({
        success: true,
        requiresPayment: false,
        registration: reg,
      });
    }

    if (!razorpay) {
      return res.status(503).json({ message: "Payment service not configured" });
    }

    // Create a new Razorpay order
    const amount = tournament.teamRegistrationFee;
    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_reg_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        tournamentId,
        teamId,
        registrationId: reg._id.toString(),
        paymentType: "team_registration"
      }
    };

    const order = await razorpay.orders.create(options);

    const transaction = new Transaction({
      userId: req.user.userId,
      tournamentId,
      teamId,
      registrationId: reg._id,
      paymentType: "team_registration",
      amount,
      status: "created",
      razorpayOrderId: order.id,
      tempData: {
        userId: req.user.userId,
        tournamentId,
        teamId,
        registrationId: reg._id
      }
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      requiresPayment: true,
      order,
      transactionId: transaction._id
    });

  } catch (error) {
    console.error("initiateRegistrationPayment error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyRegistrationPayment = async (req, res) => {
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

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
      return res.status(400).json({ success: false, message: "Missing verification payload" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;
    if (!isAuthentic) {
      return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    }

    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    if (transaction.status === "paid") {
      return res.status(400).json({ success: false, message: "Transaction already paid and verified" });
    }

    if (transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({ success: false, message: "Unauthorized: You do not own this transaction" });
    }

    const tournament = await Tournament.findById(transaction.tournamentId);
    if (!tournament) {
      return res.status(404).json({ success: false, message: "Tournament not found" });
    }

    const expectedAmount = tournament.teamRegistrationFee;
    if (transaction.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: "Transaction amount mismatch" });
    }

    // Expiry cleanup
    await checkAndReleaseExpiredRegistrations(transaction.tournamentId, req);

    const reg = await Registration.findOne({
      tournamentId: transaction.tournamentId,
      teamId: transaction.teamId
    });

    if (!reg) {
      return res.status(404).json({ success: false, message: "Registration not found" });
    }

    // Recheck deadline check
    if (!reg.paymentDeadline || Date.now() > reg.paymentDeadline || reg.approvalStatus !== "approved_pending_payment") {
      reg.approvalStatus = "pending";
      reg.paymentStatus = "unpaid";
      reg.paymentDeadline = undefined;
      await reg.save();
      return res.status(400).json({
        success: false,
        message: "Payment approval window has expired. Please wait for organizer approval again."
      });
    }

    const release = await acquireLock(transaction.tournamentId.toString());

    try {
      // Re-verify constraints inside lock
      const freshTournament = await Tournament.findById(transaction.tournamentId);
      if (freshTournament.status !== "upcoming") {
        return res.status(400).json({ success: false, message: "Registration is closed because the tournament has already started." });
      }

      const matchCount = await Match.countDocuments({ tournamentId: transaction.tournamentId });
      if (matchCount > 0) {
        return res.status(400).json({ success: false, message: "Registration is closed because tournament matches have already been created." });
      }

      const anotherApproved = await Registration.findOne({
        tournamentId: transaction.tournamentId,
        teamId: transaction.teamId,
        approvalStatus: "approved",
        _id: { $ne: reg._id }
      });
      if (anotherApproved) {
        return res.status(400).json({ success: false, message: "Team is already registered for this tournament." });
      }

      const approvedTeamsCount = await Registration.countDocuments({
        tournamentId: transaction.tournamentId,
        approvalStatus: "approved"
      });
      if (approvedTeamsCount >= freshTournament.maxParticipants) {
        return res.status(400).json({ success: false, message: "Tournament has reached its maximum participant capacity." });
      }

      // Update the Registration to approved and Paid
      reg.approvalStatus = "approved";
      reg.paymentStatus = "Paid";
      reg.razorpayOrderId = razorpay_order_id;
      reg.razorpayPaymentId = razorpay_payment_id;
      reg.razorpaySignature = razorpay_signature;
      reg.amount = expectedAmount;
      reg.paidAt = new Date();
      reg.paymentDeadline = undefined;
      await reg.save();

      // Add team to tournament
      await Tournament.findByIdAndUpdate(
        transaction.tournamentId,
        { $addToSet: { teams: transaction.teamId } }
      );

      // Update Transaction
      transaction.status = "paid";
      transaction.registrationId = reg._id;
      transaction.razorpayPaymentId = razorpay_payment_id;
      transaction.razorpaySignature = razorpay_signature;
      transaction.updatedAt = Date.now();
      await transaction.save();

      // Send notifications
      const team = await Team.findById(transaction.teamId);
      const coach = await User.findById(transaction.userId);
      if (tournament && team && coach) {
        const recipients = await getAdminsAndOrganizer(tournament);
        const paymentMsg = `💳 Team Registration Payment Completed\n- Team: ${team.teamName}\n- Tournament: ${tournament.eventName}\n- Coach: ${coach.name}\n- Amount: INR ${expectedAmount}\n- Date: ${new Date().toLocaleDateString()}`;
        await sendNotificationToUsers(recipients, paymentMsg, "registration_payment_completed", reg._id, req);
        await sendNotificationToUsers([transaction.userId], `✅ Your registration for team "${team.teamName}" in "${tournament.eventName}" is complete!`, "registration_payment_completed", reg._id, req);
      }

      triggerDashboardUpdate(req, "registration_payment_completed");
      res.status(201).json({
        success: true,
        message: "Registration payment verified and completed successfully",
        registration: reg
      });


    } finally {
      release();
    }
  } catch (error) {
    console.error("verifyRegistrationPayment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

