const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  numberChain,
  enumChain
} = require("./common.validator");

const createSponsorValidator = [
  body("name")
    .notEmpty()
    .withMessage("All fields required")
    .trim(),
  numberChain("amount", 0.01, 10000000, true),
  requiredMongoIdChain("body", "tournamentId", "Invalid tournament ID")
];

const updateSponsorValidator = [
  requiredMongoIdChain("param", "id", "Invalid sponsor ID"),
  body("name")
    .optional()
    .isString()
    .trim(),
  numberChain("amount", 0.01, 10000000, false)
];

const deleteSponsorValidator = [
  requiredMongoIdChain("param", "id", "Invalid sponsor ID")
];

const getSponsorsByTournamentValidator = [
  requiredMongoIdChain("param", "tournamentId", "Invalid tournament ID")
];

const selfSponsorValidator = [
  body("brandName")
    .notEmpty()
    .withMessage("Brand Name, Tournament, and Type are required.")
    .trim(),
  requiredMongoIdChain("body", "tournamentId", "Brand Name, Tournament, and Type are required."),
  enumChain("type", ["standard", "title", "inkind"], true),
  numberChain("winnerPrize", 0, 10000000, false),
  numberChain("runnerUpPrize", 0, 10000000, false),
  body("equipment")
    .optional()
    .isString()
    .trim(),
  numberChain("amount", 0, 10000000, false)
];

const verifySelfPaymentValidator = [
  body("razorpay_order_id").notEmpty().withMessage("Missing required payment fields."),
  body("razorpay_payment_id").notEmpty().withMessage("Missing required payment fields."),
  body("razorpay_signature").notEmpty().withMessage("Missing required payment fields."),
  requiredMongoIdChain("body", "sponsorId", "Invalid sponsor ID")
];

const getSponsorByIdValidator = [
  requiredMongoIdChain("param", "id", "Invalid sponsor ID")
];

module.exports = {
  createSponsorValidator,
  updateSponsorValidator,
  deleteSponsorValidator,
  getSponsorsByTournamentValidator,
  selfSponsorValidator,
  verifySelfPaymentValidator,
  getSponsorByIdValidator
};
