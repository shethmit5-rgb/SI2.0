const Notification = require("../models/notification");

// GET notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      userId: req.user.userId,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (err) {
    next(err);
  }
};

// MARK AS READ
exports.markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.json({ message: "Marked as read" });
  } catch (err) {
    next(err);
  }
};

// DELETE notification
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
