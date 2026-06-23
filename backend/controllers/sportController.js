const Sport = require("../models/Sport");

exports.createSport = async (req, res, next) => {
  try {
    const sport = new Sport(req.body);
    await sport.save();
    res.json({ message: "Sport created", sport });
  } catch (err) {
    next(err);
  }
};

exports.getSports = async (req, res, next) => {
  try {
    const sports = await Sport.find();
    res.json(sports);
  } catch (err) {
    next(err);
  }
};

exports.updateSport = async (req, res, next) => {
  try {
    const sport = await Sport.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Sport updated", sport });
  } catch (err) {
    next(err);
  }
};

exports.deleteSport = async (req, res, next) => {
  try {
    await Sport.findByIdAndDelete(req.params.id);
    res.json({ message: "Sport deleted" });
  } catch (err) {
    next(err);
  }
};
