const { body } = require("express-validator");
const {
  nameChain,
  phoneChain,
  enumChain,
  passwordChain
} = require("./common.validator");

const updateProfileValidator = [
  nameChain("name", false),
  phoneChain("phoneNumber", false),
  enumChain("gender", ["male", "female", "other"], false),
  body("location")
    .optional()
    .isString()
    .withMessage("Location must be a string")
    .trim(),
  body("description")
    .optional()
    .isString()
    .withMessage("Description must be a string")
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters")
    .trim()
];

const changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("All fields are required"),
  passwordChain("newPassword")
];

module.exports = {
  updateProfileValidator,
  changePasswordValidator
};
