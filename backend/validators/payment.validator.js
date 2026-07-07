const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  numberChain,
  enumChain
} = require("./common.validator");

const createPaymentOrderValidator = [
  numberChain("amount", 0.01, 10000000, true),
  requiredMongoIdChain("body", "registrationId", "Invalid registration ID"),
  requiredMongoIdChain("body", "tournamentId", "Invalid tournament ID")
];

const verifyPaymentValidator = [
  body("razorpay_order_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_payment_id").notEmpty().withMessage("Missing verification payload"),
  body("razorpay_signature").notEmpty().withMessage("Missing verification payload"),
  requiredMongoIdChain("body", "transactionId", "Invalid transaction ID")
];

const adminOverridePaymentValidator = [
  requiredMongoIdChain("body", "transactionId", "Missing required fields"),
  enumChain("status", ["paid", "failed", "refunded", "created", "attempted", "pending"], true)
];

module.exports = {
  createPaymentOrderValidator,
  verifyPaymentValidator,
  adminOverridePaymentValidator
};
