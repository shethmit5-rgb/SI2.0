const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  mongoIdChain,
  numberChain,
  dateChain,
  enumChain
} = require("./common.validator");

const createTournamentValidator = [
  body("eventName")
    .notEmpty()
    .withMessage("Missing required fields")
    .isLength({ min: 3 })
    .withMessage("Tournament name must be at least 3 characters")
    .trim(),
  requiredMongoIdChain("body", "sportId", "Missing required fields"),
  requiredMongoIdChain("body", "venueId", "Venue is required"),
  body("location")
    .optional()
    .isString()
    .trim(),
  dateChain("startDate"),
  dateChain("endDate"),
  numberChain("maxParticipants", 2, 100, false, true),
  body("description")
    .optional()
    .isString()
    .trim(),
  body("rules")
    .optional()
    .isString()
    .trim(),
  mongoIdChain("body", "organizerId", "Invalid organizer ID"),
  numberChain("teamRegistrationFee", 0, 1000000, false)
];

const verifyTournamentPaymentValidator = [
  body("razorpay_order_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_payment_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_signature").notEmpty().withMessage("Missing verification payload"),
  requiredMongoIdChain("body", "transactionId", "Invalid transaction ID")
];

const getTournamentValidator = [
  requiredMongoIdChain("param", "id", "Invalid tournament ID")
];

const updateTournamentValidator = [
  requiredMongoIdChain("param", "id", "Invalid tournament ID"),
  body("eventName")
    .optional()
    .isLength({ min: 3 })
    .withMessage("Tournament name must be at least 3 characters")
    .trim(),
  mongoIdChain("body", "sportId", "Invalid sport ID"),
  mongoIdChain("body", "venueId", "Invalid venue ID"),
  body("location")
    .optional()
    .isString()
    .trim(),
  dateChain("startDate", false),
  dateChain("endDate", false),
  numberChain("maxParticipants", 2, 100, false, true),
  body("description")
    .optional()
    .isString()
    .trim(),
  body("rules")
    .optional()
    .isString()
    .trim(),
  enumChain("status", ["upcoming", "ongoing", "completed"], false),
  mongoIdChain("body", "organizerId", "Invalid organizer ID"),
  numberChain("teamRegistrationFee", 0, 1000000, false)
];

const deleteTournamentValidator = [
  requiredMongoIdChain("param", "id", "Invalid tournament ID")
];

const getTournamentMatchesValidator = [
  requiredMongoIdChain("param", "id", "Invalid tournament ID")
];

const getTournamentRoundInfoValidator = [
  requiredMongoIdChain("param", "id", "Invalid tournament ID")
];

module.exports = {
  createTournamentValidator,
  verifyTournamentPaymentValidator,
  getTournamentValidator,
  updateTournamentValidator,
  deleteTournamentValidator,
  getTournamentMatchesValidator,
  getTournamentRoundInfoValidator
};
