const express = require("express");
const {
  getUsers,
  getPublicUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createUserValidator,
  updateUserValidator,
  deleteUserValidator
} = require("../validators/user.validator");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

/* ================= GET ALL USERS (ADMIN ONLY) ================= */
router.get("/", auth, role("admin"), getUsers);

// Public endpoint - No authentication required
router.get("/public", getPublicUsers);

/* ================= CREATE USER (ADMIN ONLY) ================= */
router.post(
  "/",
  auth,
  role("admin"),
  createUserValidator,
  validateRequest,
  createUser
);

/* ================= UPDATE USER (ADMIN ONLY) ================= */
router.put(
  "/:id",
  auth,
  role("admin"),
  updateUserValidator,
  validateRequest,
  updateUser
);

/* ================= DELETE USER (ADMIN ONLY) ================= */
router.delete(
  "/:id",
  auth,
  role("admin"),
  deleteUserValidator,
  validateRequest,
  deleteUser
);

module.exports = router;