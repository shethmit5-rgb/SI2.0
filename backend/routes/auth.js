const express = require("express");
const {
  register,
  checkEmail,
  sendEmailOtp,
  verifyEmailOtp,
  login,
  forgotPassword,
  resendResetOtp,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// ================= REGISTER =================
router.post("/register", register);

// ================= CHECK EMAIL AVAILABILITY =================
router.post("/check-email", checkEmail);

// ================= SEND EMAIL OTP =================
router.post("/send-email-otp", sendEmailOtp);

// ================= VERIFY EMAIL OTP =================
router.post("/verify-email-otp", verifyEmailOtp);

// ================= LOGIN =================
router.post("/login", login);

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", forgotPassword);

// ================= RESEND PASSWORD RESET OTP =================
router.post("/resend-reset-otp", resendResetOtp);

// ================= RESET PASSWORD WITH OTP =================
router.post("/reset-password", resetPassword);

module.exports = router;