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
const {
  registerValidator,
  checkEmailValidator,
  sendEmailOtpValidator,
  verifyEmailOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resendResetOtpValidator,
  resetPasswordValidator
} = require("../validators/auth.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

// ================= REGISTER =================
router.post("/register", registerValidator, validateRequest, register);

// ================= CHECK EMAIL AVAILABILITY =================
router.post("/check-email", checkEmailValidator, validateRequest, checkEmail);

// ================= SEND EMAIL OTP =================
router.post("/send-email-otp", sendEmailOtpValidator, validateRequest, sendEmailOtp);

// ================= VERIFY EMAIL OTP =================
router.post("/verify-email-otp", verifyEmailOtpValidator, validateRequest, verifyEmailOtp);

// ================= LOGIN =================
router.post("/login", loginValidator, validateRequest, login);

// ================= FORGOT PASSWORD =================
router.post("/forgot-password", forgotPasswordValidator, validateRequest, forgotPassword);

// ================= RESEND PASSWORD RESET OTP =================
router.post("/resend-reset-otp", resendResetOtpValidator, validateRequest, resendResetOtp);

// ================= RESET PASSWORD WITH OTP =================
router.post("/reset-password", resetPasswordValidator, validateRequest, resetPassword);

module.exports = router;