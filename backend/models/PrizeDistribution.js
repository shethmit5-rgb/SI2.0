const mongoose = require("mongoose");

const PrizeDistributionSchema = new mongoose.Schema(
  {
    distributionId: {
      type: String,
      required: true,
      unique: true,
    },
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      unique: true,
    },
    winnerTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    runnerUpTeamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sponsor",
      required: true,
    },
    triggeredBy: {
      type: String,
      enum: ["System", "Admin"],
      default: "System",
    },
    totalAmountDistributed: {
      type: Number,
      required: true,
    },
    snapshots: {
      tournamentName: { type: String, required: true },
      winnerTeamName: { type: String, required: true },
      runnerUpTeamName: { type: String, required: true },
      sponsorName: { type: String, required: true },
      brandName: { type: String, required: true },
      brandLogo: { type: String, default: "" },
      winnerPrizeTotal: { type: Number, required: true },
      runnerUpPrizeTotal: { type: Number, required: true },
    },
    playerRewards: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        playerName: { type: String, required: true },
        jerseyNumber: { type: String, default: "N/A" },
        position: {
          type: String,
          enum: ["Winner", "Runner-up"],
          required: true,
        },
        individualPrize: { type: Number, required: true },
      },
    ],
    auditLog: [
      {
        action: {
          type: String,
          enum: ["AUTO_DISTRIBUTED", "MANUAL_DISTRIBUTED"],
          required: true,
        },
        performedBy: {
          type: String, // "System" or Admin user ID
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        notes: { type: String, default: "" },
      },
    ],
    distributedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PrizeDistribution", PrizeDistributionSchema);
