const { body, param } = require("express-validator");
const {
  requiredMongoIdChain,
  mongoIdChain,
  numberChain,
  enumChain
} = require("./common.validator");

const createTeamValidator = [
  body("teamName")
    .notEmpty()
    .withMessage("Team name is required")
    .isLength({ min: 3, max: 50 })
    .withMessage("Team name must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage("Team name can only contain letters, numbers and spaces")
    .trim(),
  requiredMongoIdChain("body", "tournamentId", "Invalid tournament ID"),
  requiredMongoIdChain("body", "sportId", "Invalid sport ID"),
  mongoIdChain("body", "captainId", "Invalid captain ID"),
  numberChain("playerJoiningFee", 0, 1000000, false)
];

const payJoinValidator = [
  requiredMongoIdChain("body", "teamId", "Invalid team ID")
];

const verifyJoinValidator = [
  body("razorpay_order_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_payment_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_signature").notEmpty().withMessage("Missing verification payload"),
  requiredMongoIdChain("body", "transactionId", "Invalid transaction ID")
];

const getTeamsByTournamentValidator = [
  requiredMongoIdChain("param", "tournamentId", "Invalid tournament ID")
];

const applyToTeamValidator = [
  requiredMongoIdChain("param", "teamId", "Invalid team ID")
];

const approvePlayerValidator = [
  requiredMongoIdChain("param", "teamId", "Invalid team ID"),
  requiredMongoIdChain("body", "userId", "Invalid player ID"),
  enumChain("action", ["approved", "rejected"])
];

const approvePlayerShortcutValidator = [
  requiredMongoIdChain("param", "teamId", "Invalid team ID"),
  requiredMongoIdChain("param", "playerId", "Invalid player ID"),
  enumChain("status", ["approved", "rejected"])
];

const getTeamByIdValidator = [
  requiredMongoIdChain("param", "id", "Invalid team ID")
];

const updateTeamValidator = [
  requiredMongoIdChain("param", "id", "Invalid team ID"),
  body("teamName")
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage("Team name must be between 3 and 50 characters")
    .matches(/^[a-zA-Z0-9\s]+$/)
    .withMessage("Team name can only contain letters, numbers and spaces")
    .trim(),
  numberChain("playerJoiningFee", 0, 1000000, false)
];

const blockMembersValidator = [
  requiredMongoIdChain("param", "id", "Invalid team ID"),
  body("blockedUsers")
    .isArray()
    .withMessage("blockedUsers must be an array of player IDs"),
  body("blockedUsers.*")
    .isMongoId()
    .withMessage("Invalid player ID in blocked list")
];

const deleteTeamValidator = [
  requiredMongoIdChain("param", "id", "Invalid team ID")
];

const leaveTeamValidator = [
  requiredMongoIdChain("param", "teamId", "Invalid team ID")
];

const deleteTeamByCaptainValidator = [
  requiredMongoIdChain("param", "id", "Invalid team ID")
];

module.exports = {
  createTeamValidator,
  payJoinValidator,
  verifyJoinValidator,
  getTeamsByTournamentValidator,
  applyToTeamValidator,
  approvePlayerValidator,
  approvePlayerShortcutValidator,
  getTeamByIdValidator,
  updateTeamValidator,
  blockMembersValidator,
  deleteTeamValidator,
  leaveTeamValidator,
  deleteTeamByCaptainValidator
};
