const mongoose = require("mongoose");
const PrizeDistribution = require("../models/PrizeDistribution");
const Tournament = require("../models/Tournament");
const Sponsor = require("../models/Sponsor");
const Team = require("../models/Team");
const User = require("../models/User");
const Notification = require("../models/notification");

/**
 * Automates the prize distribution for a completed tournament.
 * Uses a Mongoose transaction session to ensure all operations succeed or fail together.
 */
async function distributeTournamentPrizes(tournamentId, triggeredBy = "System", adminUserId = null, req = null) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Check if PrizeDistribution already exists
    const existingDistribution = await PrizeDistribution.findOne({ tournamentId }).session(session);
    if (existingDistribution) {
      console.log(`[PrizeDistribution] Prizes already distributed for tournament ${tournamentId}`);
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: "Prize has already been distributed for this tournament.", code: "ALREADY_DISTRIBUTED" };
    }

    // 2. Fetch Tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // 3. Verify Tournament Status (MUST be Completed, and winner/runnerUp must exist)
    if (tournament.status !== "completed") {
      throw new Error(`Tournament status is ${tournament.status}. Prizes can only be distributed for completed tournaments.`);
    }

    if (!tournament.winner) {
      throw new Error("Tournament winner team has not been declared");
    }
    if (!tournament.runnerUp) {
      throw new Error("Tournament runner-up team has not been declared");
    }

    // 4. Verify Active Title Sponsor & Payment
    const titleSponsor = await Sponsor.findOne({
      tournamentId,
      type: "title",
      status: "active"
    }).session(session);

    if (!titleSponsor) {
      console.log(`[PrizeDistribution] No active Title Sponsor found for tournament ${tournamentId}. Skipping prize distribution.`);
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: "No active Title Sponsor found. No prize distribution performed.", code: "NO_SPONSOR" };
    }

    const winnerPrizeTotal = titleSponsor.winnerPrize || 0;
    const runnerUpPrizeTotal = titleSponsor.runnerUpPrize || 0;

    if (winnerPrizeTotal <= 0 && runnerUpPrizeTotal <= 0) {
      console.log(`[PrizeDistribution] Sponsor prize amounts are zero. Skipping distribution.`);
      await session.abortTransaction();
      session.endSession();
      return { success: false, message: "Sponsor prize pool amounts are ₹0. Skipping distribution.", code: "ZERO_PRIZE" };
    }

    // 5. Fetch Winner and Runner-up Teams
    const winnerTeam = await Team.findById(tournament.winner).session(session);
    const runnerUpTeam = await Team.findById(tournament.runnerUp).session(session);

    if (!winnerTeam || !runnerUpTeam) {
      throw new Error("Winner or Runner-up team record not found");
    }

    // Filter approved players
    const approvedWinnerPlayers = winnerTeam.players.filter(p => p.status === "approved");
    const approvedRunnerUpPlayers = runnerUpTeam.players.filter(p => p.status === "approved");

    if (approvedWinnerPlayers.length === 0) {
      throw new Error("Winner team does not have any approved players to receive rewards");
    }
    if (approvedRunnerUpPlayers.length === 0) {
      throw new Error("Runner-up team does not have any approved players to receive rewards");
    }

    // 6. Calculate Individual Shares (rounded to two decimal places)
    const winnerShare = Number((winnerPrizeTotal / approvedWinnerPlayers.length).toFixed(2));
    const runnerUpShare = Number((runnerUpPrizeTotal / approvedRunnerUpPlayers.length).toFixed(2));

    // 7. Get Sponsor User Details for Snapshot
    let sponsorUserName = "N/A";
    if (titleSponsor.sponsorId) {
      const sponsorUser = await User.findById(titleSponsor.sponsorId).session(session);
      if (sponsorUser) sponsorUserName = sponsorUser.name;
    }

    // 8. Build Player Rewards Snapshots
    const playerRewards = [];

    // Winner Team Players
    for (const player of approvedWinnerPlayers) {
      const user = await User.findById(player.userId).session(session);
      playerRewards.push({
        userId: player.userId,
        playerName: user ? user.name : "Unknown Athlete",
        jerseyNumber: "N/A", // Default N/A since User schema doesn't hold jersey numbers
        position: "Winner",
        individualPrize: winnerShare
      });
    }

    // Runner-up Team Players
    for (const player of approvedRunnerUpPlayers) {
      const user = await User.findById(player.userId).session(session);
      playerRewards.push({
        userId: player.userId,
        playerName: user ? user.name : "Unknown Athlete",
        jerseyNumber: "N/A",
        position: "Runner-up",
        individualPrize: runnerUpShare
      });
    }

    // 9. Generate Unique Sequential Distribution ID
    const currentYear = new Date().getFullYear();
    const count = await PrizeDistribution.countDocuments().session(session);
    const nextNum = (count + 1).toString().padStart(6, "0");
    const distributionId = `PRIZE-${currentYear}-${nextNum}`;

    const totalAmountDistributed = (winnerShare * approvedWinnerPlayers.length) + (runnerUpShare * approvedRunnerUpPlayers.length);

    // Build Audit Log
    const performer = triggeredBy === "System" ? "System" : (adminUserId ? adminUserId.toString() : "Admin");
    const auditLogEntry = {
      action: triggeredBy === "System" ? "AUTO_DISTRIBUTED" : "MANUAL_DISTRIBUTED",
      performedBy: performer,
      timestamp: new Date(),
      notes: triggeredBy === "System" ? "Automatic completion trigger." : "Manual recovery trigger by Admin."
    };

    // 10. Save PrizeDistribution Record
    const prizeDistribution = new PrizeDistribution({
      distributionId,
      tournamentId,
      sponsorId: titleSponsor._id,
      triggeredBy,
      totalAmountDistributed,
      snapshots: {
        tournamentName: tournament.eventName,
        winnerTeamName: winnerTeam.teamName,
        runnerUpTeamName: runnerUpTeam.teamName,
        sponsorName: sponsorUserName,
        brandName: titleSponsor.name || "N/A",
        brandLogo: titleSponsor.logo || "",
        winnerPrizeTotal,
        runnerUpPrizeTotal
      },
      playerRewards,
      auditLog: [auditLogEntry],
      distributedAt: new Date()
    });

    await prizeDistribution.save({ session });

    // 11. Send Notifications and trigger Dashboard Updates
    const io = req?.app?.get("io");
    const socketUsersMap = req?.app?.get("users") || {};

    const formatCurrency = (val) => {
      return `₹${val.toLocaleString("en-IN")}`;
    };

    // Send notifications to Winner Players
    for (const reward of playerRewards.filter(r => r.position === "Winner")) {
      const msg = `Congratulations! Your team won the ${tournament.eventName}! You have been rewarded an individual prize of ${formatCurrency(reward.individualPrize)} sponsored by ${titleSponsor.name || "Title Sponsor"}.`;
      const notif = await Notification.create([{
        userId: reward.userId,
        message: msg,
        type: "prize_received_winner",
        relatedId: tournamentId,
        isRead: false
      }], { session });

      const socketId = socketUsersMap[reward.userId.toString()];
      if (socketId && io) {
        io.to(socketId).emit("new_notification", notif[0]);
      }
    }

    // Send notifications to Runner-up Players
    for (const reward of playerRewards.filter(r => r.position === "Runner-up")) {
      const msg = `Congratulations on finishing as Runner-up in the ${tournament.eventName}! You have been rewarded an individual prize of ${formatCurrency(reward.individualPrize)} sponsored by ${titleSponsor.name || "Title Sponsor"}.`;
      const notif = await Notification.create([{
        userId: reward.userId,
        message: msg,
        type: "prize_received_runnerup",
        relatedId: tournamentId,
        isRead: false
      }], { session });

      const socketId = socketUsersMap[reward.userId.toString()];
      if (socketId && io) {
        io.to(socketId).emit("new_notification", notif[0]);
      }
    }

    // Send notification to Sponsor
    if (titleSponsor.sponsorId) {
      const sponsorMsg = `Prize distribution completed for your sponsored tournament: ${tournament.eventName}. Total distributed: ${formatCurrency(totalAmountDistributed)}.`;
      const sponsorNotif = await Notification.create([{
        userId: titleSponsor.sponsorId,
        message: sponsorMsg,
        type: "sponsorship_prize_distributed",
        relatedId: tournamentId,
        isRead: false
      }], { session });

      const sponsorSocketId = socketUsersMap[titleSponsor.sponsorId.toString()];
      if (sponsorSocketId && io) {
        io.to(sponsorSocketId).emit("new_notification", sponsorNotif[0]);
      }
    }

    // Send notification to Admins
    const admins = await User.find({ role: "admin" }).session(session);
    for (const admin of admins) {
      const adminMsg = `Prize distribution ${distributionId} completed successfully for tournament ${tournament.eventName}. Total amount distributed: ${formatCurrency(totalAmountDistributed)}.`;
      const adminNotif = await Notification.create([{
        userId: admin._id,
        message: adminMsg,
        type: "admin_prize_distributed",
        relatedId: tournamentId,
        isRead: false
      }], { session });

      const adminSocketId = socketUsersMap[admin._id.toString()];
      if (adminSocketId && io) {
        io.to(adminSocketId).emit("new_notification", adminNotif[0]);
      }
    }

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Trigger dashboard update socket event
    if (req && io) {
      io.emit("dashboard_update", { type: "prize_distributed" });
    }

    return { success: true, distributionId, totalAmountDistributed };

  } catch (err) {
    console.error("PRIZE DISTRIBUTION ERROR:", err);
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

module.exports = {
  distributeTournamentPrizes
};
