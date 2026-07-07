const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
  getRazorpayKey,
  createOrder,
  verifyPayment,
  getTransactions,
  getAllPaymentsAdmin,
  adminOverridePayment,
} = require("../controllers/paymentController");
const {
  createPaymentOrderValidator,
  verifyPaymentValidator,
  adminOverridePaymentValidator
} = require("../validators/payment.validator");
const validateRequest = require("../middleware/validateRequest");

router.get("/get-key", auth, getRazorpayKey);
router.post("/create-order", auth, createPaymentOrderValidator, validateRequest, createOrder);
router.post("/verify-payment", auth, verifyPaymentValidator, validateRequest, verifyPayment);
router.get("/transactions", auth, getTransactions);
router.get("/admin/all", auth, getAllPaymentsAdmin);
router.post("/admin/override", auth, adminOverridePaymentValidator, validateRequest, adminOverridePayment);

module.exports = router;