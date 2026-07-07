const express = require("express");
const {
  createVenue,
  getVenues,
  updateVenue,
  deleteVenue,
} = require("../controllers/venueController");
const {
  createVenueValidator,
  updateVenueValidator,
  deleteVenueValidator
} = require("../validators/venue.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post("/", createVenueValidator, validateRequest, createVenue);
router.get("/", getVenues);
router.put("/:id", updateVenueValidator, validateRequest, updateVenue);
router.delete("/:id", deleteVenueValidator, validateRequest, deleteVenue);

module.exports = router;

