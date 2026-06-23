const express = require("express");
const {
  createVenue,
  getVenues,
  updateVenue,
  deleteVenue,
} = require("../controllers/venueController");

const router = express.Router();

router.post("/", createVenue);
router.get("/", getVenues);
router.put("/:id", updateVenue);
router.delete("/:id", deleteVenue);

module.exports = router;
