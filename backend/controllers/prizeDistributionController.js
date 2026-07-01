const PrizeDistribution = require("../models/PrizeDistribution");
const Sponsor = require("../models/Sponsor");
const Tournament = require("../models/Tournament");
const Team = require("../models/Team");
const { distributeTournamentPrizes } = require("../utils/prizeDistributionHelper");

// GET all prize distributions (Admin only)
exports.getPrizeDistributions = async (req, res, next) => {
  try {
    const distributions = await PrizeDistribution.find()
      .populate("tournamentId", "eventName")
      .populate("winnerTeamId", "teamName")
      .populate("runnerUpTeamId", "teamName")
      .sort({ createdAt: -1 });

    res.json(distributions);
  } catch (err) {
    console.error("GET ALL DISTRIBUTIONS ERROR:", err);
    res.status(500).json({ message: "Failed to load distributions list" });
  }
};

// GET prize distribution by tournamentId (Public)
exports.getPrizeDistributionByTournament = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    const distribution = await PrizeDistribution.findOne({ tournamentId })
      .populate("tournamentId", "eventName winner runnerUp status")
      .populate("winnerTeamId", "teamName")
      .populate("runnerUpTeamId", "teamName");

    if (distribution) {
      return res.json({
        distributed: true,
        distributionId: distribution.distributionId,
        tournamentName: distribution.snapshots.tournamentName,
        winnerTeam: distribution.snapshots.winnerTeamName,
        runnerUpTeam: distribution.snapshots.runnerUpTeamName,
        sponsorName: distribution.snapshots.sponsorName,
        brandName: distribution.snapshots.brandName,
        brandLogo: distribution.snapshots.brandLogo,
        winnerPrizeTotal: distribution.snapshots.winnerPrizeTotal,
        runnerUpPrizeTotal: distribution.snapshots.runnerUpPrizeTotal,
        playersRewardedCount: distribution.playerRewards.length,
        distributedAt: distribution.distributedAt,
        playerRewards: distribution.playerRewards
      });
    }

    // Check if tournament is Completed but has no sponsor (or check if sponsor exists)
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    const titleSponsor = await Sponsor.findOne({
      tournamentId,
      type: "title",
      status: "active"
    });

    if (titleSponsor) {
      return res.json({
        distributed: false,
        sponsorName: titleSponsor.name,
        brandName: titleSponsor.name,
        brandLogo: titleSponsor.logo || "",
        winnerPrizeTotal: titleSponsor.winnerPrize || 0,
        runnerUpPrizeTotal: titleSponsor.runnerUpPrize || 0
      });
    }

    // No sponsor
    res.json({
      distributed: false,
      winnerPrizeTotal: 0,
      runnerUpPrizeTotal: 0,
      message: "No active Title Sponsor found. No prize distribution performed."
    });

  } catch (err) {
    console.error("GET TOURNAMENT DISTRIBUTION ERROR:", err);
    res.status(500).json({ message: "Failed to fetch tournament distribution detail" });
  }
};

// POST manual distribution by Admin (Admin only)
exports.manuallyDistributePrizes = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Invoke helper
    const result = await distributeTournamentPrizes(tournamentId, "Admin", req.user.userId, req);

    if (result.success === false) {
      if (result.code === "ALREADY_DISTRIBUTED") {
        return res.status(400).json({ message: "Prize has already been distributed for this tournament." });
      }
      return res.status(400).json({ message: result.message || "Failed to distribute prizes" });
    }

    res.json({
      message: "Prize distributed successfully",
      distributionId: result.distributionId,
      totalAmountDistributed: result.totalAmountDistributed
    });

  } catch (err) {
    console.error("MANUAL DISTRIBUTE ERROR:", err);
    res.status(500).json({ message: err.message || "Failed to manually distribute prizes" });
  }
};
