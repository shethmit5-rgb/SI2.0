const express = require("express");
const { getStats, getRealtime, getOrganizerStats } = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all analytics stats
router.get("/stats", auth, role("admin", "organizer"), getStats);

// Get real-time updates via Socket.IO
router.get("/realtime", auth, role("admin", "organizer"), getRealtime);

// GET organizer-stats
router.get("/organizer-stats", auth, role("admin", "organizer"), getOrganizerStats);

module.exports = router;