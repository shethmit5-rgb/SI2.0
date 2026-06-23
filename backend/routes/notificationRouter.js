const express = require("express");
const auth = require("../middleware/authMiddleware");
const {
  getNotifications,
  markAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const router = express.Router();

// GET notifications
router.get("/", auth, getNotifications);

// MARK AS READ
router.put("/:id", auth, markAsRead);

// DELETE notification
router.delete("/:id", auth, deleteNotification);

module.exports = router;