const { body } = require("express-validator");
const {
  emailChain,
  passwordChain,
  nameChain,
  requiredMongoIdChain
} = require("./common.validator");

const createUserValidator = [
  nameChain("name"),
  emailChain("email"),
  passwordChain("password")
];

const updateUserValidator = [
  requiredMongoIdChain("param", "id", "Invalid user ID"),
  emailChain("email", false),
  passwordChain("password", false)
];

const deleteUserValidator = [
  requiredMongoIdChain("param", "id", "Invalid user ID")
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator
};
