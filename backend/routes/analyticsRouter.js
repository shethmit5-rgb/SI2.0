const express = require("express");
const { 
  getStats, 
  getRealtime, 
  getOrganizerStats,
  getPlayerDashboard,
  getCoachDashboard,
  getOrganizerDashboard,
  getSponsorDashboard
} = require("../controllers/analyticsController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// Get all analytics stats
router.get("/stats", auth, role("admin", "organizer"), getStats);

// Get real-time updates via Socket.IO
router.get("/realtime", auth, role("admin", "organizer"), getRealtime);

// GET organizer-stats
router.get("/organizer-stats", auth, role("admin", "organizer"), getOrganizerStats);

// Role-specific dashboards
router.get("/player-dashboard", auth, role("player"), getPlayerDashboard);
router.get("/coach-dashboard", auth, role("coach"), getCoachDashboard);
router.get("/organizer-dashboard", auth, role("organizer"), getOrganizerDashboard);
router.get("/sponsor-dashboard", auth, role("sponsor"), getSponsorDashboard);

module.exports = router;