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

router.get("/get-key", auth, getRazorpayKey);
router.post("/create-order", auth, createOrder);
router.post("/verify-payment", auth, verifyPayment);
router.get("/transactions", auth, getTransactions);
router.get("/admin/all", auth, getAllPaymentsAdmin);
router.post("/admin/override", auth, adminOverridePayment);

module.exports = router;