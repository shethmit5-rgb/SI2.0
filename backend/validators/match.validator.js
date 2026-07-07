const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  mongoIdChain,
  dateChain,
  enumChain
} = require("./common.validator");

const createMatchValidator = [
  requiredMongoIdChain("body", "tournamentId", "Invalid tournament ID"),
  body("teams")
    .isArray({ min: 2, max: 2 })
    .withMessage("Invalid match data"),
  body("teams.*")
    .isMongoId()
    .withMessage("Invalid team ID format"),
  dateChain("matchDate"),
  requiredMongoIdChain("body", "venueId", "Invalid venue ID")
];

const getMatchesByTournamentValidator = [
  requiredMongoIdChain("param", "id", "Invalid tournament ID")
];

const updateMatchResultValidator = [
  requiredMongoIdChain("param", "id", "Invalid match ID"),
  body("winnerTeamId")
    .optional({ nullable: true })
    .custom((value) => {
      if (value !== null && value !== "" && !require("mongoose").Types.ObjectId.isValid(value)) {
        throw new Error("Invalid team ID format");
      }
      return true;
    }),
  body("score")
    .notEmpty()
    .withMessage("Score is required")
    .trim(),
  enumChain("status", ["scheduled", "ongoing", "completed"])
];

const getMatchByIdValidator = [
  requiredMongoIdChain("param", "id", "Invalid match ID")
];

const updateMatchValidator = [
  requiredMongoIdChain("param", "id", "Invalid match ID"),
  dateChain("matchDate", false),
  mongoIdChain("body", "venueId", "Invalid venue ID"),
  body("teams")
    .optional()
    .isArray({ min: 2, max: 2 })
    .withMessage("Teams must contain exactly 2 teams"),
  body("teams.*")
    .optional()
    .isMongoId()
    .withMessage("Invalid team ID format"),
  enumChain("status", ["scheduled", "ongoing", "completed"], false)
];

const deleteMatchValidator = [
  requiredMongoIdChain("param", "id", "Invalid match ID")
];

module.exports = {
  createMatchValidator,
  getMatchesByTournamentValidator,
  updateMatchResultValidator,
  getMatchByIdValidator,
  updateMatchValidator,
  deleteMatchValidator
};
