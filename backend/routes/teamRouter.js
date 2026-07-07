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
  initiatePlayerJoinPayment,
  verifyPlayerJoinPayment,
} = require("../controllers/teamController");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createTeamValidator,
  payJoinValidator,
  verifyJoinValidator,
  getTeamsByTournamentValidator,
  applyToTeamValidator,
  approvePlayerValidator,
  approvePlayerShortcutValidator,
  getTeamByIdValidator,
  updateTeamValidator,
  blockMembersValidator,
  deleteTeamValidator,
  leaveTeamValidator,
  deleteTeamByCaptainValidator
} = require("../validators/team.validator");
const validateRequest = require("../middleware/validateRequest");

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
router.post("/pay-join", auth, blockOrganizerForTeamManagement, payJoinValidator, validateRequest, initiatePlayerJoinPayment);
router.post("/verify-join", auth, blockOrganizerForTeamManagement, verifyJoinValidator, validateRequest, verifyPlayerJoinPayment);

/* =========================================================
   CREATE TEAM
========================================================= */
router.post("/", auth, blockOrganizerForTeamManagement, createTeamValidator, validateRequest, createTeam);

/* =========================================================
   ADMIN: GET ALL TEAMS
========================================================= */
router.get("/", auth, role("admin", "organizer"), getTeams);

/* =========================================================
   GET TEAMS BY TOURNAMENT
========================================================= */
router.get("/tournament/:tournamentId", auth, getTeamsByTournamentValidator, validateRequest, getTeamsByTournament);

/* =========================================================
   PLAYER APPLY TO TEAM
========================================================= */
router.post("/:teamId/apply", auth, blockOrganizerForTeamManagement, applyToTeamValidator, validateRequest, applyToTeam);

/* =========================================================
   CAPTAIN APPROVE / REJECT PLAYER
========================================================= */
router.put("/:teamId/approve", auth, blockOrganizerForTeamManagement, approvePlayerValidator, validateRequest, approvePlayer);
router.put("/:teamId/player/:playerId", auth, blockOrganizerForTeamManagement, approvePlayerShortcutValidator, validateRequest, (req, res, next) => {
  req.body.userId = req.params.playerId;
  req.body.action = req.body.status;
  approvePlayer(req, res, next);
});

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
router.get("/:id", getTeamByIdValidator, validateRequest, getTeamById);

/* =========================================================
   ADMIN UPDATE / DELETE
========================================================= */
// ================= EDIT TEAM (CAPTAIN ONLY) =================
router.put("/:id", auth, blockOrganizerForTeamManagement, updateTeamValidator, validateRequest, updateTeam);

// ================= PUT /teams/:id/members =================
router.put("/:id/members", auth, blockOrganizerForTeamManagement, blockMembersValidator, validateRequest, blockMembers);

router.delete("/:id", auth, blockOrganizerForTeamManagement, role("admin"), deleteTeamValidator, validateRequest, deleteTeamByAdmin);

// ================= LEAVE TEAM (PLAYER) =================
router.delete("/:teamId/leave", auth, blockOrganizerForTeamManagement, leaveTeamValidator, validateRequest, leaveTeam);

// ================= DELETE TEAM (CAPTAIN ONLY) =================
router.delete("/:id/delete", auth, blockOrganizerForTeamManagement, deleteTeamByCaptainValidator, validateRequest, deleteTeamByCaptain);

module.exports = router;