import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
// Removed payment service imports since payment happens after organizer approval
import "../static/RegisterTeam.css";
import SkeletonForm from "../components/loading/SkeletonForm";

export default function RegisterTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get("tournament");

  const [formData, setFormData] = useState({
    teamName: "",
    tournamentId: tournamentId || "",
    sportId: ""
  });

  const [tournament, setTournament] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [existingRegistration, setExistingRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (user.role !== "coach" && user.role !== "admin" && user.role !== "organizer") {
      navigate("/");
      return;
    }
    fetchData();
  }, [tournamentId, user]);

  const fetchData = async () => {
    try {
      // Fetch tournament details
      if (tournamentId) {
        const tournamentRes = await api.get(`/tournaments/public/${tournamentId}`);
        setTournament(tournamentRes.data);
        setFormData(prev => ({ 
          ...prev, 
          sportId: tournamentRes.data.sportId?._id || "" 
        }));
      }

      // Fetch user's existing teams
      const teamsRes = await api.get("/teams/my-teams");
      setUserTeams(teamsRes.data);

      // Check if user already has a team registered for this tournament
      for (const team of teamsRes.data) {
        try {
          const checkRes = await api.get(`/registrations/check/${tournamentId}/${team._id}`);
          if (checkRes.data) {
            setExistingRegistration(checkRes.data);
            break;
          }
        } catch (err) {
          // No registration found, continue
        }
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
      setError("Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validation
    if (!formData.teamName.trim()) {
      setError("Team name is required");
      setSubmitting(false);
      return;
    }

    if (formData.teamName.length < 3) {
      setError("Team name must be at least 3 characters");
      setSubmitting(false);
      return;
    }

    try {
      // Create team - backend automatically sets captainId as logged-in user
      const res = await api.post("/teams", {
        teamName: formData.teamName.trim(),
        tournamentId: formData.tournamentId,
        sportId: formData.sportId
      });
      
      const teamId = res.data._id;

      // Register the team as pending
      await api.post("/registrations", {
        tournamentId: formData.tournamentId,
        teamId: teamId
      });

      alert("Registration submitted successfully. Waiting for organizer approval.");
      navigate("/my-registrations");
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.response?.data?.message || "Failed to create team");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseExistingTeam = async (teamId) => {
    setSubmitting(true);
    try {
      // Check if already registered
      const checkRes = await api.get(`/registrations/check/${formData.tournamentId}/${teamId}`);
      if (checkRes.data) {
        alert("⚠️ This team is already registered for this tournament!");
        setSubmitting(false);
        return;
      }

      // Register the team as pending
      await api.post("/registrations", {
        tournamentId: formData.tournamentId,
        teamId: teamId
      });

      alert("Registration submitted successfully. Waiting for organizer approval.");
      navigate("/my-registrations");
    } catch (err) {
      console.error("Registration error:", err);
      alert(err.response?.data?.message || "Failed to register team");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="register-team-page">
        <SkeletonForm fields={4} />
      </div>
    );
  }

  // Show if already registered
  if (existingRegistration) {
    return (
      <div className="register-team-page">
        <div className="already-registered">
          <h2>⚠️ Already Registered</h2>
          <p>Your team is already registered for this tournament.</p>
          <p>Status: <strong>{existingRegistration.approvalStatus}</strong></p>
          <button onClick={() => navigate(`/my-registrations`)} className="submit-btn">
            View My Registrations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-team-page">
      <h1>Register Team for Tournament</h1>
      
      {tournament && (
        <div className="tournament-info">
          <h2>{tournament.eventName}</h2>
          <p>🏆 Sport: {tournament.sportId?.name}</p>
          <p>📅 Dates: {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</p>
          <p>📍 Location: {tournament.location || "TBD"}</p>
          {tournament.prizePool > 0 && <p>💰 Prize Pool: ₹{tournament.prizePool}</p>}
          <p>💳 Registration Fee: {tournament.teamRegistrationFee > 0 ? `₹${tournament.teamRegistrationFee.toLocaleString()}` : "Free"}</p>
        </div>
      )}

      {error && <div className="error-message" style={{ color: "red", marginBottom: "15px" }}>{error}</div>}

      {/* Existing Teams */}
      {userTeams.length > 0 && (
        <div className="existing-teams">
          <h3>📋 Use Existing Team</h3>
          <div className="teams-list">
            {userTeams.map(team => (
              <div key={team._id} className="team-item">
                <div>
                  <strong>{team.teamName}</strong>
                  <small style={{ display: "block", color: "#666" }}>
                    Players: {team.players?.filter(p => p.status === "approved").length || 0}
                  </small>
                </div>
                <button 
                  onClick={() => handleUseExistingTeam(team._id)}
                  className="use-team-btn"
                  disabled={submitting}
                >
                  Register This Team
                </button>
              </div>
            ))}
          </div>
          <p className="or-divider">━━━━━━━━━━━━ OR ━━━━━━━━━━━━</p>
        </div>
      )}

      {/* Create New Team Form */}
      <h3>✨ Create New Team</h3>
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label>Team Name *</label>
          <input
            type="text"
            name="teamName"
            value={formData.teamName}
            onChange={handleChange}
            required
            placeholder="Enter team name"
            maxLength="50"
          />
          <small>You will be the captain of this team</small>
        </div>

        <input type="hidden" name="tournamentId" value={formData.tournamentId} />
        <input type="hidden" name="sportId" value={formData.sportId} />

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="submit-btn">
            {submitting ? "Creating..." : "Create & Register Team"}
          </button>
        </div>
      </form>
    </div>
  );
}