const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  enumChain,
  numberChain
} = require("./common.validator");

const createSportValidator = [
  body("name")
    .notEmpty()
    .withMessage("Sport name is required")
    .trim(),
  enumChain("type", ["Indoor", "Outdoor"], false),
  numberChain("playersPerTeam", 1, 100, false, true)
];

const updateSportValidator = [
  requiredMongoIdChain("param", "id", "Invalid sport ID"),
  body("name")
    .optional()
    .isString()
    .trim(),
  enumChain("type", ["Indoor", "Outdoor"], false),
  numberChain("playersPerTeam", 1, 100, false, true)
];

const deleteSportValidator = [
  requiredMongoIdChain("param", "id", "Invalid sport ID")
];

module.exports = {
  createSportValidator,
  updateSportValidator,
  deleteSportValidator
};
