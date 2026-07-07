const express = require("express");
const {
  getPrizeDistributions,
  getPrizeDistributionByTournament,
  manuallyDistributePrizes
} = require("../controllers/prizeDistributionController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  getPrizeDistributionByTournamentValidator,
  distributePrizesValidator
} = require("../validators/prizeDistribution.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// GET all distributions (Admin only)
router.get("/", auth, role("admin"), getPrizeDistributions);

// GET distribution detail for a tournament (Public)
router.get("/:tournamentId", getPrizeDistributionByTournamentValidator, validateRequest, getPrizeDistributionByTournament);

// POST manually distribute prizes for a tournament (Admin only)
router.post("/distribute/:tournamentId", auth, role("admin"), distributePrizesValidator, validateRequest, manuallyDistributePrizes);

module.exports = router;
