const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  enumChain
} = require("./common.validator");

const payRegistrationValidator = [
  requiredMongoIdChain("body", "tournamentId", "Invalid tournament ID"),
  requiredMongoIdChain("body", "teamId", "Invalid team ID")
];

const verifyRegistrationPaymentValidator = [
  body("razorpay_order_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_payment_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_signature").notEmpty().withMessage("Missing verification payload"),
  requiredMongoIdChain("body", "transactionId", "Invalid transaction ID")
];

const registerTeamValidator = [
  requiredMongoIdChain("body", "tournamentId", "Invalid tournament ID"),
  requiredMongoIdChain("body", "teamId", "Invalid team ID")
];

const updateRegistrationValidator = [
  requiredMongoIdChain("param", "id", "Invalid registration ID"),
  enumChain("approvalStatus", ["pending", "approved", "rejected"], false),
  enumChain("paymentStatus", ["Pending", "Paid", "Failed", "Refunded"], false)
];

const checkRegistrationValidator = [
  requiredMongoIdChain("param", "tournamentId", "Invalid tournament ID"),
  requiredMongoIdChain("param", "teamId", "Invalid team ID")
];

const cancelRegistrationValidator = [
  requiredMongoIdChain("param", "id", "Invalid registration ID")
];

module.exports = {
  payRegistrationValidator,
  verifyRegistrationPaymentValidator,
  registerTeamValidator,
  updateRegistrationValidator,
  checkRegistrationValidator,
  cancelRegistrationValidator
};
