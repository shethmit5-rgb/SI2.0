const express = require("express");
const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  changePassword,
  deactivateAccount,
} = require("../controllers/profileController");
const {
  updateProfileValidator,
  changePasswordValidator
} = require("../validators/profile.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/* ================= GET CURRENT USER PROFILE ================= */
router.get("/me", authMiddleware, getProfile);

/* ================= UPDATE OWN PROFILE ================= */
router.put(
  "/update",
  authMiddleware,
  upload.single("profileImage"),
  updateProfileValidator,
  validateRequest,
  updateProfile
);

/* ================= CHANGE PASSWORD ================= */
router.put(
  "/change-password",
  authMiddleware,
  changePasswordValidator,
  validateRequest,
  changePassword
);

/* ================= SOFT DELETE ACCOUNT ================= */
router.delete("/delete", authMiddleware, deactivateAccount);

module.exports = router;