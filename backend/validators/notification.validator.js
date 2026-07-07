const { requiredMongoIdChain } = require("./common.validator");

const markNotificationReadValidator = [
  requiredMongoIdChain("param", "id", "Invalid notification ID")
];

const deleteNotificationValidator = [
  requiredMongoIdChain("param", "id", "Invalid notification ID")
];

module.exports = {
  markNotificationReadValidator,
  deleteNotificationValidator
};
