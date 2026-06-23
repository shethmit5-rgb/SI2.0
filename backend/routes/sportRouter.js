const express = require("express");
const {
  createSport,
  getSports,
  updateSport,
  deleteSport,
} = require("../controllers/sportController");

const router = express.Router();

router.post("/", createSport);
router.get("/", getSports);
router.put("/:id", updateSport);
router.delete("/:id", deleteSport);

module.exports = router;
