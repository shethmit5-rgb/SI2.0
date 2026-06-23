const express = require("express");
const {
  registerTeam,
  getMyRegistrations,
  getAllRegistrations,
  updateRegistration,
  checkRegistration,
  cancelRegistration,
  initiateRegistrationPayment,
  verifyRegistrationPayment,
} = require("../controllers/registrationController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

/* ================= TEAM REGISTRATION PAYMENTS ================= */
router.post("/pay", auth, initiateRegistrationPayment);
router.post("/verify-payment", auth, verifyRegistrationPayment);

/* ================= PLAYER → REGISTER TEAM ================= */
router.post("/", auth, role("player", "coach"), registerTeam);

/* ================= GET MY REGISTRATIONS (PLAYER) ================= */
router.get("/my-registrations", auth, getMyRegistrations);

/* ================= ADMIN → GET ALL REGISTRATIONS ================= */
router.get("/", auth, role("admin", "organizer"), getAllRegistrations);

/* ================= ADMIN & ORGANIZER → UPDATE REGISTRATION ================= */
router.put("/:id", auth, role("admin", "organizer"), updateRegistration);

/* ================= CHECK REGISTRATION STATUS ================= */
router.get("/check/:tournamentId/:teamId", auth, checkRegistration);

// ================= CANCEL REGISTRATION =================
router.delete("/:id/cancel", auth, cancelRegistration);

module.exports = router;