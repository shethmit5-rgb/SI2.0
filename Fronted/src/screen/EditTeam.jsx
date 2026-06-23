import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import "../static/EditTeam.css";

export default function EditTeam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [teamName, setTeamName] = useState("");
  const [playerJoiningFee, setPlayerJoiningFee] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, [id]);

  const fetchTeam = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeamName(res.data.teamName);
      setPlayerJoiningFee(res.data.playerJoiningFee !== undefined ? res.data.playerJoiningFee : "");
    } catch (err) {
      console.error("Failed to fetch team:", err);
      alert("Team not found");
      navigate("/my-teams");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      alert("Team name is required");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/teams/${id}`, { teamName, playerJoiningFee: Number(playerJoiningFee) || 0 });
      alert("✅ Team updated successfully!");
      navigate(`/team/${id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update team");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="edit-team-page">
      <div className="edit-team-card">
        <h2>Edit Team</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>
          <div className="form-group">
            <label>Player Joining Fee (₹)</label>
            <input
              type="number"
              value={playerJoiningFee}
              onChange={(e) => setPlayerJoiningFee(e.target.value)}
              placeholder="e.g. 500 (0 for free)"
              min="0"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={() => navigate(-1)} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="save-btn">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}