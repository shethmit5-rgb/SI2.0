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
const validateObjectId = require("../middleware/validateObjectId");

const router = express.Router();

/* =========================================================
   CREATE TOURNAMENT (ADMIN)
   ========================================================= */
// ================= ORGANIZER CAN CREATE TOURNAMENT =================
router.post("/", auth, role("admin", "organizer"), upload.single("logo"), createTournament);

router.post("/verify-payment", auth, verifyTournamentPayment);

// ================= GET MY TOURNAMENTS (FOR ORGANIZER) =================
router.get("/my-tournaments", auth, getMyTournaments);

/* =========================================================
   PUBLIC - GET ALL TOURNAMENTS (NO AUTH REQUIRED)
   ========================================================= */
router.get("/public", getPublicTournaments);

/* =========================================================
   PUBLIC - GET SINGLE TOURNAMENT (NO AUTH REQUIRED)
   ========================================================= */
router.get("/public/:id", validateObjectId, getPublicTournamentById);

/* =========================================================
   ADMIN ONLY - GET ALL TOURNAMENTS
   ========================================================= */
router.get("/", auth, role("admin", "organizer"), getTournaments);

/* =========================================================
   GET SINGLE TOURNAMENT (AUTH OPTIONAL)
   ========================================================= */
router.get("/:id", validateObjectId, getTournamentById);

/* =========================================================
   UPDATE TOURNAMENT (ADMIN)
   ========================================================= */
router.put("/:id", auth, role("admin", "organizer"), upload.single("logo"), validateObjectId, updateTournament);

/* =========================================================
   DELETE TOURNAMENT (ADMIN)
   ========================================================= */
router.delete("/:id", auth, role("admin"), validateObjectId, deleteTournament);

/* =========================================================
   GET MATCHES BY TOURNAMENT (PUBLIC)
   ========================================================= */
router.get("/:id/matches", validateObjectId, getMatchesByTournament);

/* =========================================================
   GET TOURNAMENT ROUND INFO (ADMIN & ORGANIZER)
   ========================================================= */
router.get("/:id/round-info", auth, role("admin", "organizer"), validateObjectId, getRoundInfo);

module.exports = router;