const mongoose = require("mongoose");

const MatchSchema = new mongoose.Schema(
  {
    /* ================= TOURNAMENT ================= */
    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    /* ================= TEAMS (TEAM A & TEAM B) ================= */
    teams: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true,
      },
    ],

    /* ================= MATCH SCHEDULE ================= */
    matchDate: {
      type: Date,
      required: true,
    },

    /* ================= VENUE ================= */
    venueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      required: true,
    },

    /* ================= MATCH STATUS ================= */
    status: {
      type: String,
      enum: ["scheduled", "live", "completed"],
      default: "scheduled",
    },

    /* ================= ROUND ================= */
    round: {
      type: Number,
      default: 1,
      required: true,
    },

    /* ================= RESULT (AFTER COMPLETION) ================= */
    result: {
      winnerTeamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        default: null,
      },
      score: {
        type: String,
        default: "",
      },
    },

    /* ================= AUDIT ================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

module.exports = mongoose.model("Match", MatchSchema);
