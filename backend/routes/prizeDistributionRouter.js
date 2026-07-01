const express = require("express");
const {
  getPrizeDistributions,
  getPrizeDistributionByTournament,
  manuallyDistributePrizes
} = require("../controllers/prizeDistributionController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// GET all distributions (Admin only)
router.get("/", auth, role("admin"), getPrizeDistributions);

// GET distribution detail for a tournament (Public)
router.get("/:tournamentId", getPrizeDistributionByTournament);

// POST manually distribute prizes for a tournament (Admin only)
router.post("/distribute/:tournamentId", auth, role("admin"), manuallyDistributePrizes);

module.exports = router;
