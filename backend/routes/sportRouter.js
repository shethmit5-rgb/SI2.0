const express = require("express");
const {
  createSport,
  getSports,
  updateSport,
  deleteSport,
} = require("../controllers/sportController");
const {
  createSportValidator,
  updateSportValidator,
  deleteSportValidator
} = require("../validators/sport.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post("/", createSportValidator, validateRequest, createSport);
router.get("/", getSports);
router.put("/:id", updateSportValidator, validateRequest, updateSport);
router.delete("/:id", deleteSportValidator, validateRequest, deleteSport);

module.exports = router;

