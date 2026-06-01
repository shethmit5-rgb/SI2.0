import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/CreateTeam.css";

export default function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    teamName: "",
    tournamentId: "",
    sportId: ""
  });

  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(false);
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
  }, [user]);

  const fetchData = async () => {
    try {
      // ✅ FIXED: Use public endpoint for tournaments
      const [tournamentsRes, sportsRes] = await Promise.all([
        api.get("/tournaments/public?status=upcoming"),
        api.get("/sports")
      ]);
      setTournaments(tournamentsRes.data);
      setSports(sportsRes.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Auto-select sport when tournament is selected
    if (e.target.name === "tournamentId") {
      const selectedTournament = tournaments.find(t => t._id === e.target.value);
      if (selectedTournament?.sportId) {
        setFormData(prev => ({ ...prev, sportId: selectedTournament.sportId._id }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // ✅ This is a POST request - KEEP AS IS (needs auth)
      const res = await api.post("/teams", formData);
      alert("Team created successfully!");
      navigate(`/team/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-team-page">
      <h1>Create New Team</h1>
      
      <form onSubmit={handleSubmit} className="create-team-form">
        {error && <div className="error-message">{error}</div>}

        <div className="form-group">
          <label>Team Name *</label>
          <input
            type="text"
            name="teamName"
            value={formData.teamName}
            onChange={handleChange}
            required
            placeholder="Enter team name"
          />
        </div>

        <div className="form-group">
          <label>Select Tournament *</label>
          <select
            name="tournamentId"
            value={formData.tournamentId}
            onChange={handleChange}
            required
          >
            <option value="">Choose a tournament</option>
            {tournaments.map(t => (
              <option key={t._id} value={t._id}>
                {t.eventName} ({t.sportId?.name})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Sport *</label>
          <select
            name="sportId"
            value={formData.sportId}
            onChange={handleChange}
            required
            disabled={!!formData.tournamentId}
          >
            <option value="">Select sport</option>
            {sports.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          {formData.tournamentId && (
            <small>Sport is auto-selected based on tournament</small>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? "Creating..." : "Create Team"}
          </button>
        </div>
      </form>
    </div>
  );
}