const express = require("express");
const Registration = require("../models/Registration");
const Tournament = require("../models/Tournament");
const Notification = require("../models/notification");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

/* ================= PLAYER → REGISTER TEAM ================= */
router.post("/", auth, role("player", "coach"), async (req, res) => {
  try {
    if (req.user.role === "organizer") {
      return res.status(403).json({ message: "Organizers are not permitted to perform this action." });
    }

    const { tournamentId, teamId } = req.body;

    const exists = await Registration.findOne({
      tournamentId,
      teamId,
    });

    if (exists) {
      return res.status(400).json({ message: "Team already registered" });
    }

    const reg = await Registration.create({
      userId: req.user.userId,
      tournamentId,
      teamId,
    });

    res.status(201).json(reg);
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ================= GET MY REGISTRATIONS (PLAYER) ================= */
router.get("/my-registrations", auth, async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user.userId })
      .populate("tournamentId", "eventName startDate status prizePool")
      .populate("teamId", "teamName");

    res.json(registrations);
  } catch (err) {
    console.error("MY REGISTRATIONS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch your registrations" });
  }
});

/* ================= ADMIN → GET ALL REGISTRATIONS ================= */
router.get("/", auth, role("admin"), async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate("userId", "name email")
      .populate("teamId", "teamName")
      .populate({
        path: "tournamentId",
        select: "eventName sportId",
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
});

/* ================= ADMIN → UPDATE REGISTRATION ================= */
router.put("/:id", auth, role("admin"), async (req, res) => {
  try {
    const { approvalStatus, paymentStatus } = req.body;

    const reg = await Registration.findById(req.params.id)
      .populate("userId", "name")
      .populate("teamId", "teamName");
      
    if (!reg) {
      return res.status(404).json({ message: "Registration not found" });
    }

    /* UPDATE STATUS */
    if (approvalStatus) {
      reg.approvalStatus = approvalStatus;

      // ✅ Push team ONLY when approved
      if (approvalStatus === "approved") {
        await Tournament.findByIdAndUpdate(
          reg.tournamentId,
          { $addToSet: { teams: reg.teamId } }
        );
        
        // 🔔 CREATE NOTIFICATION FOR USER
        const notification = await Notification.create({
          userId: reg.userId._id,
          message: `✅ Your team "${reg.teamId.teamName}" has been APPROVED for the tournament!`,
          type: "registration_approved",
          relatedId: reg.tournamentId,
          isRead: false
        });
        
        // 🔥 SOCKET EMIT
        const io = req.app.get("io");
        const users = req.app.get("users");
        const userSocket = users[reg.userId._id.toString()];
        
        if (userSocket && io) {
          io.to(userSocket).emit("new_notification", {
            _id: notification._id,
            message: notification.message,
            type: notification.type,
            relatedId: notification.relatedId,
            isRead: false
          });
        }
      }
      
      // 🔔 REJECTION NOTIFICATION
      if (approvalStatus === "rejected") {
        const notification = await Notification.create({
          userId: reg.userId._id,
          message: `❌ Your team "${reg.teamId.teamName}" registration was REJECTED.`,
          type: "registration_rejected",
          relatedId: reg.tournamentId,
          isRead: false
        });
        
        const io = req.app.get("io");
        const users = req.app.get("users");
        const userSocket = users[reg.userId._id.toString()];
        
        if (userSocket && io) {
          io.to(userSocket).emit("new_notification", notification);
        }
      }
    }

    if (paymentStatus) {
      reg.paymentStatus = paymentStatus;
    }

    await reg.save();
    res.json(reg);

  } catch (err) {
    console.error("UPDATE REG ERROR:", err);
    res.status(500).json({ message: "Update failed" });
  }
});

/* ================= CHECK REGISTRATION STATUS ================= */
router.get("/check/:tournamentId/:teamId", auth, async (req, res) => {
  try {
    const registration = await Registration.findOne({
      tournamentId: req.params.tournamentId,
      teamId: req.params.teamId
    });
    res.json(registration);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= CANCEL REGISTRATION =================
router.delete("/:id/cancel", auth, async (req, res) => {
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
});

module.exports = router;