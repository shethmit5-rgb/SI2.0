const Match = require("../models/Match");
const Team = require("../models/Team");
const Tournament = require("../models/Tournament");
const { getTournamentRoundInfo, triggerDashboardUpdate } = require("../utils/tournamentHelper");


exports.createMatch = async (req, res, next) => {
  try {
    const { tournamentId, teams, matchDate, venueId } = req.body;

    // Validated in validator schema
    if (teams[0] === teams[1]) {
      return res.status(400).json({ message: "Team A and Team B must be different" });
    }

    // Check if user is admin or tournament organizer
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: "Tournament not found" });
    }

    // Only Admin, the tournament creator, or the assigned Organizer can manage matches for this tournament
    const isCreator = tournament.createdBy && tournament.createdBy.toString() === req.user.userId;
    const isAssigned = tournament.organizerId && tournament.organizerId.toString() === req.user.userId;
    if (req.user.role !== "admin" && !isCreator && !isAssigned) {
      return res.status(403).json({ message: "Only Admin, the tournament creator, or the assigned Organizer can create matches for this tournament" });
    }

    // Fetch knockout round details
    const roundInfo = await getTournamentRoundInfo(tournamentId);

    // Tournament team count must be a power of 2
    const teamCount = roundInfo.tournament.teams.length;
    const isPowerOfTwo = (num) => num > 1 && (num & (num - 1)) === 0;
    if (!isPowerOfTwo(teamCount)) {
      return res.status(400).json({
        message: `Tournament team count must be a power of 2 (2, 4, 8, 16, 32, etc.). Current approved team count is ${teamCount}.`
      });
    }

    if (roundInfo.isCompleted) {
      return res.status(400).json({
        message: "Tournament is already completed. No more matches can be created."
      });
    }

    // Verify both teams belong to current active round and are available (not matched yet)
    const availableIds = roundInfo.availableTeams.map((t) => t._id.toString());
    if (!availableIds.includes(teams[0]) || !availableIds.includes(teams[1])) {
      return res.status(400).json({
        message: "Selected teams are not eligible or have already been matched in the current round."
      });
    }

    /* CHECK TEAMS BELONG TO TOURNAMENT */
    const teamDocs = await Team.find({
      _id: { $in: teams },
      tournamentId,
    });

    if (teamDocs.length !== 2) {
      return res.status(400).json({
        message: "Both teams must belong to the selected tournament",
      });
    }

    // Prevent duplicate matches (same teams in the same round of the tournament)
    const duplicateMatch = await Match.findOne({
      tournamentId,
      round: roundInfo.currentRound,
      teams: { $all: teams }
    });
    if (duplicateMatch) {
      return res.status(400).json({ message: "This match has already been scheduled for this round." });
    }

    const match = await Match.create({
      tournamentId,
      teams,
      matchDate,
      venueId,
      createdBy: req.user.userId,
      status: "scheduled",
      round: roundInfo.currentRound,
    });

    triggerDashboardUpdate(req, "match_created");
    res.status(201).json(match);

  } catch (err) {
    console.error("CREATE MATCH ERROR:", err);
    res.status(500).json({ message: "Match creation failed" });
  }
};

exports.getMatches = async (req, res, next) => {
  try {
    let matches;
    if (req.user.role === "admin") {
      matches = await Match.find()
        .populate("teams", "teamName")
        .populate("venueId", "name")
        .populate("tournamentId", "eventName")
        .sort({ matchDate: 1 });
    } else if (req.user.role === "organizer") {
      // Find tournaments created by or assigned to this organizer
      const tournaments = await Tournament.find({
        $or: [
          { organizerId: req.user.userId },
          { createdBy: req.user.userId }
        ]
      });
      const tournamentIds = tournaments.map(t => t._id);
      
      matches = await Match.find({ tournamentId: { $in: tournamentIds } })
        .populate("teams", "teamName")
        .populate("venueId", "name")
        .populate("tournamentId", "eventName")
        .sort({ matchDate: 1 });
    } else {
      return res.status(403).json({ message: "Access denied. Only Admin or Organizer can view matches list." });
    }

    res.json(matches);
  } catch (err) {
    console.error("FETCH MATCHES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch matches" });
  }
};

exports.getMatchesByTournament = async (req, res, next) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id })
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .sort({ matchDate: 1 });

    res.json(matches);
  } catch (err) {
    console.error("FETCH MATCHES ERROR:", err);
    res.status(500).json({ message: "Failed to load matches" });
  }
};

exports.getPublicMatchesByTournament = async (req, res, next) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id })
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .sort({ matchDate: 1 });

    res.json(matches);
  } catch (err) {
    console.error("FETCH MATCHES ERROR:", err);
    res.status(500).json({ message: "Failed to load matches" });
  }
};

exports.getUpcomingMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({
      status: "scheduled",
      matchDate: { $gte: new Date() }
    })
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .populate("tournamentId", "eventName")
      .sort({ matchDate: 1 })
      .limit(10);

    res.json(matches);
  } catch (err) {
    console.error("UPCOMING MATCHES ERROR:", err);
    res.status(500).json({ message: "Failed to load upcoming matches" });
  }
};

exports.getCompletedMatches = async (req, res, next) => {
  try {
    const matches = await Match.find({ status: "completed" })
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .populate("tournamentId", "eventName")
      .sort({ matchDate: -1 })
      .limit(20);

    res.json(matches);
  } catch (err) {
    console.error("COMPLETED MATCHES ERROR:", err);
    res.status(500).json({ message: "Failed to load completed matches" });
  }
};

exports.getMySchedule = async (req, res, next) => {
  try {
    const Registration = require("../models/Registration");
    const Team = require("../models/Team");
    const Match = require("../models/Match");

    let tournamentIds = [];

    if (req.user.role === "coach") {
      const teams = await Team.find({ captainId: req.user.userId }).select("_id");
      const teamIds = teams.map(t => t._id);
      const registrations = await Registration.find({ teamId: { $in: teamIds } }).select("tournamentId");
      tournamentIds = registrations.map(r => r.tournamentId);
    } else if (req.user.role === "player") {
      const teams = await Team.find({
        "players": {
          $elemMatch: {
            userId: req.user.userId,
            status: { $in: ["approved", "approved_pending_payment"] }
          }
        }
      }).select("_id");
      const teamIds = teams.map(t => t._id);
      const registrations = await Registration.find({ teamId: { $in: teamIds } }).select("tournamentId");
      tournamentIds = registrations.map(r => r.tournamentId);
    } else if (req.user.role === "organizer") {
      const Tournament = require("../models/Tournament");
      const tournaments = await Tournament.find({
        $or: [
          { organizerId: req.user.userId },
          { createdBy: req.user.userId }
        ]
      });
      const tournamentIdsOrganizer = tournaments.map(t => t._id);
      const matches = await Match.find({ tournamentId: { $in: tournamentIdsOrganizer } })
        .populate("teams", "teamName")
        .populate("venueId", "name")
        .populate("tournamentId", "eventName")
        .sort({ matchDate: 1 });
      return res.json(matches);
    } else if (req.user.role === "admin") {
      const matches = await Match.find()
        .populate("teams", "teamName")
        .populate("venueId", "name")
        .populate("tournamentId", "eventName")
        .sort({ matchDate: 1 });
      return res.json(matches);
    } else {
      return res.status(403).json({ message: "Access denied." });
    }

    const matches = await Match.find({ tournamentId: { $in: tournamentIds } })
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .populate("tournamentId", "eventName")
      .sort({ matchDate: 1 });

    res.json(matches);
  } catch (err) {
    console.error("GET MY SCHEDULE ERROR:", err);
    res.status(500).json({ message: "Failed to load matches schedule" });
  }
};

exports.updateMatchResult = async (req, res, next) => {
  try {
    const { winnerTeamId, score, status } = req.body;
    const match = await Match.findById(req.params.id).populate("tournamentId");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Check if standings are locked due to completed prize distribution
    const PrizeDistribution = require("../models/PrizeDistribution");
    const existingDist = await PrizeDistribution.findOne({ tournamentId: match.tournamentId._id || match.tournamentId });
    if (existingDist) {
      return res.status(400).json({ message: "Standings are locked. Prize distribution has already been completed for this tournament." });
    }

    // Only Admin, the tournament creator, or the assigned Organizer can update match results
    const isCreator = match.tournamentId.createdBy && match.tournamentId.createdBy.toString() === req.user.userId;
    const isAssigned = match.tournamentId.organizerId && match.tournamentId.organizerId.toString() === req.user.userId;
    if (req.user.role !== "admin" && !isCreator && !isAssigned) {
      return res.status(403).json({ message: "Only Admin, the tournament creator, or the assigned Organizer can update match results" });
    }

    if (winnerTeamId) {
      match.result.winnerTeamId = winnerTeamId;
    }

    if (score) {
      match.result.score = score;
    }

    if (status) {
      match.status = status;
    }

    await match.save();

    // If match is completed, check if the tournament is now completed
    if (match.status === "completed" && match.result?.winnerTeamId) {
      const roundInfo = await getTournamentRoundInfo(match.tournamentId._id || match.tournamentId);
      if (roundInfo.isCompleted && roundInfo.winner) {
        const winnerId = roundInfo.winner._id.toString();
        const runnerUpId = match.teams.find(t => t.toString() !== winnerId);

        await Tournament.findByIdAndUpdate(match.tournamentId._id || match.tournamentId, {
          status: "completed",
          winner: winnerId,
          runnerUp: runnerUpId || null
        });

        // Trigger automatic prize distribution
        const { distributeTournamentPrizes } = require("../utils/prizeDistributionHelper");
        try {
          await distributeTournamentPrizes(match.tournamentId._id || match.tournamentId, "System", null, req);
        } catch (distErr) {
          console.error("[AUTO PRIZE DISTRIBUTION FAILED]:", distErr);
        }
      }
    }

    triggerDashboardUpdate(req, "match_result_updated");
    res.json({ message: "Match result updated", match });

  } catch (err) {
    console.error("UPDATE MATCH RESULT ERROR:", err);
    res.status(500).json({ message: "Failed to update match result" });
  }
};

exports.getMatchById = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate("teams", "teamName captainId")
      .populate("venueId", "name address")
      .populate("tournamentId", "eventName");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    res.json(match);
  } catch (err) {
    console.error("FETCH SINGLE MATCH ERROR:", err);
    res.status(500).json({ message: "Failed to fetch match" });
  }
};

exports.updateMatch = async (req, res, next) => {
  try {
    const { matchDate, venueId, teams, status } = req.body;
    const match = await Match.findById(req.params.id).populate("tournamentId");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Check permissions (Only Admin, creator, or assigned organizer)
    const isCreator = match.tournamentId.createdBy && match.tournamentId.createdBy.toString() === req.user.userId;
    const isAssigned = match.tournamentId.organizerId && match.tournamentId.organizerId.toString() === req.user.userId;
    if (req.user.role !== "admin" && !isCreator && !isAssigned) {
      return res.status(403).json({ message: "Only Admin, the tournament creator, or the assigned Organizer can update matches" });
    }

    if (matchDate) match.matchDate = matchDate;
    if (venueId) match.venueId = venueId;
    if (teams && teams.length === 2) {
      if (teams[0] === teams[1]) {
        return res.status(400).json({ message: "Team A and Team B must be different" });
      }
      match.teams = teams;
    }
    if (status) match.status = status;

    await match.save();
    triggerDashboardUpdate(req, "match_updated");
    res.json({ message: "Match updated successfully", match });

  } catch (err) {
    console.error("UPDATE MATCH ERROR:", err);
    res.status(500).json({ message: "Failed to update match" });
  }
};

exports.deleteMatch = async (req, res, next) => {
  try {
    const match = await Match.findById(req.params.id).populate("tournamentId");

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    // Check permissions (Only Admin, creator, or assigned organizer)
    const isCreator = match.tournamentId.createdBy && match.tournamentId.createdBy.toString() === req.user.userId;
    const isAssigned = match.tournamentId.organizerId && match.tournamentId.organizerId.toString() === req.user.userId;
    if (req.user.role !== "admin" && !isCreator && !isAssigned) {
      return res.status(403).json({ message: "Only Admin, the tournament creator, or the assigned Organizer can delete matches" });
    }

    await Match.findByIdAndDelete(req.params.id);
    triggerDashboardUpdate(req, "match_deleted");
    res.json({ message: "Match deleted successfully" });

  } catch (err) {
    console.error("DELETE MATCH ERROR:", err);
    res.status(500).json({ message: "Failed to delete match" });
  }
};

exports.getSchedule = async (req, res, next) => {
  try {
    const matches = await Match.find()
      .populate("teams", "teamName")
      .populate("venueId", "name")
      .populate("tournamentId", "eventName")
      .sort({ matchDate: 1 });
    res.json(matches);
  } catch (err) {
    console.error("GET SCHEDULE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch schedule" });
  }
};
