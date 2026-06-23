const express = require("express");
const {
  createMatch,
  getMatches,
  getMatchesByTournament,
  getPublicMatchesByTournament,
  getUpcomingMatches,
  getCompletedMatches,
  updateMatchResult,
  getMatchById,
  updateMatch,
  deleteMatch,
} = require("../controllers/matchController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

/* ================= CREATE MATCH (ADMIN & ORGANIZER) ================= */
router.post("/", auth, role("admin", "organizer"), createMatch);

/* ================= GET ALL MATCHES (ADMIN & ORGANIZER) ================= */
router.get("/", auth, getMatches);

/* ================= GET MATCHES BY TOURNAMENT (PUBLIC - NO AUTH) ================= */
router.get("/tournament/:id", validateObjectId, getMatchesByTournament);

router.get("/public/tournament/:id", validateObjectId, getPublicMatchesByTournament);

/* ================= GET UPCOMING MATCHES (PUBLIC - NO AUTH) ================= */
router.get("/public/upcoming", getUpcomingMatches);

/* ================= GET COMPLETED MATCHES (PUBLIC - NO AUTH) ================= */
router.get("/public/completed", getCompletedMatches);

/* ================= UPDATE MATCH RESULT (ADMIN & ORGANIZER) ================= */
router.put("/:id/result", auth, role("admin", "organizer"), validateObjectId, updateMatchResult);

/* ================= GET SINGLE MATCH (PUBLIC) ================= */
router.get("/:id", validateObjectId, getMatchById);

/* ================= UPDATE MATCH DETAILS (ADMIN & ORGANIZER) ================= */
router.put("/:id", auth, role("admin", "organizer"), validateObjectId, updateMatch);

/* ================= DELETE MATCH (ADMIN & ORGANIZER) ================= */
router.delete("/:id", auth, role("admin", "organizer"), validateObjectId, deleteMatch);

module.exports = router;