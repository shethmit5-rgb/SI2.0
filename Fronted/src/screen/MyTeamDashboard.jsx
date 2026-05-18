import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/MyTeamDashboard.css";

export default function MyTeamDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("captain");
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyTeams();
  }, [user]);

  const fetchMyTeams = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await api.get("/teams/my-teams");
      setMyTeams(res.data || []);
    } catch (err) {
      console.error("Failed to fetch teams", err);
      setError(err.response?.data?.message || "Failed to load your teams");
    } finally {
      setLoading(false);
    }
  };

  // Approve / Reject Player
  const handleAction = async (teamId, userId, action, playerName) => {
    try {
      setActionLoading(userId);

      await api.put(`/teams/${teamId}/approve`, {
        userId,
        action,
      });

      setSuccessMessage(`✅ ${playerName} has been ${action === "approved" ? "approved" : "rejected"}!`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      fetchMyTeams();
    } catch (err) {
      console.error("Action failed:", err);
      setError(err.response?.data?.message || "Action failed. Please try again.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  // Delete Team (Captain only)
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`⚠️ Are you sure you want to delete "${teamName}"?\n\nThis action cannot be undone!`)) return;
    
    try {
      await api.delete(`/teams/${teamId}/delete`);
      setSuccessMessage(`✅ Team "${teamName}" has been deleted`);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchMyTeams();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete team");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Leave Team (for players)
  const handleLeaveTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you sure you want to leave "${teamName}"?`)) return;
    
    try {
      await api.delete(`/teams/${teamId}/leave`);
      setSuccessMessage(`✅ You have left "${teamName}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchMyTeams();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to leave team");
      setTimeout(() => setError(null), 3000);
    }
  };

  const currentUserId = user?._id || user?.id;
  const teamsAsCaptain = myTeams.filter((t) => t.captainId?._id === currentUserId);
  const teamsAsPlayer = myTeams; // Include all teams in "Teams I'm In" since captain is also a player

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="my-team-dashboard">
      <h1>🏆 My Teams Dashboard</h1>
      <p className="dashboard-subtitle">Manage your teams and player requests</p>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          ❌ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === "captain" ? "active" : ""}`}
          onClick={() => setActiveTab("captain")}
        >
          👑 Teams I Captain ({teamsAsCaptain.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "player" ? "active" : ""}`}
          onClick={() => setActiveTab("player")}
        >
          🎮 Teams I'm In ({teamsAsPlayer.length})
        </button>
      </div>

      {/* Captain View */}
      {activeTab === "captain" && (
        <div className="captain-view">
          {teamsAsCaptain.length > 0 ? (
            teamsAsCaptain.map((team) => {
              const pendingPlayers = team.players?.filter((p) => p.status === "pending");
              const approvedPlayers = team.players?.filter((p) => p.status === "approved");
              const rejectedPlayers = team.players?.filter((p) => p.status === "rejected");
              const maxPlayers = team.sportId?.playersPerTeam || 11;
              const totalCurrentPlayers = approvedPlayers?.length || 0;
              const progressPercent = (totalCurrentPlayers / maxPlayers) * 100;

              return (
                <div key={team._id} className="team-card captain-card">
                  <div className="team-header">
                    <div>
                      <h3>{team.teamName}</h3>
                      <span className="team-tournament-name">{team.tournamentId?.eventName}</span>
                    </div>
                    <span className="team-status-badge">
                      {totalCurrentPlayers}/{maxPlayers} Players
                    </span>
                  </div>

                  {/* Pending Approvals Section */}
                  {pendingPlayers?.length > 0 && (
                    <div className="pending-section">
                      <h4>⏳ Pending Approvals ({pendingPlayers.length})</h4>
                      <div className="pending-list">
                        {pendingPlayers.map((player) => (
                          <div key={player._id} className="pending-item">
                            <div className="player-info">
                              <strong>{player.userId?.name}</strong>
                              <span className="player-email">{player.userId?.email}</span>
                            </div>
                            <div className="pending-actions">
                              <button
                                className="approve-btn"
                                disabled={actionLoading === player.userId?._id}
                                onClick={() => handleAction(team._id, player.userId._id, "approved", player.userId?.name)}
                              >
                                {actionLoading === player.userId?._id ? "..." : "✓ Approve"}
                              </button>
                              <button
                                className="reject-btn"
                                disabled={actionLoading === player.userId?._id}
                                onClick={() => handleAction(team._id, player.userId._id, "rejected", player.userId?.name)}
                              >
                                {actionLoading === player.userId?._id ? "..." : "✗ Reject"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Team Stats */}
                  <div className="team-stats">
                    <div className="stat-item">
                      <span className="stat-label">👥 Approved Players:</span>
                      <span className="stat-value">{approvedPlayers?.length || 0}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">⏳ Pending Requests:</span>
                      <span className="stat-value pending-count">{pendingPlayers?.length || 0}</span>
                    </div>
                    {rejectedPlayers?.length > 0 && (
                      <div className="stat-item">
                        <span className="stat-label">❌ Rejected:</span>
                        <span className="stat-value rejected-count">{rejectedPlayers.length}</span>
                      </div>
                    )}
                    <div className="stat-item">
                      <span className="stat-label">🏅 Sport:</span>
                      <span className="stat-value">{team.sportId?.name || "N/A"}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-section">
                    <div className="progress-label">Team Capacity</div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="progress-percent">{Math.round(progressPercent)}%</div>
                  </div>

                  <div className="team-actions">
                    <Link to={`/team/${team._id}`} className="manage-btn">
                      Manage Team →
                    </Link>
                    <Link to={`/teams/edit/${team._id}`} className="edit-team-btn">
                      ✏️ Edit Team
                    </Link>
                    <button 
                      onClick={() => handleDeleteTeam(team._id, team.teamName)}
                      className="delete-team-btn"
                    >
                      🗑️ Delete Team
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🏏</div>
              <p>You haven't created any teams yet</p>
              <Link to="/teams/create" className="create-btn">
                + Create a Team
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Player View */}
      {activeTab === "player" && (
        <div className="player-view">
          {teamsAsPlayer.length > 0 ? (
            teamsAsPlayer.map((team) => {
              const isCaptain = team.captainId?._id === currentUserId;
              const playerData = team.players?.find((p) => p.userId?._id === currentUserId);
              const playerStatus = isCaptain ? "captain" : playerData?.status;
              
              const getStatusInfo = () => {
                switch(playerStatus) {
                  case "captain":
                    return { icon: "👑", text: "Captain", color: "#4f46e5", bg: "#e0e7ff" };
                  case "approved": 
                    return { icon: "✅", text: "Approved", color: "#10b981", bg: "#dcfce7" };
                  case "pending": 
                    return { icon: "⏳", text: "Pending Approval", color: "#f59e0b", bg: "#fef3c7" };
                  case "rejected": 
                    return { icon: "❌", text: "Rejected", color: "#ef4444", bg: "#fee2e2" };
                  default: 
                    return { icon: "❓", text: "Unknown", color: "#6b7280", bg: "#f3f4f6" };
                }
              };
              const statusInfo = getStatusInfo();
              const approvedCount = team.players?.filter(p => p.status === "approved").length || 0;

              return (
                <div key={team._id} className="team-card player-card">
                  <div className="team-header">
                    <h3>{team.teamName}</h3>
                    <span className="player-status-badge" style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}>
                      {statusInfo.icon} {statusInfo.text}
                    </span>
                  </div>

                  <div className="team-details">
                    <p className="team-captain">
                      👑 Captain: <strong>{team.captainId?.name}</strong>
                    </p>
                    <p className="team-tournament">
                      🏆 Tournament: <strong>{team.tournamentId?.eventName}</strong>
                    </p>
                    <p className="team-players-count">
                      👥 Team Size: <strong>{approvedCount} players</strong>
                    </p>
                  </div>

                  {playerStatus === "captain" && (
                    <div className="approved-warning" style={{ backgroundColor: "#e0e7ff", color: "#4f46e5", border: "1px solid #c7d2fe" }}>
                      👑 You are the captain of this team!
                    </div>
                  )}

                  {playerStatus === "pending" && (
                    <div className="pending-warning">
                      ⏳ Your request is pending approval from the team captain
                    </div>
                  )}

                  {playerStatus === "approved" && (
                    <div className="approved-warning">
                      ✅ You are an approved member of this team!
                    </div>
                  )}

                  {playerStatus === "rejected" && (
                    <div className="rejected-warning">
                      ❌ Your request was rejected. You can apply to other teams.
                    </div>
                  )}

                  <div className="team-actions">
                    <Link to={`/team/${team._id}`} className="view-btn">
                      View Team Details →
                    </Link>
                    {playerStatus === "captain" && (
                      <Link to={`/team/${team._id}`} className="leave-btn" style={{ backgroundColor: "#4f46e5", color: "white", textDecoration: "none", textAlign: "center" }}>
                        Manage Team
                      </Link>
                    )}
                    {playerStatus === "pending" && (
                      <button 
                        onClick={() => handleLeaveTeam(team._id, team.teamName)}
                        className="leave-btn"
                      >
                        Cancel Request
                      </button>
                    )}
                    {playerStatus === "approved" && (
                      <button 
                        onClick={() => handleLeaveTeam(team._id, team.teamName)}
                        className="leave-btn"
                      >
                        Leave Team
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-icon">🎮</div>
              <p>You haven't joined any teams yet</p>
              <div className="empty-actions">
                <Link to="/teams" className="browse-btn">
                  Browse Teams
                </Link>
                <Link to="/teams/create" className="create-btn">
                  Create Your Own Team
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}