const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    teamName: {
      type: String,
      required: true,
    },

    tournamentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },

    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
    },

    captainId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },


    playerJoiningFee: {
      type: Number,
      default: 0,
    },

    players: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved_pending_payment", "approved", "rejected"],
          default: "pending",
        },
      },
    ],
  },
  { timestamps: true }
);

/* 🚨 THIS LINE IS MANDATORY */
module.exports = mongoose.models.Team || mongoose.model("Team", TeamSchema);
