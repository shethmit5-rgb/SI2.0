const express = require("express");
const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Notification = require("../models/notification");

const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

/* =========================================================
   CREATE TEAM
========================================================= */
router.post("/", auth, async (req, res) => {
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
});



/* =========================================================
   ADMIN: GET ALL TEAMS
========================================================= */
router.get("/", auth, role("admin"), async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("tournamentId", "eventName")
      .populate("sportId", "name")
      .populate("captainId", "name email role")
      .populate("players.userId", "name email");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch teams" });
  }
});

/* =========================================================
   GET TEAMS BY TOURNAMENT
========================================================= */
router.get("/tournament/:tournamentId", auth, async (req, res) => {
  try {
    const teams = await Team.find({
      tournamentId: req.params.tournamentId,
    }).populate("captainId", "name");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: "Failed to load teams" });
  }
});

/* =========================================================
   PLAYER APPLY TO TEAM
========================================================= */
router.post("/:teamId/apply", auth, async (req, res) => {
  try {
    if (req.user.role === "organizer") {
      return res.status(403).json({ message: "Organizers are not permitted to perform this action." });
    }

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
});

/* =========================================================
   CAPTAIN APPROVE / REJECT PLAYER
========================================================= */
// ================= CAPTAIN ONLY - APPROVE/REJECT PLAYER =================
// ================= CAPTAIN ONLY - APPROVE/REJECT PLAYER =================
router.put("/:teamId/approve", auth, async (req, res) => {
  try {
    const { userId, action } = req.body;
    const team = await Team.findById(req.params.teamId).populate("captainId", "name");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // ✅ CRITICAL FIX: Only captain can approve/reject
    if (!team.captainId || team.captainId._id.toString() !== req.user.userId) {
      return res.status(403).json({ 
        message: "Access denied. Only team captain can approve players." 
      });
    }

    const player = team.players.find(p => p.userId && p.userId.toString() === userId);
    if (!player) {
      return res.status(404).json({ message: "Player not found in team" });
    }

    player.status = action;
    await team.save();

    // Get player details for notification
    const playerUser = await User.findById(userId);

    // Send notification to player
    const Notification = require("../models/notification");
    const notification = await Notification.create({
      userId: userId,
      message: action === "approved" 
        ? `✅ Your request to join "${team.teamName}" has been APPROVED by captain ${team.captainId?.name || "the Captain"}!`
        : `❌ Your request to join "${team.teamName}" has been REJECTED by captain ${team.captainId?.name || "the Captain"}.`,
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
});
/* =========================================================
   GET MY TEAMS
========================================================= */
router.get("/my-teams", auth, async (req, res) => {
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
});

/* =========================================================
   GET CAPTAIN TEAMS
========================================================= */
router.get("/captain-teams", auth, async (req, res) => {
  try {
    const teams = await Team.find({
      captainId: req.user.userId,
    }).populate("players.userId", "name email");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   PUBLIC TEAMS
========================================================= */
router.get("/public", async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("tournamentId", "eventName")
      .populate("captainId", "name");

    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   GET SINGLE TEAM
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("captainId", "name email")
      .populate("players.userId", "name email")
      .populate("tournamentId", "eventName")
      .populate("sportId", "name");

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch team" });
  }
});

/* =========================================================
   ADMIN UPDATE / DELETE
========================================================= */
// ================= EDIT TEAM (CAPTAIN ONLY) =================
router.put("/:id", auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Only captain can edit
    if (team.captainId.toString() !== req.user.userId) {
      return res.status(403).json({ message: "Only captain can edit team" });
    }

    const { teamName } = req.body;
    
    if (teamName) {
      team.teamName = teamName;
    }

    await team.save();
    res.json({ message: "Team updated successfully", team });
  } catch (err) {
    console.error("Edit team error:", err);
    res.status(500).json({ message: "Failed to update team" });
  }
});

router.delete("/:id", auth, role("admin"), async (req, res) => {
  await Team.findByIdAndDelete(req.params.id);
  res.json({ message: "Team deleted" });
});

// ================= LEAVE TEAM (PLAYER) =================
router.delete("/:teamId/leave", auth, async (req, res) => {
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
});

// ================= DELETE TEAM (CAPTAIN ONLY) =================
router.delete("/:id/delete", auth, async (req, res) => {
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
});

module.exports = router;