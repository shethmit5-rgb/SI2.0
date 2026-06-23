const Venue = require("../models/Venue");

exports.createVenue = async (req, res, next) => {
  try {
    const venue = new Venue(req.body);
    await venue.save();
    res.json({ message: "Venue created", venue });
  } catch (err) {
    next(err);
  }
};

exports.getVenues = async (req, res, next) => {
  try {
    const venues = await Venue.find();
    res.json(venues);
  } catch (err) {
    next(err);
  }
};

exports.updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: "Venue updated", venue });
  } catch (err) {
    next(err);
  }
};

exports.deleteVenue = async (req, res, next) => {
  try {
    await Venue.findByIdAndDelete(req.params.id);
    res.json({ message: "Venue deleted" });
  } catch (err) {
    next(err);
  }
};
