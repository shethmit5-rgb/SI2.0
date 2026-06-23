const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Notification = require("../models/notification");
const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const Razorpay = require("razorpay");

let razorpay = null;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} catch (error) {
  console.error("Razorpay initialization error in teamController:", error);
}


exports.createTeam = async (req, res, next) => {
  try {
    const { teamName, tournamentId, sportId, captainId } = req.body;

    if (req.user.role === "organizer") {
      return res.status(403).json({ message: "Organizers are not permitted to perform this action." });
    }

    if (req.user.role !== "coach" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only coaches can create teams." });
    }

    if (!teamName || !tournamentId || !sportId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

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
      players: [],
    });

    await Tournament.findByIdAndUpdate(tournamentId, {
      $addToSet: { teams: team._id },
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
    const teams = await Team.find({
      tournamentId: req.params.tournamentId,
    }).populate("captainId", "name");

    res.json(teams);
  } catch (err) {
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

    // Only captain can approve/reject
    if (!team.captainId || team.captainId._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: "Access denied. Only team captain can approve players." 
      });
    }

    const player = team.players.find(p => p.userId && p.userId.toString() === userId);
    if (!player) {
      return res.status(404).json({ message: "Player not found in team" });
    }

    if (action === "approved") {
      if (team.playerJoiningFee > 0) {
        player.status = "approved_pending_payment";
      } else {
        player.status = "approved";
      }
    } else {
      player.status = action; // "rejected" etc.
    }

    await team.save();

    // Get player details for notification
    const playerUser = await User.findById(userId);

    // Send notification to player
    const Notification = require("../models/notification");
    const notification = await Notification.create({
      userId: userId,
      message: player.status === "approved_pending_payment"
        ? `✅ Your request to join "${team.teamName}" has been approved! Please pay the joining fee of ₹${team.playerJoiningFee} to active your membership.`
        : (action === "approved" 
          ? `✅ Your request to join "${team.teamName}" has been APPROVED by captain ${team.captainId?.name || "the Captain"}!`
          : `❌ Your request to join "${team.teamName}" has been REJECTED by captain ${team.captainId?.name || "the Captain"}.`),
      type: action === "approved" ? "player_approved" : "player_rejected",
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
  } catch (err) {
    console.error("Approval error:", err);
    res.status(500).json({ message: "Failed to process request" });
  }
};

exports.getMyTeams = async (req, res, next) => {
  try {
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

    // Only captain can edit
    if (team.captainId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only captain can edit team" });
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

exports.initiateJoinPayment = async (req, res) => {
  try {
    const { teamId } = req.body;
    if (!teamId) {
      return res.status(400).json({ message: "Missing teamId field" });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: "Team not found" });

    // Check if player is actually approved pending payment
    const player = team.players.find(p => p.userId && p.userId.toString() === req.user.userId);
    if (!player) {
      return res.status(400).json({ message: "You are not a member of this team" });
    }
    if (player.status !== "approved_pending_payment") {
      return res.status(400).json({ message: `Your membership status is "${player.status}", not pending payment.` });
    }

    // If joining fee is 0 or less, directly approve
    if (!team.playerJoiningFee || team.playerJoiningFee === 0) {
      player.status = "approved";
      await team.save();
      return res.status(200).json({
        success: true,
        requiresPayment: false,
        message: "No joining fee required, membership activated."
      });
    }

    if (!razorpay) {
      return res.status(503).json({ message: "Payment service not configured" });
    }

    // Check for existing pending transaction
    let existingTx = await Transaction.findOne({
      userId: req.user.userId,
      teamId: teamId,
      paymentType: "player_joining",
      status: "created"
    });

    const tempData = {
      userId: req.user.userId,
      teamId
    };

    if (existingTx) {
      existingTx.tempData = tempData;
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

    // Create a new Razorpay order
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
      tempData: tempData
    });

    await transaction.save();

    res.status(200).json({
      success: true,
      requiresPayment: true,
      order,
      transactionId: transaction._id
    });

  } catch (error) {
    console.error("initiateJoinPayment error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.verifyJoinPayment = async (req, res) => {
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

    const team = await Team.findById(transaction.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: "Team not found" });
    }

    const expectedAmount = team.playerJoiningFee;
    if (transaction.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: "Transaction amount mismatch" });
    }

    // Update player status in the Team
    const player = team.players.find(p => p.userId && p.userId.toString() === transaction.userId.toString());
    if (!player) {
      return res.status(400).json({ success: false, message: "Player not found in team players list" });
    }

    player.status = "approved";
    await team.save();

    // Update Transaction
    transaction.status = "paid";
    transaction.razorpayPaymentId = razorpay_payment_id;
    transaction.razorpaySignature = razorpay_signature;
    transaction.updatedAt = Date.now();
    await transaction.save();

    // Send notification to player
    const notification = await Notification.create({
      userId: transaction.userId,
      message: `✅ Your membership in team "${team.teamName}" is now fully active!`,
      type: "player_approved",
      relatedId: team._id,
      isRead: false
    });

    const io = req.app.get("io");
    const users = req.app.get("users") || {};
    const playerSocket = users[transaction.userId.toString()];
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

    res.status(200).json({
      success: true,
      message: "Player joining payment verified and membership activated",
      team
    });
  } catch (error) {
    console.error("verifyJoinPayment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

