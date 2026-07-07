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
const {
  payRegistrationValidator,
  verifyRegistrationPaymentValidator,
  registerTeamValidator,
  updateRegistrationValidator,
  checkRegistrationValidator,
  cancelRegistrationValidator
} = require("../validators/registration.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/* ================= TEAM REGISTRATION PAYMENTS ================= */
router.post("/pay", auth, payRegistrationValidator, validateRequest, initiateRegistrationPayment);
router.post("/verify-payment", auth, verifyRegistrationPaymentValidator, validateRequest, verifyRegistrationPayment);

/* ================= PLAYER → REGISTER TEAM ================= */
router.post("/", auth, role("player", "coach"), registerTeamValidator, validateRequest, registerTeam);

/* ================= GET MY REGISTRATIONS (PLAYER) ================= */
router.get("/my-registrations", auth, getMyRegistrations);

/* ================= ADMIN → GET ALL REGISTRATIONS ================= */
router.get("/", auth, role("admin", "organizer"), getAllRegistrations);

/* ================= ADMIN & ORGANIZER → UPDATE REGISTRATION ================= */
router.put("/:id", auth, role("admin", "organizer"), updateRegistrationValidator, validateRequest, updateRegistration);

/* ================= CHECK REGISTRATION STATUS ================= */
router.get("/check/:tournamentId/:teamId", auth, checkRegistrationValidator, validateRequest, checkRegistration);

// ================= CANCEL REGISTRATION =================
router.delete("/:id/cancel", auth, cancelRegistrationValidator, validateRequest, cancelRegistration);

module.exports = router;