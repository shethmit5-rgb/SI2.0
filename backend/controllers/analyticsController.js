const Tournament = require("../models/Tournament");
const User = require("../models/User");
const Match = require("../models/Match");
const Team = require("../models/Team");
const Sponsor = require("../models/Sponsor");
const Registration = require("../models/Registration");
const Transaction = require("../models/Transaction");
const { checkAndUpdateTournamentStatuses } = require("../utils/tournamentHelper");

// Helper function to get analytics data
async function getAnalyticsData() {
  await checkAndUpdateTournamentStatuses();
  const [users, tournaments, matches, teams, sponsors, registrations] = await Promise.all([
    User.countDocuments(),
    Tournament.countDocuments(),
    Match.countDocuments(),
    Team.countDocuments(),
    Sponsor.countDocuments(),
    Registration.countDocuments(),
  ]);

  const upcomingTournaments = await Tournament.countDocuments({ status: "upcoming" });
  const ongoingTournaments = await Tournament.countDocuments({ status: "ongoing" });
  const completedTournaments = await Tournament.countDocuments({ status: "completed" });

  const tournamentsData = await Tournament.find();
  const totalPrizePool = tournamentsData.reduce((sum, t) => sum + (t.prizePool || 0), 0);

  return {
    stats: {
      users,
      tournaments,
      matches,
      teams,
      sponsors,
      registrations,
      totalPrizePool,
      upcomingTournaments,
      ongoingTournaments,
      completedTournaments,
    }
  };
}

exports.getStats = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    const [users, tournaments, matches, teams, sponsors, registrations] = await Promise.all([
      User.countDocuments(),
      Tournament.countDocuments(),
      Match.countDocuments(),
      Team.countDocuments(),
      Sponsor.countDocuments(),
      Registration.countDocuments(),
    ]);

    // Get tournament status distribution
    const upcomingTournaments = await Tournament.countDocuments({ status: "upcoming" });
    const ongoingTournaments = await Tournament.countDocuments({ status: "ongoing" });
    const completedTournaments = await Tournament.countDocuments({ status: "completed" });

    // Get total prize pool
    const tournamentsData = await Tournament.find();
    const totalPrizePool = tournamentsData.reduce((sum, t) => sum + (t.prizePool || 0), 0);

    // Get monthly tournament data (last 12 months)
    const monthlyData = await Tournament.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyData = monthlyData.map(item => ({
      month: months[item._id.month - 1],
      count: item.count
    })).reverse();

    // Get sport distribution
    const sportDistribution = await Tournament.aggregate([
      {
        $lookup: {
          from: "sports",
          localField: "sportId",
          foreignField: "_id",
          as: "sport"
        }
      },
      { $unwind: { path: "$sport", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $ifNull: ["$sport.name", "Unknown"] },
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedSportDistribution = sportDistribution.map(item => ({
      name: item._id,
      count: item.count
    }));

    const PrizeDistribution = require("../models/PrizeDistribution");
    const distRecords = await PrizeDistribution.find();
    const totalPrizeDistributed = distRecords.reduce((sum, d) => sum + (d.totalAmountDistributed || 0), 0);
    const totalDistributionsCompleted = distRecords.length;

    const data = {
      stats: {
        users,
        tournaments,
        matches,
        teams,
        sponsors,
        registrations,
        totalPrizePool,
        upcomingTournaments,
        ongoingTournaments,
        completedTournaments,
        totalPrizeDistributed,
        totalDistributionsCompleted,
      },
      monthlyData: formattedMonthlyData,
      sportDistribution: formattedSportDistribution,
      statusDistribution: {
        upcoming: upcomingTournaments,
        ongoing: ongoingTournaments,
        completed: completedTournaments,
      }
    };

    res.json(data);
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getRealtime = async (req, res, next) => {
  try {
    const io = req.app.get("io");

    // Send initial data
    const initialData = await getAnalyticsData();
    res.json(initialData);

    // Set up interval for real-time updates (every 30 seconds)
    const interval = setInterval(async () => {
      const updatedData = await getAnalyticsData();
      io.emit("analytics_update", updatedData);
    }, 30000);

    // Clear interval when connection closes
    req.on("close", () => {
      clearInterval(interval);
    });
  } catch (err) {
    console.error("Realtime Error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.getOrganizerStats = async (req, res, next) => {
  try {
    await checkAndUpdateTournamentStatuses();
    const [
      totalTeams,
      totalTournaments,
      activeTournaments,
      upcomingTournaments,
      completedTournaments,
      totalMatches,
      scheduledMatches,
      ongoingMatches,
      completedMatches,
      totalRegistrations,
      approvedRegistrations,
      pendingRegistrations
    ] = await Promise.all([
      Team.countDocuments(),
      Tournament.countDocuments(),
      Tournament.countDocuments({ status: "ongoing" }),
      Tournament.countDocuments({ status: "upcoming" }),
      Tournament.countDocuments({ status: "completed" }),
      Match.countDocuments(),
      Match.countDocuments({ status: "scheduled" }),
      Match.countDocuments({ status: "ongoing" }),
      Match.countDocuments({ status: "completed" }),
      Registration.countDocuments(),
      Registration.countDocuments({ approvalStatus: "approved" }),
      Registration.countDocuments({ approvalStatus: { $in: ["pending", "approved_pending_payment"] } })
    ]);

    // Teams by Tournament
    const teamsByTournamentRaw = await Team.aggregate([
      {
        $lookup: {
          from: "tournaments",
          localField: "tournamentId",
          foreignField: "_id",
          as: "tournament"
        }
      },
      { $unwind: "$tournament" },
      {
        $group: {
          _id: "$tournament.eventName",
          count: { $sum: 1 }
        }
      }
    ]);
    const teamsByTournament = teamsByTournamentRaw.map(t => ({ name: t._id, count: t.count }));

    // Teams by Sport
    const teamsBySportRaw = await Team.aggregate([
      {
        $lookup: {
          from: "sports",
          localField: "sportId",
          foreignField: "_id",
          as: "sport"
        }
      },
      { $unwind: "$sport" },
      {
        $group: {
          _id: "$sport.name",
          count: { $sum: 1 }
        }
      }
    ]);
    const teamsBySport = teamsBySportRaw.map(s => ({ name: s._id, count: s.count }));

    res.json({
      teamsOverview: {
        total: totalTeams,
        byTournament: teamsByTournament,
        bySport: teamsBySport
      },
      tournamentOverview: {
        total: totalTournaments,
        active: activeTournaments,
        upcoming: upcomingTournaments,
        completed: completedTournaments
      },
      matchOverview: {
        total: totalMatches,
        scheduled: scheduledMatches,
        ongoing: ongoingMatches,
        completed: completedMatches
      },
      registrationOverview: {
        total: totalRegistrations,
        approved: approvedRegistrations,
        pending: pendingRegistrations
      }
    });

  } catch (err) {
    console.error("Organizer stats error:", err);
    res.status(500).json({ message: "Failed to fetch organizer stats" });
  }
};

/* ================= ROLE-BASED DASHBOARD ANALYTICS ================= */

// Helper to resolve tournament runner-up
async function getTournamentRunnerUp(tournamentId) {
  try {
    const finalMatch = await Match.findOne({ tournamentId }).sort({ round: -1 }).populate("teams");
    if (!finalMatch || finalMatch.status !== "completed" || !finalMatch.result || !finalMatch.result.winnerTeamId) {
      return null;
    }
    const winnerId = finalMatch.result.winnerTeamId.toString();
    const runnerUpTeam = finalMatch.teams.find(t => t && t._id.toString() !== winnerId);
    return runnerUpTeam || null;
  } catch (err) {
    console.error("Error getting tournament runner up:", err);
    return null;
  }
}

// Helper to resolve tournament prizes
async function getTournamentPrizes(tournamentId, startDate) {
  const titleSponsor = await Sponsor.findOne({
    tournamentId: tournamentId,
    type: "title",
    status: "active"
  });

  if (titleSponsor) {
    return {
      winnerPrize: titleSponsor.winnerPrize || 0,
      runnerUpPrize: titleSponsor.runnerUpPrize || 0
    };
  } else {
    const today = new Date();
    if (new Date(startDate) <= today) {
      return {
        winnerPrize: 100000,
        runnerUpPrize: 50000
      };
    } else {
      return {
        winnerPrize: 0,
        runnerUpPrize: 0
      };
    }
  }
}

// 1. PLAYER DASHBOARD
exports.getPlayerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await checkAndUpdateTournamentStatuses();

    // Find all teams where this user is approved and paid
    const playerTeams = await Team.find({
      players: {
        $elemMatch: {
          userId: userId,
          status: "approved",
          paymentStatus: "Paid"
        }
      }
    }).populate("tournamentId").populate("sportId");

    const teamIds = playerTeams.map(t => t._id);

    if (teamIds.length === 0) {
      return res.json({
        stats: {
          totalMatchesPlayed: 0,
          matchesWon: 0,
          matchesLost: 0,
          winRate: 0,
          tournamentsParticipated: 0,
          tournamentsWon: 0,
          runnerUpFinishes: 0,
          currentTeam: "0",
          currentSport: "0"
        },
        financials: {
          totalJoiningFeesPaid: 0,
          totalPrizeMoneyEarned: 0,
          netProfitLoss: 0
        },
        latestPrizeReceived: 0,
        prizeHistory: [],
        paymentHistory: [],
        matchHistory: [],
        tournamentHistory: [],
        upcomingMatches: [],
        notifications: []
      });
    }

    // Total Matches Played (completed matches featuring these teams)
    const matchesPlayed = await Match.find({
      teams: { $in: teamIds },
      status: "completed"
    }).populate("teams", "teamName").populate("tournamentId", "eventName");

    let matchesWon = 0;
    let matchesLost = 0;

    for (const match of matchesPlayed) {
      if (match.result && match.result.winnerTeamId) {
        if (teamIds.some(id => id.toString() === match.result.winnerTeamId.toString())) {
          matchesWon++;
        } else {
          matchesLost++;
        }
      }
    }

    const winRate = matchesPlayed.length > 0 ? ((matchesWon / matchesPlayed.length) * 100).toFixed(1) : 0;

    // Tournaments Participated
    const tournamentsMap = new Map();
    for (const team of playerTeams) {
      if (team.tournamentId) {
        tournamentsMap.set(team.tournamentId._id.toString(), team.tournamentId);
      }
    }
    const tournamentsParticipated = tournamentsMap.size;

    // Fetch all prize distributions for this player
    const PrizeDistribution = require("../models/PrizeDistribution");
    const distributions = await PrizeDistribution.find({
      "playerRewards.userId": userId
    });

    let totalPrizeMoneyEarned = 0;
    let tournamentsWon = 0;
    let runnerUpFinishes = 0;
    const tournamentRewards = [];
    const prizeHistory = [];
    const tournamentHistory = [];

    const distributedMap = new Map();
    for (const dist of distributions) {
      const reward = dist.playerRewards.find(r => r.userId.toString() === userId.toString());
      if (reward) {
        distributedMap.set(dist.tournamentId.toString(), reward);
        totalPrizeMoneyEarned += reward.individualPrize;
        if (reward.position === "Winner") {
          tournamentsWon++;
        } else if (reward.position === "Runner-up") {
          runnerUpFinishes++;
        }
        tournamentRewards.push({
          distributionId: dist.distributionId,
          tournamentName: dist.snapshots.tournamentName,
          teamName: reward.position === "Winner" ? dist.snapshots.winnerTeamName : dist.snapshots.runnerUpTeamName,
          position: reward.position,
          sponsorName: dist.snapshots.sponsorName,
          brandName: dist.snapshots.brandName,
          brandLogo: dist.snapshots.brandLogo,
          winnerPrizeTotal: dist.snapshots.winnerPrizeTotal,
          runnerUpPrizeTotal: dist.snapshots.runnerUpPrizeTotal,
          individualPrize: reward.individualPrize,
          distributedAt: dist.distributedAt
        });
        
        prizeHistory.push({
          tournamentName: dist.snapshots.tournamentName,
          prizeAmount: reward.individualPrize,
          receivedDate: dist.distributedAt,
          role: reward.position
        });
      }
    }

    for (const [tId, tournament] of tournamentsMap.entries()) {
      const reward = distributedMap.get(tId);
      let resultStr = "Participant";
      if (reward) {
        resultStr = reward.position;
      } else {
        const isWinner = tournament.winner && teamIds.some(id => id.toString() === tournament.winner.toString());
        const runnerUpTeam = await getTournamentRunnerUp(tId);
        const isRunnerUp = runnerUpTeam && teamIds.some(id => id.toString() === runnerUpTeam._id.toString());
        if (isWinner) resultStr = "Winner";
        else if (isRunnerUp) resultStr = "Runner-up";
      }

      tournamentHistory.push({
        tournamentName: tournament.eventName,
        status: tournament.status,
        result: resultStr,
        startDate: tournament.startDate,
        endDate: tournament.endDate
      });
    }

    prizeHistory.sort((a, b) => new Date(b.receivedDate) - new Date(a.receivedDate));

    // Joining Fees Paid
    const joiningTransactions = await Transaction.find({
      userId: userId,
      paymentType: "player_joining",
      status: "paid"
    }).populate("teamId");

    const totalJoiningFeesPaid = joiningTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const paymentHistory = joiningTransactions.map(tx => ({
      amount: tx.amount || 0,
      date: tx.createdAt,
      teamName: tx.teamId?.teamName || "0"
    }));

    const netProfitLoss = totalPrizeMoneyEarned - totalJoiningFeesPaid;

    // Current Team and Sport (latest)
    playerTeams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const currentTeam = playerTeams[0] ? playerTeams[0].teamName : "0";
    const currentSport = playerTeams[0] && playerTeams[0].sportId ? playerTeams[0].sportId.name : "0";

    // Match History
    const matchHistory = [];
    for (const match of matchesPlayed) {
      const opponentTeam = match.teams.find(t => !teamIds.some(id => id.toString() === t.toString()));
      let opponentName = "0";
      if (opponentTeam) {
        const oppObj = await Team.findById(opponentTeam);
        if (oppObj) opponentName = oppObj.teamName;
      }

      let mRes = "Draw";
      if (match.result && match.result.winnerTeamId) {
        if (teamIds.some(id => id.toString() === match.result.winnerTeamId.toString())) {
          mRes = "Win";
        } else {
          mRes = "Loss";
        }
      }

      matchHistory.push({
        opponent: opponentName,
        tournamentName: match.tournamentId?.eventName || "0",
        matchDate: match.matchDate,
        result: mRes
      });
    }

    // Activity
    const upcomingMatches = await Match.find({
      teams: { $in: teamIds },
      status: { $ne: "completed" }
    }).populate("teams", "teamName").populate("venueId", "name").populate("tournamentId", "eventName").sort({ matchDate: 1 }).limit(5);

    const notifications = await require("../models/notification").find({
      userId: userId
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        totalMatchesPlayed: matchesPlayed.length,
        matchesWon,
        matchesLost,
        winRate,
        currentTeam,
        currentSport,
        tournamentsParticipated,
        tournamentsWon,
        runnerUpFinishes
      },
      financials: {
        totalJoiningFeesPaid,
        totalPrizeMoneyEarned,
        netProfitLoss
      },
      latestPrizeReceived: prizeHistory[0]?.prizeAmount || 0,
      prizeHistory,
      tournamentRewards,
      paymentHistory,
      matchHistory,
      tournamentHistory,
      upcomingMatches,
      notifications
    });

  } catch (err) {
    console.error("Player Dashboard Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 2. COACH DASHBOARD
exports.getCoachDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await checkAndUpdateTournamentStatuses();

    // Find coach's teams
    const coachTeams = await Team.find({ captainId: userId }).populate("tournamentId").populate("sportId");
    const coachTeamIds = coachTeams.map(t => t._id);

    if (coachTeamIds.length === 0) {
      return res.json({
        stats: {
          teamsCreated: 0,
          activePlayers: 0,
          pendingPlayers: 0,
          approvedPlayers: 0,
          rejectedPlayers: 0,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          winRate: 0
        },
        financials: {
          playerJoiningFeesCollected: 0,
          prizeMoneyWon: 0,
          registrationFeesPaid: 0,
          netProfit: 0
        },
        playerJoiningFee: 0,
        activity: {
          recentPlayerPayments: [],
          recentRegistrations: [],
          recentMatches: [],
          upcomingMatches: [],
          notifications: []
        }
      });
    }

    // Statistics
    let activePlayers = 0;
    let pendingPlayers = 0;
    let approvedPlayers = 0;
    let rejectedPlayers = 0;

    for (const team of coachTeams) {
      if (team.players && Array.isArray(team.players)) {
        for (const p of team.players) {
          if (p.status === "approved") {
            approvedPlayers++;
            activePlayers++;
          } else if (p.status === "pending") {
            pendingPlayers++;
          } else if (p.status === "rejected") {
            rejectedPlayers++;
          }
        }
      }
    }

    // Matches
    const matchesPlayed = await Match.find({
      teams: { $in: coachTeamIds },
      status: "completed"
    }).populate("teams", "teamName").populate("tournamentId", "eventName");

    let wins = 0;
    let losses = 0;

    for (const match of matchesPlayed) {
      if (match.result && match.result.winnerTeamId) {
        if (coachTeamIds.some(id => id.toString() === match.result.winnerTeamId.toString())) {
          wins++;
        } else {
          losses++;
        }
      }
    }

    const winRate = matchesPlayed.length > 0 ? ((wins / matchesPlayed.length) * 100).toFixed(1) : 0;

    // Financial
    const regTransactions = await Transaction.find({
      userId: userId,
      paymentType: "team_registration",
      status: "paid"
    });
    const registrationFeesPaid = regTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const joiningTransactions = await Transaction.find({
      teamId: { $in: coachTeamIds },
      paymentType: "player_joining",
      status: "paid"
    });
    const playerJoiningFeesCollected = joiningTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    let prizeMoneyWon = 0;
    const tournamentsMap = new Map();
    for (const team of coachTeams) {
      if (team.tournamentId) {
        tournamentsMap.set(team.tournamentId._id.toString(), team.tournamentId);
      }
    }

    for (const [tId, tournament] of tournamentsMap.entries()) {
      if (tournament.status === "completed") {
        const runnerUpTeam = await getTournamentRunnerUp(tId);
        const isWinner = tournament.winner && coachTeamIds.some(id => id.toString() === tournament.winner.toString());
        const isRunnerUp = runnerUpTeam && coachTeamIds.some(id => id.toString() === runnerUpTeam._id.toString());

        if (isWinner || isRunnerUp) {
          const prizes = await getTournamentPrizes(tId, tournament.startDate);
          prizeMoneyWon += isWinner ? prizes.winnerPrize : prizes.runnerUpPrize;
        }
      }
    }

    const netProfit = playerJoiningFeesCollected + prizeMoneyWon - registrationFeesPaid;

    coachTeams.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const playerJoiningFee = coachTeams[0] ? coachTeams[0].playerJoiningFee : 0;

    // Recent Payments
    const recentPlayerPayments = await Transaction.find({
      teamId: { $in: coachTeamIds },
      paymentType: "player_joining",
      status: "paid"
    }).populate("userId", "name").populate("teamId", "teamName").sort({ createdAt: -1 }).limit(5);

    // Recent Registrations
    const recentRegistrations = await Registration.find({
      teamId: { $in: coachTeamIds }
    }).populate("tournamentId", "eventName").populate("teamId", "teamName").sort({ registrationDate: -1 }).limit(5);

    // Recent Matches
    const recentMatchesList = matchesPlayed.slice(0, 5).map(match => {
      const opponentTeam = match.teams.find(t => !coachTeamIds.some(id => id.toString() === t._id.toString()));
      let mRes = "Draw";
      if (match.result && match.result.winnerTeamId) {
        if (coachTeamIds.some(id => id.toString() === match.result.winnerTeamId.toString())) {
          mRes = "Win";
        } else {
          mRes = "Loss";
        }
      }
      return {
        opponent: opponentTeam?.teamName || "0",
        tournamentName: match.tournamentId?.eventName || "0",
        matchDate: match.matchDate,
        result: mRes
      };
    });

    const upcomingMatches = await Match.find({
      teams: { $in: coachTeamIds },
      status: { $ne: "completed" }
    }).populate("teams", "teamName").populate("venueId", "name").populate("tournamentId", "eventName").sort({ matchDate: 1 }).limit(5);

    const notifications = await require("../models/notification").find({
      userId: userId
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        teamsCreated: coachTeams.length,
        activePlayers,
        pendingPlayers,
        approvedPlayers,
        rejectedPlayers,
        matchesPlayed: matchesPlayed.length,
        wins,
        losses,
        winRate
      },
      financials: {
        playerJoiningFeesCollected,
        prizeMoneyWon,
        registrationFeesPaid,
        netProfit
      },
      playerJoiningFee,
      latestTeamId: coachTeams[0]?._id || null,
      activity: {
        recentPlayerPayments,
        recentRegistrations,
        recentMatches: recentMatchesList,
        upcomingMatches,
        notifications
      }
    });

  } catch (err) {
    console.error("Coach Dashboard Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 3. ORGANIZER DASHBOARD
exports.getOrganizerDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await checkAndUpdateTournamentStatuses();

    // Find organizer's tournaments
    const organizerTournaments = await Tournament.find({
      $or: [{ organizerId: userId }, { createdBy: userId }]
    }).populate("sportId");

    const tournamentIds = organizerTournaments.map(t => t._id);

    if (tournamentIds.length === 0) {
      return res.json({
        stats: {
          totalTournaments: 0,
          upcoming: 0,
          ongoing: 0,
          completed: 0,
          cancelled: 0
        },
        registrations: {
          pending: 0,
          approved: 0,
          pendingPayment: 0,
          rejected: 0
        },
        matches: {
          total: 0,
          completed: 0,
          remaining: 0
        },
        financials: {
          registrationFeesCollected: 0,
          tournamentCreationFees: 0,
          sponsorContributions: 0,
          winnerPrize: 0,
          runnerUpPrize: 0,
          netProfit: 0
        },
        activity: {
          recentRegistrations: [],
          recentTeamPayments: [],
          recentOrganizerPayments: [],
          recentSponsorPayments: [],
          notifications: []
        }
      });
    }

    // Stats
    const upcoming = organizerTournaments.filter(t => t.status === "upcoming").length;
    const ongoing = organizerTournaments.filter(t => t.status === "ongoing").length;
    const completed = organizerTournaments.filter(t => t.status === "completed").length;
    const cancelled = 0;

    // Registrations
    const regStats = await Registration.aggregate([
      { $match: { tournamentId: { $in: tournamentIds } } },
      { $group: { _id: "$approvalStatus", count: { $sum: 1 } } }
    ]);
    const regMap = {};
    regStats.forEach(item => { regMap[item._id] = item.count; });

    const pending = regMap["pending"] || 0;
    const approved = regMap["approved"] || 0;
    const pendingPayment = regMap["approved_pending_payment"] || 0;
    const rejected = regMap["rejected"] || 0;

    // Matches
    const total = await Match.countDocuments({ tournamentId: { $in: tournamentIds } });
    const completedMatches = await Match.countDocuments({ tournamentId: { $in: tournamentIds }, status: "completed" });
    const remaining = total - completedMatches;

    // Financial
    const registrationsPaid = await Registration.find({
      tournamentId: { $in: tournamentIds },
      paymentStatus: { $in: ["Paid", "paid"] }
    });
    const registrationFeesCollected = registrationsPaid.reduce((sum, r) => sum + (r.amount || 0), 0);

    const creationTransactions = await Transaction.find({
      tournamentId: { $in: tournamentIds },
      paymentType: "tournament_creation",
      status: "paid"
    });
    const tournamentCreationFees = creationTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const activeSponsors = await Sponsor.find({
      tournamentId: { $in: tournamentIds },
      status: "active"
    });
    const sponsorContributions = activeSponsors.reduce((sum, sp) => sum + (sp.amount || 0), 0);

    let winnerPrize = 0;
    let runnerUpPrize = 0;
    const completedTourneys = organizerTournaments.filter(t => t.status === "completed");

    for (const tourney of completedTourneys) {
      const prizes = await getTournamentPrizes(tourney._id, tourney.startDate);
      if (tourney.winner) winnerPrize += prizes.winnerPrize;
      const runnerUpTeam = await getTournamentRunnerUp(tourney._id);
      if (runnerUpTeam) runnerUpPrize += prizes.runnerUpPrize;
    }

    const netProfit = (registrationFeesCollected + tournamentCreationFees + sponsorContributions) - (winnerPrize + runnerUpPrize);

    // Recent Registrations
    const recentRegistrations = await Registration.find({
      tournamentId: { $in: tournamentIds }
    }).populate("teamId", "teamName").populate("tournamentId", "eventName").sort({ registrationDate: -1 }).limit(5);

    // Recent Team Payments
    const recentTeamPayments = await Registration.find({
      tournamentId: { $in: tournamentIds },
      paymentStatus: { $in: ["Paid", "paid"] }
    }).populate("teamId", "teamName").populate("tournamentId", "eventName").sort({ paidAt: -1 }).limit(5);

    // Recent Organizer Payments (creation)
    const recentOrganizerPayments = await Transaction.find({
      tournamentId: { $in: tournamentIds },
      paymentType: "tournament_creation",
      status: "paid"
    }).populate("userId", "name").populate("tournamentId", "eventName").sort({ createdAt: -1 }).limit(5);

    // Recent Sponsor Payments
    const recentSponsorPayments = await Sponsor.find({
      tournamentId: { $in: tournamentIds },
      status: "active"
    }).populate("sponsorId", "name").populate("tournamentId", "eventName").sort({ updatedAt: -1 }).limit(5);

    const notifications = await require("../models/notification").find({
      userId: userId
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        totalTournaments: organizerTournaments.length,
        upcoming,
        ongoing,
        completed,
        cancelled
      },
      registrations: {
        pending,
        approved,
        pendingPayment,
        rejected
      },
      matches: {
        total,
        completed: completedMatches,
        remaining
      },
      financials: {
        registrationFeesCollected,
        tournamentCreationFees,
        sponsorContributions,
        winnerPrize,
        runnerUpPrize,
        netProfit
      },
      activity: {
        recentRegistrations,
        recentTeamPayments,
        recentOrganizerPayments,
        recentSponsorPayments,
        notifications
      }
    });

  } catch (err) {
    console.error("Organizer Dashboard Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// 4. SPONSOR DASHBOARD
exports.getSponsorDashboard = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await checkAndUpdateTournamentStatuses();

    // Active sponsorships for this sponsor
    const sponsorships = await Sponsor.find({
      sponsorId: userId,
      status: "active"
    }).populate("tournamentId");

    if (sponsorships.length === 0) {
      return res.json({
        stats: {
          sponsoredTournaments: 0,
          activeSponsorships: 0,
          completedSponsorships: 0
        },
        financials: {
          totalSponsoredAmount: 0,
          titleSponsorshipAmount: 0,
          inKindSponsorshipAmount: 0
        },
        history: [],
        upcomingSponsoredEvents: [],
        completedSponsoredEvents: [],
        notifications: []
      });
    }

    const uniqueTourneys = new Set();
    let activeSponsorships = 0;
    let completedSponsorships = 0;

    let totalSponsoredAmount = 0;
    let titleSponsorshipAmount = 0;
    let inKindSponsorshipAmount = 0;

    const history = [];
    const upcomingEvents = [];
    const completedEvents = [];

    for (const sp of sponsorships) {
      const t = sp.tournamentId;
      if (t) {
        uniqueTourneys.add(t._id.toString());
        if (t.status === "completed") {
          completedSponsorships++;
          completedEvents.push({
            tournamentName: t.eventName,
            endDate: t.endDate
          });
        } else {
          activeSponsorships++;
          if (t.status === "upcoming") {
            upcomingEvents.push({
              tournamentName: t.eventName,
              startDate: t.startDate
            });
          }
        }

        let winnerTeam = "0";
        if (t.winner) {
          const wTeam = await Team.findById(t.winner);
          if (wTeam) winnerTeam = wTeam.teamName;
        }

        let runnerUpTeam = "0";
        const ruTeam = await getTournamentRunnerUp(t._id);
        if (ruTeam) runnerUpTeam = ruTeam.teamName;

        history.push({
          tournamentName: t.eventName,
          sponsorshipType: sp.type === "title" ? "Title Sponsor" : sp.type === "inkind" ? "In-Kind Sponsor" : "Standard Sponsor",
          sponsoredAmount: sp.amount || 0,
          winnerTeam,
          runnerUpTeam,
          tournamentStatus: t.status,
          startDate: t.startDate,
          endDate: t.endDate
        });
      }

      totalSponsoredAmount += sp.amount || 0;
      if (sp.type === "title") titleSponsorshipAmount += sp.amount || 0;
      else if (sp.type === "inkind") inKindSponsorshipAmount += sp.amount || 0;
    }

    const sponsorIds = sponsorships.map(sp => sp._id);
    const PrizeDistribution = require("../models/PrizeDistribution");
    const distributions = await PrizeDistribution.find({
      sponsorId: { $in: sponsorIds }
    }).populate("tournamentId");

    let totalSponsoredPrizeAmount = 0;
    let totalPlayersRewarded = 0;
    let totalWinnerTeamsSponsored = 0;
    let totalRunnerUpTeamsSponsored = 0;
    let totalCompletedDistributions = distributions.length;

    const prizeDistributions = distributions.map(d => {
      totalSponsoredPrizeAmount += (d.snapshots.winnerPrizeTotal || 0) + (d.snapshots.runnerUpPrizeTotal || 0);
      totalPlayersRewarded += d.playerRewards.length;
      if (d.snapshots.winnerTeamName) totalWinnerTeamsSponsored++;
      if (d.snapshots.runnerUpTeamName) totalRunnerUpTeamsSponsored++;

      return {
        _id: d._id,
        distributionId: d.distributionId,
        tournamentName: d.snapshots.tournamentName,
        winnerTeam: d.snapshots.winnerTeamName,
        runnerUpTeam: d.snapshots.runnerUpTeamName,
        winnerPrize: d.snapshots.winnerPrizeTotal,
        runnerUpPrize: d.snapshots.runnerUpPrizeTotal,
        playersRewardedCount: d.playerRewards.length,
        distributionDate: d.distributedAt,
        status: "Completed",
        playerRewards: d.playerRewards
      };
    });

    const notifications = await require("../models/notification").find({
      userId: userId
    }).sort({ createdAt: -1 }).limit(5);

    res.json({
      stats: {
        sponsoredTournaments: uniqueTourneys.size,
        activeSponsorships,
        completedSponsorships,
        totalSponsoredPrizeAmount,
        totalPlayersRewarded,
        totalWinnerTeamsSponsored,
        totalRunnerUpTeamsSponsored,
        totalCompletedDistributions
      },
      financials: {
        totalSponsoredAmount,
        titleSponsorshipAmount,
        inKindSponsorshipAmount
      },
      history,
      upcomingSponsoredEvents: upcomingEvents.slice(0, 5),
      completedSponsoredEvents: completedEvents.slice(0, 5),
      notifications,
      prizeDistributions
    });

  } catch (err) {
    console.error("Sponsor Dashboard Error:", err);
    res.status(500).json({ message: err.message });
  }
};

