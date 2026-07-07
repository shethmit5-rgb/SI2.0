const { requiredMongoIdChain } = require("./common.validator");

const getPrizeDistributionByTournamentValidator = [
  requiredMongoIdChain("param", "tournamentId", "Invalid tournament ID")
];

const distributePrizesValidator = [
  requiredMongoIdChain("param", "tournamentId", "Invalid tournament ID")
];

module.exports = {
  getPrizeDistributionByTournamentValidator,
  distributePrizesValidator
};
