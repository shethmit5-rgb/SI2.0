const express = require("express");
const {
  register,
  checkEmail,
  verifyPhone,
  resendOtp,
  login,
  forgotPassword,
  resendResetOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// ================= REGISTER WITH MOBILE OTP =================
router.post("/register", register);

// ================= CHECK EMAIL AVAILABILITY =================
router.post("/check-email", checkEmail);

// ================= VERIFY PHONE OTP =================
router.post("/verify-phone", verifyPhone);

// ================= RESEND PHONE OTP =================
router.post("/resend-otp", resendOtp);

// ================= LOGIN =================
router.post("/login", login);

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", forgotPassword);

// ================= RESEND PASSWORD RESET OTP =================
router.post("/resend-reset-otp", resendResetOtp);

// ================= RESET PASSWORD WITH OTP =================
router.post("/reset-password", resetPassword);

module.exports = router;