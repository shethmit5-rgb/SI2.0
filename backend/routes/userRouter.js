const express = require("express");
const { body, param } = require("express-validator");

const {
  getUsers,
  getPublicUsers,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

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
  [
    body("name")
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ min: 3 })
      .withMessage("Name must be at least 3 characters"),

    body("email")
      .notEmpty()
      .withMessage("Email is required")
      .isEmail()
      .withMessage("Invalid email format"),

    body("password")
      .notEmpty()
      .withMessage("Password is required")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  createUser
);

/* ================= UPDATE USER (ADMIN ONLY) ================= */
router.put(
  "/:id",
  auth,
  role("admin"),
  [
    param("id").isMongoId().withMessage("Invalid user ID"),

    body("email")
      .optional()
      .isEmail()
      .withMessage("Invalid email format"),

    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  updateUser
);

/* ================= DELETE USER (ADMIN ONLY) ================= */
router.delete(
  "/:id",
  auth,
  role("admin"),
  [param("id").isMongoId().withMessage("Invalid user ID")],
  deleteUser
);

module.exports = router;