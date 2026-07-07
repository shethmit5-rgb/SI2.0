const { body } = require("express-validator");
const {
  emailChain,
  passwordChain,
  nameChain,
  phoneChain
} = require("./common.validator");

const registerValidator = [
  nameChain("name"),
  emailChain("email"),
  phoneChain("phoneNumber"),
  passwordChain("password"),
  body("role")
    .optional()
    .isIn(["player", "coach", "organizer", "admin", "sponsor"])
    .withMessage("Invalid role")
];

const checkEmailValidator = [
  emailChain("email")
];

const sendEmailOtpValidator = [
  emailChain("email")
];

const verifyEmailOtpValidator = [
  emailChain("email"),
  body("otp")
    .notEmpty()
    .withMessage("Email and OTP code are required")
    .isNumeric()
    .withMessage("OTP must be a numeric code")
    .isLength({ min: 6, max: 6 })
    .withMessage("OTP must be 6 digits")
];

const loginValidator = [
  emailChain("email"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
];

const forgotPasswordValidator = [
  emailChain("email")
];

const resendResetOtpValidator = [
  emailChain("email")
];

const resetPasswordValidator = [
  emailChain("email"),
  body("code")
    .notEmpty()
    .withMessage("All fields are required")
    .isNumeric()
    .withMessage("Code must be a numeric code")
    .isLength({ min: 6, max: 6 })
    .withMessage("Invalid or expired reset code"),
  passwordChain("newPassword")
];

module.exports = {
  registerValidator,
  checkEmailValidator,
  sendEmailOtpValidator,
  verifyEmailOtpValidator,
  loginValidator,
  forgotPasswordValidator,
  resendResetOtpValidator,
  resetPasswordValidator
};
