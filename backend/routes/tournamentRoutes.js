const express = require("express");
const {
  createTournament,
  getMyTournaments,
  getPublicTournaments,
  getPublicTournamentById,
  getTournaments,
  getTournamentById,
  updateTournament,
  deleteTournament,
  getMatchesByTournament,
  getRoundInfo,
  verifyTournamentPayment,
} = require("../controllers/tournamentController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const {
  createTournamentValidator,
  verifyTournamentPaymentValidator,
  getTournamentValidator,
  updateTournamentValidator,
  deleteTournamentValidator,
  getTournamentMatchesValidator,
  getTournamentRoundInfoValidator
} = require("../validators/tournament.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/* =========================================================
   CREATE TOURNAMENT (ADMIN)
   ========================================================= */
// ================= ORGANIZER CAN CREATE TOURNAMENT =================
router.post("/", auth, role("admin", "organizer"), upload.single("logo"), createTournamentValidator, validateRequest, createTournament);

router.post("/verify-payment", auth, verifyTournamentPaymentValidator, validateRequest, verifyTournamentPayment);

// ================= GET MY TOURNAMENTS (FOR ORGANIZER) =================
router.get("/my-tournaments", auth, getMyTournaments);

/* =========================================================
   PUBLIC - GET ALL TOURNAMENTS (NO AUTH REQUIRED)
   ========================================================= */
router.get("/public", getPublicTournaments);

/* =========================================================
   PUBLIC - GET SINGLE TOURNAMENT (NO AUTH REQUIRED)
   ========================================================= */
router.get("/public/:id", getTournamentValidator, validateRequest, getPublicTournamentById);

/* =========================================================
   ADMIN ONLY - GET ALL TOURNAMENTS
   ========================================================= */
router.get("/", auth, role("admin", "organizer"), getTournaments);

/* =========================================================
   GET SINGLE TOURNAMENT (AUTH OPTIONAL)
   ========================================================= */
router.get("/:id", getTournamentValidator, validateRequest, getTournamentById);

/* =========================================================
   UPDATE TOURNAMENT (ADMIN)
   ========================================================= */
router.put("/:id", auth, role("admin", "organizer"), upload.single("logo"), updateTournamentValidator, validateRequest, updateTournament);

/* =========================================================
   DELETE TOURNAMENT (ADMIN)
   ========================================================= */
router.delete("/:id", auth, role("admin"), deleteTournamentValidator, validateRequest, deleteTournament);

/* =========================================================
   GET MATCHES BY TOURNAMENT (PUBLIC)
   ========================================================= */
router.get("/:id/matches", getTournamentMatchesValidator, validateRequest, getMatchesByTournament);

/* =========================================================
   GET TOURNAMENT ROUND INFO (ADMIN & ORGANIZER)
   ========================================================= */
router.get("/:id/round-info", auth, role("admin", "organizer"), getTournamentRoundInfoValidator, validateRequest, getRoundInfo);

module.exports = router;