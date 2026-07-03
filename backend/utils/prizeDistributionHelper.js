const mongoose = require("mongoose");
const PrizeDistribution = require("../models/PrizeDistribution");
const Tournament = require("../models/Tournament");
const Sponsor = require("../models/Sponsor");
const Team = require("../models/Team");
const User = require("../models/User");
const Notification = require("../models/notification");

/**
 * Automates the prize distribution for a completed tournament.
 * Dispatches to a retrying runner that falls back to session-less execution on standalone MongoDB.
 */
async function distributeTournamentPrizes(tournamentId, triggeredBy = "System", adminUserId = null, req = null) {
  return await distributeWithRetry(tournamentId, triggeredBy, adminUserId, req, true);
}

async function distributeWithRetry(tournamentId, triggeredBy, adminUserId, req, attemptTransaction) {
  console.log(`\n=== [PrizeDistribution] distributeTournamentPrizes() entered ===`);
  console.log(`- Tournament ID: ${tournamentId}`);
  console.log(`- Triggered By: ${triggeredBy}`);
  console.log(`- Admin User ID: ${adminUserId}`);
  console.log(`- Attempt Transaction: ${attemptTransaction}`);

  let session = null;
  let useTransaction = attemptTransaction;

  if (useTransaction) {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      console.log(`- Transaction Started`);
    } catch (txErr) {
      console.log(`- Failed to start session/transaction: ${txErr.message}`);
      useTransaction = false;
      session = null;
    }
  }

  try {
    // 1. Check if PrizeDistribution already exists
    const existingDistribution = await PrizeDistribution.findOne({ tournamentId }).session(session);
    console.log(`- Existing PrizeDistribution: ${existingDistribution ? existingDistribution.distributionId : "None"}`);
    if (existingDistribution) {
      const msg = `Prizes already distributed for tournament ${tournamentId}`;
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return { success: false, message: "Prize has already been distributed for this tournament.", code: "ALREADY_DISTRIBUTED" };
    }

    // 2. Fetch Tournament
    const tournament = await Tournament.findById(tournamentId).session(session);
    if (!tournament) {
      const msg = "Tournament not found";
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
    }
    console.log(`- Tournament Status: ${tournament.status}`);
    console.log(`- Winner ID: ${tournament.winner}`);
    console.log(`- Runner-up ID: ${tournament.runnerUp}`);

    // 3. Verify Tournament Status (MUST be Completed, and winner/runnerUp must exist)
    if (tournament.status !== "completed") {
      const msg = `Tournament status is ${tournament.status}. Prizes can only be distributed for completed tournaments.`;
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
    }

    if (!tournament.winner) {
      const msg = "Tournament winner team has not been declared";
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
    }
    if (!tournament.runnerUp) {
      const msg = "Tournament runner-up team has not been declared";
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
    }

    // 4. Verify Active Title Sponsor & Payment
    const titleSponsor = await Sponsor.findOne({
      tournamentId,
      type: "title",
      status: "active"
    }).session(session);

    console.log(`- Sponsor Found: ${titleSponsor ? titleSponsor.name : "None"}`);
    console.log(`- Sponsor Payment Status: ${titleSponsor ? titleSponsor.status : "N/A"}`);

    if (!titleSponsor) {
      const msg = `No active Title Sponsor found for tournament ${tournamentId}. Skipping prize distribution.`;
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return { success: false, message: "No active Title Sponsor found. No prize distribution performed.", code: "NO_SPONSOR" };
    }

    const winnerPrizeTotal = titleSponsor.winnerPrize || 0;
    const runnerUpPrizeTotal = titleSponsor.runnerUpPrize || 0;

    console.log(`- Winner Prize: ${winnerPrizeTotal}`);
    console.log(`- Runner-up Prize: ${runnerUpPrizeTotal}`);

    if (winnerPrizeTotal <= 0 && runnerUpPrizeTotal <= 0) {
      const msg = `Sponsor prize amounts are zero. Skipping distribution.`;
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      return { success: false, message: "Sponsor prize pool amounts are ₹0. Skipping distribution.", code: "ZERO_PRIZE" };
    }

    // 5. Fetch Winner and Runner-up Teams
    const winnerTeam = await Team.findById(tournament.winner).session(session);
    const runnerUpTeam = await Team.findById(tournament.runnerUp).session(session);

    if (!winnerTeam || !runnerUpTeam) {
      const msg = "Winner or Runner-up team record not found";
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
    }

    // Filter approved players
    const approvedWinnerPlayers = winnerTeam.players.filter(p => p.status === "approved");
    const approvedRunnerUpPlayers = runnerUpTeam.players.filter(p => p.status === "approved");

    console.log(`- Winner Player Count: ${approvedWinnerPlayers.length}`);
    console.log(`- Runner-up Player Count: ${approvedRunnerUpPlayers.length}`);

    if (approvedWinnerPlayers.length === 0) {
      const msg = "Winner team does not have any approved players to receive rewards";
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
    }
    if (approvedRunnerUpPlayers.length === 0) {
      const msg = "Runner-up team does not have any approved players to receive rewards";
      console.log(`[PrizeDistribution Exit] ${msg}`);
      if (useTransaction && session) {
        await session.abortTransaction();
        session.endSession();
      }
      throw new Error(msg);
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
      winnerTeamId: tournament.winner,
      runnerUpTeamId: tournament.runnerUp,
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
    console.log(`- PrizeDistribution Saved: ${distributionId}`);

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

    console.log(`- Notifications Created`);

    // Commit transaction if active
    if (useTransaction && session) {
      await session.commitTransaction();
      session.endSession();
      console.log(`- Transaction Committed`);
    }

    // Trigger dashboard update socket event
    if (io) {
      io.emit("dashboard_update", { type: "prize_distributed" });
      console.log(`- Dashboard Updated`);
    }

    console.log(`=== [PrizeDistribution] distributeTournamentPrizes() completed successfully ===\n`);
    return { success: true, distributionId, totalAmountDistributed };

  } catch (err) {
    console.error("PRIZE DISTRIBUTION ERROR:", err);
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        console.error("Failed to abort transaction:", abortErr.message);
      }
      try {
        session.endSession();
      } catch (e) {}
    }

    // Check if error is due to transaction support on standalone instance
    const isTxError = err.message && (
      err.message.includes("Transaction numbers are only allowed") ||
      err.message.includes("replica set") ||
      err.code === 20
    );

    if (isTxError && attemptTransaction) {
      console.warn("[PrizeDistribution] Standalone MongoDB detected. Retrying session-less...");
      return await distributeWithRetry(tournamentId, triggeredBy, adminUserId, req, false);
    }

    throw err;
  }
}

module.exports = {
  distributeTournamentPrizes
};
