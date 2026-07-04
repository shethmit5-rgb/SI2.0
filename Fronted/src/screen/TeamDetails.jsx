import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/TeamDetails.css";
import SkeletonTeam from "../components/loading/SkeletonTeam";

export default function TeamDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [playerStatus, setPlayerStatus] = useState(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingFee, setEditingFee] = useState(false);
  const [feeValue, setFeeValue] = useState("");

  useEffect(() => {
    fetchTeamDetails();
  }, [id]);

  const handleUpdateFee = async () => {
    try {
      setActionLoading(true);
      await api.put(`/teams/${id}`, { playerJoiningFee: Number(feeValue) || 0 });
      alert("✅ Player joining fee updated successfully!");
      setEditingFee(false);
      fetchTeamDetails();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update joining fee");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchTeamDetails = async () => {
    try {
      const res = await api.get(`/teams/${id}`);
      setTeam(res.data);
      setPlayers(res.data.players || []);
      
      if (user) {
        setIsCaptain(res.data.captainId?._id === user._id);
        const playerRecord = res.data.players?.find(p => p.userId?._id === user._id);
        setApplied(!!playerRecord);
        setPlayerStatus(playerRecord ? playerRecord.status : null);
      }
    } catch (err) {
      console.error("Failed to fetch team", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setActionLoading(true);
    try {
      await api.post(`/teams/${id}/apply`);
      alert("✅ Application sent successfully!");
      fetchTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to apply");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlayerStatus = async (playerId, status, playerName) => {
    setActionLoading(playerId);
    try {
      await api.put(`/teams/${id}/player/${playerId}`, { status });
      alert(`✅ ${playerName} has been ${status === "approved" ? "approved" : "rejected"}`);
      fetchTeamDetails();
    } catch (err) {
      alert("Failed to update player status");
    } finally {
      setActionLoading(false);
    }
  };

  const generateInviteLink = () => {
    const link = `${window.location.origin}/teams/join/${team._id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm(`Are you sure you want to leave this team?`)) return;
    
    setActionLoading(true);
    try {
      await api.delete(`/teams/${id}/leave`);
      alert(`✅ You have left the team`);
      fetchTeamDetails();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to leave team");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <SkeletonTeam />;
  if (!team) return <div className="error-message">Team not found</div>;

  const approvedCount = players.filter(p => p.status === "approved").length;
  const maxPlayers = team.sportId?.playersPerTeam || 11;
  const progressPercent = (approvedCount / maxPlayers) * 100;

  return (
    <div className="team-details-page">
      {/* Team Header */}
      <div className="team-header">
        <div className="team-title">
          <h1>{team.teamName}</h1>
          <span className="team-sport">{team.sportId?.name}</span>
        </div>
        
        <div className="team-meta">
          <div className="meta-grid">
            <div className="meta-item">
              <span className="meta-icon">🏆</span>
              <div>
                <label>Tournament</label>
                <p>{team.tournamentId?.eventName}</p>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">👑</span>
              <div>
                <label>Captain / Coach</label>
                <p>{team.captainId?.name}</p>
                {user && (user.role === "organizer" || user.role === "admin") && (
                  <div style={{ fontSize: "0.85rem", color: "var(--org-text-muted)", marginTop: "4px" }}>
                    <p>📧 {team.captainId?.email}</p>
                    <p>📱 {team.captainId?.phoneNumber || "N/A"}</p>
                    <p>📍 {team.captainId?.location || "N/A"} | Role: {team.captainId?.role || "Coach"}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">👥</span>
              <div>
                <label>Players</label>
                <p>{approvedCount}/{maxPlayers}</p>
              </div>
            </div>
            <div className="meta-item">
              <span className="meta-icon">💰</span>
              <div>
                <label>Player Joining Fee</label>
                {editingFee ? (
                  <div style={{ display: "flex", gap: "5px", alignItems: "center", marginTop: "4px" }}>
                    <input
                      type="number"
                      value={feeValue}
                      onChange={(e) => setFeeValue(e.target.value)}
                      min="0"
                      style={{ width: "80px", padding: "2px 5px", borderRadius: "4px", border: "1px solid #ccc", color: "#000" }}
                    />
                    <button 
                      onClick={handleUpdateFee}
                      disabled={actionLoading}
                      style={{ padding: "2px 8px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Save
                    </button>
                    <button 
                      onClick={() => setEditingFee(false)}
                      style={{ padding: "2px 8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <p style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    ₹{team.playerJoiningFee || 0}
                    {(isCaptain || user?.role === "admin") && (
                      <button
                        onClick={() => {
                          setEditingFee(true);
                          setFeeValue(team.playerJoiningFee || 0);
                        }}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0", fontSize: "14px" }}
                        title="Edit Fee"
                      >
                        ✏️
                      </button>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="team-progress">
          <div className="progress-label">Team Capacity</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="progress-percent">{Math.round(progressPercent)}%</div>
        </div>

        <div className="team-actions">
          {!isCaptain && !applied && user?.role === "player" && (
            <button onClick={handleApply} className="apply-btn" disabled={actionLoading}>
              {actionLoading ? "Sending..." : "🎯 Apply to Join Team"}
            </button>
          )}
          {!isCaptain && !applied && user?.role !== "player" && (
            <p className="player-notice">Only players can apply to join teams.</p>
          )}
          {!isCaptain && playerStatus === "pending" && (
            <div className="applied-badge">
              <span className="badge-pending">⏳ Application Pending</span>
              <p>Waiting for captain's approval</p>
            </div>
          )}
          {!isCaptain && playerStatus === "approved" && (
            <div className="applied-badge" style={{ backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}>
              <span className="badge-approved" style={{ color: '#16a34a', fontWeight: 'bold' }}>✅ You are a member of this team</span>
              <button 
                onClick={handleLeaveTeam} 
                className="leave-team-btn" 
                disabled={actionLoading} 
                style={{ display: 'block', marginTop: '10px', background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
                Leave Team
              </button>
            </div>
          )}
          {!isCaptain && playerStatus === "rejected" && (
            <div className="applied-badge" style={{ backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
              <span className="badge-rejected" style={{ color: '#dc2626', fontWeight: 'bold' }}>❌ Application Rejected</span>
            </div>
          )}
          {isCaptain && (
            <button onClick={generateInviteLink} className="invite-btn">
              {copied ? "✅ Copied!" : "📋 Copy Invite Link"}
            </button>
          )}
        </div>
      </div>

      {/* Players Section */}
      <div className="players-section">
        <h2>👥 Team Players</h2>
        
        {/* Pending Requests (Captain Only) */}
        {isCaptain && players.filter(p => p.status === "pending").length > 0 && (
          <div className="pending-requests">
            <h3>⏳ Pending Requests ({players.filter(p => p.status === "pending").length})</h3>
            <div className="players-grid">
              {players.filter(p => p.status === "pending").map(player => (
                <div key={player._id} className="player-card pending">
                  <div className="player-avatar">
                    {player.userId?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="player-info">
                    <p className="player-name"><strong>{player.userId?.name}</strong></p>
                    <p className="player-email">{player.userId?.email}</p>
                  </div>
                  <div className="player-actions">
                    <button 
                      className="approve-btn"
                      disabled={actionLoading === player.userId?._id}
                      onClick={() => handleUpdatePlayerStatus(player.userId?._id, "approved", player.userId?.name)}
                    >
                      ✓ Approve
                    </button>
                    <button 
                      className="reject-btn"
                      disabled={actionLoading === player.userId?._id}
                      onClick={() => handleUpdatePlayerStatus(player.userId?._id, "rejected", player.userId?.name)}
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Approved Players */}
        <h3>✅ Approved Players ({players.filter(p => p.status === "approved").length})</h3>
        <div className="players-grid">
          {players.filter(p => p.status === "approved").length > 0 ? (
            players.filter(p => p.status === "approved").map(player => (
              <div key={player._id} className="player-card approved">
                <div className="player-avatar">
                  {player.userId?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="player-info">
                  <p className="player-name"><strong>{player.userId?.name}</strong></p>
                  <p className="player-email">{player.userId?.email}</p>
                  {user && (user.role === "organizer" || user.role === "admin") && (
                    <div style={{ fontSize: "0.8rem", color: "#666", marginTop: "4px" }}>
                      <p>📱 {player.userId?.phoneNumber || "N/A"}</p>
                      <p>📍 {player.userId?.location || "N/A"} | Age: {player.userId?.age || "N/A"}</p>
                    </div>
                  )}
                </div>
                {player.userId?._id === team.captainId?._id && (
                  <span className="captain-badge">👑 Captain</span>
                )}
              </div>
            ))
          ) : (
            <div className="no-data">
              <div className="no-data-icon">👥</div>
              <p>No approved players yet</p>
              {isCaptain && <p className="no-data-hint">Share the invite link to get players!</p>}
            </div>
          )}
        </div>

        {/* Rejected Players (Captain Only) */}
        {isCaptain && players.filter(p => p.status === "rejected").length > 0 && (
          <div className="rejected-players">
            <h3>❌ Rejected Requests ({players.filter(p => p.status === "rejected").length})</h3>
            <div className="players-grid rejected-grid">
              {players.filter(p => p.status === "rejected").map(player => (
                <div key={player._id} className="player-card rejected">
                  <div className="player-avatar">
                    {player.userId?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="player-info">
                    <p className="player-name"><strong>{player.userId?.name}</strong></p>
                    <p className="player-email">{player.userId?.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}