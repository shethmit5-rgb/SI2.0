const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Notification = require("../models/notification");
const Registration = require("../models/Registration");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Razorpay = require("razorpay");
const { triggerDashboardUpdate } = require("../utils/tournamentHelper");


let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error("Razorpay initialization error in teamController:", error);
}

const checkAndReleaseExpiredPlayerApprovals = async (teamId, req) => {
  try {
    const team = await Team.findById(teamId);
    if (!team) return;

    let modified = false;
    const currentTime = new Date();

    for (const player of team.players) {
      if (
        player.status === "approved_pending_payment" &&
        player.paymentDeadline &&
        new Date(player.paymentDeadline) <= currentTime
      ) {
        player.status = "pending";
        player.paymentStatus = "unpaid";
        player.paymentDeadline = null;
        modified = true;

        // Send notification to player
        const Notification = require("../models/notification");
        const notification = await Notification.create({
          userId: player.userId,
          message: "Your approval expired because payment was not completed within 24 hours.",
          type: "player_approval_expired",
          relatedId: team._id,
          isRead: false
        });

        // Socket notification
        if (req) {
          const io = req.app.get("io");
          const users = req.app.get("users") || {};
          const playerSocket = users[player.userId.toString()];
          if (playerSocket && io) {
            io.to(playerSocket).emit("new_notification", {
              _id: notification._id,
              message: notification.message,
              type: notification.type,
              relatedId: notification.relatedId,
              createdAt: notification.createdAt,
              isRead: false
            });
          }
        }
      }
    }

    if (modified) {
      await team.save();
    }
  } catch (err) {
    console.error("Error in checkAndReleaseExpiredPlayerApprovals:", err);
  }
};

exports.createTeam = async (req, res, next) => {
  try {
    const { teamName, tournamentId, sportId, captainId, playerJoiningFee } = req.body;

    if (req.user.role === "organizer") {
      return res.status(403).json({ message: "Organizers are not permitted to perform this action." });
    }

    if (req.user.role !== "coach" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only coaches can create teams." });
    }

    // Validations handled by express-validator

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    if (tournament.sportId.toString() !== sportId) {
      return res.status(400).json({
        message: "Team sport must match tournament sport",
      });
    }

    let finalCaptainId = req.user.userId;

    if (req.user.role === "admin" && captainId) {
      const captain = await User.findById(captainId);
      if (!captain) {
        return res.status(404).json({ message: "Captain not found" });
      }
      finalCaptainId = captainId;
    }

    const existingTeam = await Team.findOne({
      tournamentId,
      $or: [
        { captainId: finalCaptainId },
        { "players.userId": finalCaptainId },
      ],
    });

    if (existingTeam) {
      return res.status(400).json({
        message: "You have already created a team for this tournament.",
      });
    }

    const team = await Team.create({
      teamName,
      tournamentId,
      sportId,
      captainId: finalCaptainId,
      playerJoiningFee: Number(playerJoiningFee) || 0,
      players: [],
    });

    // Automatically create a pending registration record for this team
    await Registration.create({
      userId: finalCaptainId,
      tournamentId,
      teamId: team._id,
      approvalStatus: "pending",
      paymentStatus: "unpaid",
    });

    res.status(201).json(team);

  } catch (err) {
    console.error("CREATE TEAM ERROR:", err);
    res.status(500).json({ message: "Failed to create team" });
  }
};

exports.getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate("tournamentId", "eventName")
      .populate("sportId", "name")
      .populate("captainId", "name email role phoneNumber age gender location")
      .populate("players.userId", "name email role phoneNumber age gender location");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teams" });
  }
};

exports.getTeamsByTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const teams = await Team.find({
      _id: { $in: tournament.teams || [] }
    }).populate("captainId", "name");

    res.json(teams);
  } catch (err) {
    console.error("GET TEAMS BY TOURNAMENT ERROR:", err);
    res.status(500).json({ message: "Failed to load teams" });
  }
};

exports.applyToTeam = async (req, res, next) => {
  try {
    if (req.user.role !== "player" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only players can join teams." });
    }

    const team = await Team.findById(req.params.teamId);

    if (!team) return res.status(404).json({ message: "Team not found" });

    // Check if player is already in another team in this tournament
    const existingTournamentTeam = await Team.findOne({
      tournamentId: team.tournamentId,
      "players.userId": req.user.userId
    });

    if (existingTournamentTeam) {
      return res.status(400).json({ message: "You are already registered with another team in this tournament." });
    }

    const alreadyApplied = team.players.some(
      (p) => p.userId && p.userId.toString() === req.user.userId
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: "Already applied" });
    }

    team.players.push({
      userId: req.user.userId,
      status: "pending",
    });

    await team.save();

    // 🔔 GET PLAYER NAME
    const player = await User.findById(req.user.userId);
    if (!player) return res.status(404).json({ message: "Player not found" });

    // 🔔 SAVE NOTIFICATION
    const notification = await Notification.create({
      userId: team.captainId,
      message: `${player.name} requested to join your team`,
      type: "join_request",
      relatedId: team._id,
      isRead: false
    });

    // 🔥 SOCKET SEND
    const io = req.app.get("io");
    const users = req.app.get("users") || {};

    const captainSocket = team.captainId ? users[team.captainId.toString()] : null;

    if (io && captainSocket) {
      io.to(captainSocket).emit("new_notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        relatedId: notification.relatedId,
        isRead: false
      });
    }

    res.json({ message: "Application sent" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to apply" });
  }
};

exports.approvePlayer = async (req, res, next) => {
  try {
    const { userId, action } = req.body;
    const team = await Team.findById(req.params.teamId).populate("captainId", "name");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Only captain (coach) or admin can approve/reject
    const isCaptain = team.captainId && team.captainId._id.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isCaptain && !isAdmin) {
      return res.status(403).json({ 
        message: "Access denied. Only team coach or admin can approve players." 
      });
    }

    const player = team.players.find(p => p.userId && p.userId.toString() === userId);
    if (!player) {
      return res.status(404).json({ message: "Player not found in team" });
    }

    if (action === "approved") {
      // DUPLICATE ACTIVE MEMBER PROTECTION
      const isAlreadyActive = team.players.some(
        p => p.userId && p.userId.toString() === userId && p.status === "approved"
      );
      if (isAlreadyActive) {
        return res.status(400).json({ message: "Player is already an active member." });
      }

      player.status = "approved_pending_payment";
      player.paymentStatus = "unpaid";
      player.paymentDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    } else {
      player.status = action; // e.g. "rejected"
      player.paymentStatus = "unpaid";
      player.paymentDeadline = null;
    }

    await team.save();

    // Send notification to player
    const Notification = require("../models/notification");
    const notification = await Notification.create({
      userId: userId,
      message: action === "approved"
        ? "Your join request has been approved. Complete payment to become an active member."
        : `❌ Your request to join "${team.teamName}" has been REJECTED by ${isAdmin ? "Admin" : `captain ${team.captainId?.name || "the Captain"}`}.`,
      type: action === "approved" ? "player_approved_pending_payment" : "player_rejected",
      relatedId: team._id,
      isRead: false
    });

    // Socket notification
    const io = req.app.get("io");
    const users = req.app.get("users") || {};
    const playerSocket = users[userId];
    if (playerSocket && io) {
      io.to(playerSocket).emit("new_notification", {
        _id: notification._id,
        message: notification.message,
        type: notification.type,
        relatedId: notification.relatedId,
        createdAt: notification.createdAt,
        isRead: false
      });
    }

    res.json({ message: `Player ${action} successfully`, team });
    triggerDashboardUpdate(req, "player_approval_updated");

  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Failed to process request" });
  }
};

exports.getMyTeams = async (req, res, next) => {
  try {
    const teamIds = await Team.find({
      $or: [
        { captainId: req.user.userId },
        { "players.userId": req.user.userId },
      ]
    }).select("_id");

    for (const t of teamIds) {
      await checkAndReleaseExpiredPlayerApprovals(t._id, req);
    }

    const teams = await Team.find({
      $or: [
        { captainId: req.user.userId },
        { "players.userId": req.user.userId },
      ],
    })
      .populate("players.userId", "name email")
      .populate("captainId", "name");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCaptainTeams = async (req, res, next) => {
  try {
    const teamIds = await Team.find({ captainId: req.user.userId }).select("_id");
    for (const t of teamIds) {
      await checkAndReleaseExpiredPlayerApprovals(t._id, req);
    }

    const teams = await Team.find({
      captainId: req.user.userId,
    }).populate("players.userId", "name email");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPublicTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate("tournamentId", "eventName")
      .populate("captainId", "name");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTeamById = async (req, res, next) => {
  try {
    await checkAndReleaseExpiredPlayerApprovals(req.params.id, req);

    const team = await Team.findById(req.params.id)
      .populate("captainId", "name email role phoneNumber age gender location")
      .populate("players.userId", "name email role phoneNumber age gender location")
      .populate("tournamentId", "eventName")
      .populate("sportId", "name");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch team" });
  }
};

exports.updateTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Only captain or admin can edit
    const isCaptain = team.captainId.toString() === req.user.userId;
    const isAdmin = req.user.role === "admin";
    if (!isCaptain && !isAdmin) {
      return res.status(403).json({ message: "Access denied. Only team captain or admin can edit team." });
    }

    const { teamName, playerJoiningFee } = req.body;
    
    if (teamName) {
      team.teamName = teamName;
    }
    if (playerJoiningFee !== undefined) {
      team.playerJoiningFee = Number(playerJoiningFee) || 0;
    }

    await team.save();
    res.json({ message: "Team updated successfully", team });
    triggerDashboardUpdate(req, "team_updated");

  } catch (err) {
    console.error("Edit team error:", err);
    res.status(500).json({ message: "Failed to update team" });
  }
};

exports.blockMembers = (req, res, next) => {
  res.json({ message: "Blocked" });
};

exports.deleteTeamByAdmin = async (req, res, next) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: "Team deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete team" });
  }
};

exports.leaveTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.teamId);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Check if user is captain (captain cannot leave, must delete team)
    if (team.captainId.toString() === req.user.userId) {
      return res.status(400).json({ message: "Captain cannot leave team. Delete the team instead." });
    }

    // Remove player from team
    const playerIndex = team.players.findIndex(p => p.userId.toString() === req.user.userId);
    
    if (playerIndex === -1) {
      return res.status(404).json({ message: "You are not a member of this team" });
    }

    team.players.splice(playerIndex, 1);
    await team.save();

    res.json({ message: "Successfully left the team" });
  } catch (err) {
    console.error("Leave team error:", err);
    res.status(500).json({ message: "Failed to leave team" });
  }
};

exports.deleteTeamByCaptain = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Only captain can delete
    if (team.captainId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only captain can delete team" });
    }

    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error("Delete team error:", err);
    res.status(500).json({ message: "Failed to delete team" });
  }
};

exports.initiatePlayerJoinPayment = async (req, res) => {
  try {
    const { teamId } = req.body;
    // Validated in teamId body check

    // Check expiry before initiating
    await checkAndReleaseExpiredPlayerApprovals(teamId, req);

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Find player in the team
    const player = team.players.find(p => p.userId && p.userId.toString() === req.user.userId);
    if (!player) {
      return res.status(404).json({ message: "You have not requested to join this team." });
    }

    // Validation checks
    if (player.status === "pending") {
      return res.status(400).json({ message: "Your request is still awaiting coach approval." });
    }
    if (player.status === "rejected") {
      return res.status(400).json({ message: "Your request has been rejected." });
    }
    if (player.status === "approved") {
      return res.status(400).json({ message: "Player is already active." });
    }
    if (player.status !== "approved_pending_payment") {
      return res.status(400).json({ message: `Invalid request status: ${player.status}` });
    }

    // Check existing paid transaction for duplicate payment protection
    const existingPaidTx = await Transaction.findOne({
      userId: req.user.userId,
      teamId: teamId,
      paymentType: "player_joining",
      status: "paid"
    });
    if (existingPaidTx) {
      return res.status(400).json({ message: "Payment already completed." });
    }

    // Zero Fee Flow
    if (!team.playerJoiningFee || team.playerJoiningFee === 0) {
      player.status = "approved";
      player.paymentStatus = "Paid";
      player.paymentDeadline = null;
      await team.save();

      // Create paid transaction record
      const transaction = new Transaction({
        userId: req.user.userId,
        teamId,
        paymentType: "player_joining",
        amount: 0,
        status: "paid",
        razorpayOrderId: "free_join_" + Date.now(),
        razorpayPaymentId: "free_pay_" + Date.now(),
        tempData: {
          userId: req.user.userId,
          teamId,
          coachId: team.captainId ? team.captainId.toString() : null
        }
      });
      await transaction.save();

      // Send notifications:
      const Notification = require("../models/notification");
      const io = req.app.get("io");
      const users = req.app.get("users") || {};
      const playerUser = await User.findById(req.user.userId);

      // 1. PLAYER
      const pNotif = await Notification.create({
        userId: req.user.userId,
        message: "Your payment completed. Membership activated.",
        type: "player_activated",
        relatedId: team._id,
        isRead: false
      });
      const pSocket = users[req.user.userId];
      if (pSocket && io) {
        io.to(pSocket).emit("new_notification", pNotif);
      }

      // 2. COACH
      if (team.captainId) {
        const coachNotif = await Notification.create({
          userId: team.captainId,
          message: `Player ${playerUser.name} payment completed. Player became active member.`,
          type: "player_activated_coach",
          relatedId: team._id,
          isRead: false
        });
        const coachSocket = users[team.captainId.toString()];
        if (coachSocket && io) {
          io.to(coachSocket).emit("new_notification", coachNotif);
        }
      }

      // 3. ADMIN
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        const adminNotif = await Notification.create({
          userId: admin._id,
          message: `Player ${playerUser.name} payment completed. Player activated.`,
          type: "player_activated_admin",
          relatedId: team._id,
          isRead: false
        });
        const adminSocket = users[admin._id.toString()];
        if (adminSocket && io) {
          io.to(adminSocket).emit("new_notification", adminNotif);
        }
      }

      triggerDashboardUpdate(req, "player_activated");
      return res.status(200).json({
        success: true,
        requiresPayment: false,
        message: "Membership activated (Zero Fee)",
        team
      });
    }

    if (!razorpay) {
      return res.status(503).json({ message: "Payment service not configured" });
    }

    // Duplicate Payment Protection: Reuse existing Razorpay order if exists
    let existingTx = await Transaction.findOne({
      userId: req.user.userId,
      teamId: teamId,
      paymentType: "player_joining",
      status: "created"
    });

    if (existingTx) {
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

    // Paid Flow: Create new Razorpay order
    const amount = team.playerJoiningFee;
    const options = {
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `receipt_join_${Date.now()}`,
      notes: {
        userId: req.user.userId,
        teamId,
        paymentType: "player_joining"
      }
    };

    const order = await razorpay.orders.create(options);

    const transaction = new Transaction({
      userId: req.user.userId,
      teamId,
      paymentType: "player_joining",
      amount,
      status: "created",
      razorpayOrderId: order.id,
      tempData: {
        userId: req.user.userId,
        teamId,
        coachId: team.captainId ? team.captainId.toString() : null
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
    console.error("initiatePlayerJoinPayment error:", error);
    res.status(500).json({ message: error.message });
  }
};

const teamLocks = new Map();

exports.verifyPlayerJoinPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    transactionId,
  } = req.body;

  // Verification payload validated in validator schema

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

  // Verify ownership
  if (transaction.userId.toString() !== req.user.userId) {
    return res.status(403).json({ success: false, message: "Unauthorized: You do not own this transaction" });
  }

  // Prevent duplicate verification
  if (transaction.status === "paid") {
    return res.status(400).json({ success: false, message: "Payment already completed." });
  }

  const teamId = transaction.teamId.toString();

  // Acquire lock per team
  while (teamLocks.has(teamId)) {
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  teamLocks.set(teamId, true);

  try {
    const team = await Team.findById(transaction.teamId);
    if (!team) {
      teamLocks.delete(teamId);
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    // Recheck player still exists
    const player = team.players.find(p => p.userId && p.userId.toString() === transaction.userId.toString());
    if (!player) {
      teamLocks.delete(teamId);
      return res.status(404).json({ success: false, message: "Player not found in team" });
    }

    // Recheck player status is approved_pending_payment
    if (player.status !== "approved_pending_payment") {
      if (player.status === "approved") {
        teamLocks.delete(teamId);
        return res.status(400).json({ success: false, message: "Player is already active." });
      }
      teamLocks.delete(teamId);
      return res.status(400).json({ success: false, message: `Player is not approved pending payment. Current status: ${player.status}` });
    }

    // DUPLICATE ACTIVE MEMBER PROTECTION
    const isAlreadyActive = team.players.some(
      p => p.userId && p.userId.toString() === transaction.userId.toString() && p.status === "approved"
    );
    if (isAlreadyActive) {
      teamLocks.delete(teamId);
      return res.status(400).json({ success: false, message: "Player is already an active member." });
    }

    // Update player status
    player.status = "approved";
    player.paymentStatus = "Paid";
    player.paymentDeadline = null;
    await team.save();

    // Update Transaction
    transaction.status = "paid";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.updatedAt = Date.now();
    await transaction.save();

    // Release lock
    teamLocks.delete(teamId);

    // Send notifications
    const Notification = require("../models/notification");
    const io = req.app.get("io");
    const users = req.app.get("users") || {};
    const playerUser = await User.findById(transaction.userId);

    // 1. PLAYER
    const pNotif = await Notification.create({
      userId: transaction.userId,
      message: "Your payment completed. Membership activated.",
      type: "player_activated",
      relatedId: team._id,
      isRead: false
    });
    const pSocket = users[transaction.userId.toString()];
    if (pSocket && io) {
      io.to(pSocket).emit("new_notification", pNotif);
    }

    // 2. COACH
    if (team.captainId) {
      const coachNotif = await Notification.create({
        userId: team.captainId,
        message: `Player ${playerUser.name} payment completed. Player became active member.`,
        type: "player_activated_coach",
        relatedId: team._id,
        isRead: false
      });
      const coachSocket = users[team.captainId.toString()];
      if (coachSocket && io) {
        io.to(coachSocket).emit("new_notification", coachNotif);
      }
    }

    // 3. ADMIN
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      const adminNotif = await Notification.create({
        userId: admin._id,
        message: `Player ${playerUser.name} payment completed. Player activated.`,
        type: "player_activated_admin",
        relatedId: team._id,
        isRead: false
      });
      const adminSocket = users[admin._id.toString()];
      if (adminSocket && io) {
        io.to(adminSocket).emit("new_notification", adminNotif);
      }
    }

    triggerDashboardUpdate(req, "player_activated");
    res.status(200).json({
      success: true,
      message: "Player joining payment verified and membership activated",
      team
    });


  } catch (error) {
    teamLocks.delete(teamId);
    console.error("verifyPlayerJoinPayment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.blockOrganizerJoin = (req, res, next) => {
  if (req.user && req.user.role === "organizer") {
    return res.status(403).json({
      message: "Organizers can view teams but cannot create, join, or manage team membership."
    });
  }
  res.status(404).json({ message: "Not found" });
};

