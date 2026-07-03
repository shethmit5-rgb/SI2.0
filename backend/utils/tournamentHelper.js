const Tournament = require("../models/Tournament");
const Match = require("../models/Match");

/**
 * Dynamically computes a tournament's status based on start and end dates.
 * * Before start date = upcoming
 * * Between start date and end date (inclusive) = ongoing
 * * After end date = completed
 */
function getTournamentStatus(startDate, endDate) {
  if (!startDate || !endDate) return "upcoming";

  const now = new Date();
  
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now < start) {
    return "upcoming";
  } else if (now > end) {
    return "completed";
  } else {
    return "ongoing";
  }
}

/**
 * Calculates current knockout round details for a tournament.
 */
async function getTournamentRoundInfo(tournamentId) {
  const tournament = await Tournament.findById(tournamentId).populate("teams");
  if (!tournament) {
    throw new Error("Tournament not found");
  }

  const matches = await Match.find({ tournamentId });

  let round = 1;
  let currentRoundTeams = [...tournament.teams];
  let isCompleted = false;
  let winner = null;

  while (true) {
    const numTeams = currentRoundTeams.length;
    if (numTeams === 0) {
      isCompleted = true;
      break;
    }
    if (numTeams === 1) {
      isCompleted = true;
      winner = currentRoundTeams[0];
      break;
    }

    const expectedMatches = Math.floor(numTeams / 2);
    const roundMatches = matches.filter((m) => m.round === round);
    const createdMatchesCount = roundMatches.length;
    const allCompleted = createdMatchesCount > 0 && roundMatches.every((m) => m.status === "completed");

    if (createdMatchesCount === expectedMatches && allCompleted) {
      // Advance winners to the next round
      const nextRoundTeams = [];
      for (const match of roundMatches) {
        if (match.result && match.result.winnerTeamId) {
          const wTeam = currentRoundTeams.find(
            (t) => t._id.toString() === match.result.winnerTeamId.toString()
          );
          if (wTeam) {
            nextRoundTeams.push(wTeam);
          }
        }
      }
      currentRoundTeams = nextRoundTeams;
      round += 1;
    } else {
      // This is the current active round
      break;
    }
  }

  // Calculate available teams for current active round
  let availableTeams = [];
  if (!isCompleted) {
    const roundMatches = matches.filter((m) => m.round === round);
    const matchedTeamIds = new Set();
    for (const match of roundMatches) {
      for (const teamId of match.teams) {
        matchedTeamIds.add(teamId.toString());
      }
    }
    availableTeams = currentRoundTeams.filter(
      (t) => !matchedTeamIds.has(t._id.toString())
    );
  }

  return {
    currentRound: round,
    eligibleTeams: currentRoundTeams,
    availableTeams,
    isCompleted,
    winner,
    tournament,
  };
}

/**
 * Dynamically updates statuses for all tournaments based on the current date.
 */
async function checkAndUpdateTournamentStatuses() {
  const now = new Date();

  // 1. Before start date -> upcoming
  await Tournament.updateMany(
    { startDate: { $gt: now }, status: { $ne: "upcoming" } },
    { status: "upcoming" }
  );

  // 2. After end date -> completed
  await Tournament.updateMany(
    { endDate: { $lt: now }, status: { $ne: "completed" } },
    { status: "completed" }
  );

  // 3. Between start and end date (inclusive) -> ongoing
  await Tournament.updateMany(
    {
      startDate: { $lte: now },
      endDate: { $gte: now },
      status: { $ne: "ongoing" }
    },
    { status: "ongoing" }
  );

  // 4. Automatic recovery / self-healing trigger
  try {
    const PrizeDistribution = require("../models/PrizeDistribution");
    const { distributeTournamentPrizes } = require("./prizeDistributionHelper");

    // Find completed tournaments with winner and runner-up declared
    const completedTournaments = await Tournament.find({
      status: "completed",
      winner: { $ne: null },
      runnerUp: { $ne: null }
    });

    for (const t of completedTournaments) {
      const existingDist = await PrizeDistribution.findOne({ tournamentId: t._id });
      if (!existingDist) {
        console.log(`[AutoRecovery] Tournament "${t.eventName}" (${t._id}) has winner/runner-up declared but no prize distribution found. Triggering distribution...`);
        try {
          const distResult = await distributeTournamentPrizes(t._id, "System");
          console.log(`[AutoRecovery] Automatic prize distribution result for "${t.eventName}":`, distResult);
        } catch (distErr) {
          console.error(`[AutoRecovery] Automatic prize distribution failed for "${t.eventName}":`, distErr.message);
        }
      }
    }
  } catch (recoveryErr) {
    console.error("[AutoRecovery] Error during auto prize distribution recovery check:", recoveryErr);
  }
}

function triggerDashboardUpdate(req, type) {
  try {
    const io = req.app?.get("io");
    if (io) {
      io.emit("dashboard_update", { type });
    }
  } catch (err) {
    console.error("Socket.IO dashboard update emit failed:", err);
  }
}

module.exports = {
  getTournamentStatus,
  getTournamentRoundInfo,
  checkAndUpdateTournamentStatuses,
  triggerDashboardUpdate,
};


