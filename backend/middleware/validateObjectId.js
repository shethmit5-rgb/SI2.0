const mongoose = require("mongoose");

module.exports = function(req, res, next) {
  // Check common ObjectId parameters like id or tournamentId
  const idToCheck = req.params.id || req.params.tournamentId;
  
  if (idToCheck && !mongoose.Types.ObjectId.isValid(idToCheck)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  
  next();
};
