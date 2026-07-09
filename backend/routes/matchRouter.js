const express = require("express");
const {
  createMatch,
  getMatches,
  getMySchedule,
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
const {
  createMatchValidator,
  getMatchesByTournamentValidator,
  updateMatchResultValidator,
  getMatchByIdValidator,
  updateMatchValidator,
  deleteMatchValidator
} = require("../validators/match.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/* ================= CREATE MATCH (ADMIN & ORGANIZER) ================= */
router.post("/", auth, role("admin", "organizer"), createMatchValidator, validateRequest, createMatch);

/* ================= GET ALL MATCHES (ADMIN & ORGANIZER) ================= */
router.get("/", auth, getMatches);

/* ================= GET MY MATCHES SCHEDULE (COACH & PLAYER) ================= */
router.get("/my-schedule", auth, getMySchedule);

/* ================= GET MATCHES BY TOURNAMENT (PUBLIC - NO AUTH) ================= */
router.get("/tournament/:id", getMatchesByTournamentValidator, validateRequest, getMatchesByTournament);

router.get("/public/tournament/:id", getMatchesByTournamentValidator, validateRequest, getPublicMatchesByTournament);

/* ================= GET UPCOMING MATCHES (PUBLIC - NO AUTH) ================= */
router.get("/public/upcoming", getUpcomingMatches);

/* ================= GET COMPLETED MATCHES (PUBLIC - NO AUTH) ================= */
router.get("/public/completed", getCompletedMatches);

/* ================= UPDATE MATCH RESULT (ADMIN & ORGANIZER) ================= */
router.put("/:id/result", auth, role("admin", "organizer"), updateMatchResultValidator, validateRequest, updateMatchResult);

/* ================= GET SINGLE MATCH (PUBLIC) ================= */
router.get("/:id", getMatchByIdValidator, validateRequest, getMatchById);

/* ================= UPDATE MATCH DETAILS (ADMIN & ORGANIZER) ================= */
router.put("/:id", auth, role("admin", "organizer"), updateMatchValidator, validateRequest, updateMatch);

/* ================= DELETE MATCH (ADMIN & ORGANIZER) ================= */
router.delete("/:id", auth, role("admin", "organizer"), deleteMatchValidator, validateRequest, deleteMatch);

module.exports = router;