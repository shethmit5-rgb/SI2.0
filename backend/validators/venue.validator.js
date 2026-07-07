const { body } = require("express-validator");
const {
  requiredMongoIdChain,
  enumChain,
  numberChain
} = require("./common.validator");

const createVenueValidator = [
  body("name")
    .notEmpty()
    .withMessage("Venue name is required")
    .trim(),
  body("address")
    .notEmpty()
    .withMessage("Address is required")
    .trim(),
  enumChain("type", ["Indoor", "Outdoor"], false),
  numberChain("capacity", 1, 1000000, false, true)
];

const updateVenueValidator = [
  requiredMongoIdChain("param", "id", "Invalid venue ID"),
  body("name")
    .optional()
    .isString()
    .trim(),
  body("address")
    .optional()
    .isString()
    .trim(),
  enumChain("type", ["Indoor", "Outdoor"], false),
  numberChain("capacity", 1, 1000000, false, true)
];

const deleteVenueValidator = [
  requiredMongoIdChain("param", "id", "Invalid venue ID")
];

module.exports = {
  createVenueValidator,
  updateVenueValidator,
  deleteVenueValidator
};
