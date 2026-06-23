const express = require("express");
const {
  createTeam,
  getTeams,
  getTeamsByTournament,
  applyToTeam,
  approvePlayer,
  getMyTeams,
  getCaptainTeams,
  getPublicTeams,
  getTeamById,
  updateTeam,
  blockMembers,
  deleteTeamByAdmin,
  leaveTeam,
  deleteTeamByCaptain,
  initiateJoinPayment,
  verifyJoinPayment,
} = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");

const router = express.Router();

// Block Organizer from create, join, edit, delete team actions
const blockOrganizerForTeamManagement = (req, res, next) => {
  if (req.user && req.user.role === "organizer") {
    return res.status(403).json({
      message: "Organizers can view teams but cannot create, join, or manage team membership."
    });
  }
  next();
};

/* ================= PLAYER JOINING PAYMENTS ================= */
router.post("/pay-join", auth, blockOrganizerForTeamManagement, initiateJoinPayment);
router.post("/verify-join", auth, blockOrganizerForTeamManagement, verifyJoinPayment);

/* =========================================================
   CREATE TEAM
========================================================= */
router.post("/", auth, blockOrganizerForTeamManagement, createTeam);

/* =========================================================
   ADMIN: GET ALL TEAMS
========================================================= */
router.get("/", auth, role("admin", "organizer"), getTeams);

/* =========================================================
   GET TEAMS BY TOURNAMENT
========================================================= */
router.get("/tournament/:tournamentId", auth, getTeamsByTournament);

/* =========================================================
   PLAYER APPLY TO TEAM
========================================================= */
router.post("/:teamId/apply", auth, blockOrganizerForTeamManagement, applyToTeam);

/* =========================================================
   CAPTAIN APPROVE / REJECT PLAYER
========================================================= */
router.put("/:teamId/approve", auth, blockOrganizerForTeamManagement, approvePlayer);

/* =========================================================
   GET MY TEAMS
========================================================= */
router.get("/my-teams", auth, getMyTeams);

/* =========================================================
   GET CAPTAIN TEAMS
========================================================= */
router.get("/captain-teams", auth, getCaptainTeams);

/* =========================================================
   PUBLIC TEAMS
========================================================= */
router.get("/public", getPublicTeams);

/* =========================================================
   GET SINGLE TEAM
========================================================= */
router.get("/:id", getTeamById);

/* =========================================================
   ADMIN UPDATE / DELETE
========================================================= */
// ================= EDIT TEAM (CAPTAIN ONLY) =================
router.put("/:id", auth, blockOrganizerForTeamManagement, updateTeam);

// ================= PUT /teams/:id/members =================
router.put("/:id/members", auth, blockOrganizerForTeamManagement, blockMembers);

router.delete("/:id", auth, blockOrganizerForTeamManagement, role("admin"), deleteTeamByAdmin);

// ================= LEAVE TEAM (PLAYER) =================
router.delete("/:teamId/leave", auth, blockOrganizerForTeamManagement, leaveTeam);

// ================= DELETE TEAM (CAPTAIN ONLY) =================
router.delete("/:id/delete", auth, blockOrganizerForTeamManagement, deleteTeamByCaptain);

module.exports = router;