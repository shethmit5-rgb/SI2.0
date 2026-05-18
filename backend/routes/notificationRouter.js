const express = require("express");
const Notification = require("../models/notification");
const auth = require("../middleware/authMiddleware");

const router = express.Router();

// GET notifications
router.get("/", auth, async (req, res) => {
  const notifications = await Notification.find({
    userId: req.user.userId,
  }).sort({ createdAt: -1 });

  res.json(notifications);
});

// MARK AS READ
router.put("/:id", auth, async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, {
    isRead: true,
  });

  res.json({ message: "Marked as read" });
});

// DELETE notification
router.delete("/:id", auth, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;