const express = require("express");
const {
  createSponsor,
  getSponsors,
  getSponsorshipStats,
  getPublicSponsors,
  updateSponsor,
  deleteSponsor,
  getSponsorsByTournament,
  getPublicSponsorsByTournament,
  selfSponsor,
  verifySelfPayment,
  getMySponsorships,
  getSponsorById,
} = require("../controllers/sponsorController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");

const router = express.Router();

/* ================= CREATE SPONSOR (ADMIN & ORGANIZER) ================= */
router.post("/", auth, upload.single("logo"), createSponsor);

/* ================= GET SPONSORS (ADMIN & ORGANIZER) ================= */
router.get("/", auth, getSponsors);

/* ================= GET SPONSORSHIP STATISTICS (ADMIN & ORGANIZER) ================= */
router.get("/stats", auth, getSponsorshipStats);

/* ================= PUBLIC GET SPONSORS (NO AUTH) ================= */
router.get("/public", getPublicSponsors);

/* ================= UPDATE SPONSOR (ADMIN & ORGANIZER) ================= */
router.put("/:id", auth, upload.single("logo"), updateSponsor);

/* ================= DELETE SPONSOR (ADMIN & ORGANIZER) ================= */
router.delete("/:id", auth, deleteSponsor);

/* ================= GET SPONSORS BY TOURNAMENT (AUTHENTICATED) ================= */
router.get("/tournament/:tournamentId", auth, getSponsorsByTournament);

/* ================= PUBLIC ROUTE - GET SPONSORS BY TOURNAMENT ================= */
router.get("/public/tournament/:tournamentId", getPublicSponsorsByTournament);

/* ================= SELF SPONSOR ORDER CREATION (SPONSOR ROLE) ================= */
router.post("/self-sponsor", auth, role("sponsor"), upload.single("logo"), selfSponsor);

/* ================= VERIFY SELF SPONSOR PAYMENT (SPONSOR ROLE) ================= */
router.post("/verify-self-payment", auth, role("sponsor"), verifySelfPayment);

/* ================= GET MY SPONSORSHIPS (SPONSOR ROLE) ================= */
router.get("/my-sponsorships", auth, role("sponsor"), getMySponsorships);

/* ================= GET SINGLE SPONSOR BY ID ================= */
router.get("/:id", auth, getSponsorById);

module.exports = router;