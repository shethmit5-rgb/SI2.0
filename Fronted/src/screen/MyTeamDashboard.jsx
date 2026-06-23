import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript, initiateJoinPayment, verifyJoinPayment, getRazorpayKey } from "../services/paymentService";
import "../static/MyTeamDashboard.css";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "../components/TiltCard";

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

  const handlePayJoiningFee = async (team) => {
    try {
      setActionLoading(team._id);
      const payRes = await initiateJoinPayment(team._id);

      if (payRes && payRes.requiresPayment) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          alert("Razorpay SDK failed to load. Are you online?");
          setActionLoading(null);
          return;
        }

        const keyRes = await getRazorpayKey();
        const options = {
          key: keyRes.key,
          amount: payRes.order.amount,
          currency: payRes.order.currency || "INR",
          name: "Player Joining Fee",
          description: `Joining fee for ${team.teamName}`,
          order_id: payRes.order.id,
          handler: async (paymentRes) => {
            setActionLoading(team._id);
            try {
              const verifyRes = await verifyJoinPayment({
                razorpay_order_id: paymentRes.razorpay_order_id,
                razorpay_payment_id: paymentRes.razorpay_payment_id,
                razorpay_signature: paymentRes.razorpay_signature,
                transactionId: payRes.transactionId,
              });
              if (verifyRes.success) {
                alert("✅ Payment verified! You are now a fully approved member of the team.");
                fetchMyTeams();
              } else {
                alert("❌ Payment verification failed.");
              }
            } catch (err) {
              console.error(err);
              alert(err.response?.data?.message || "Payment verification failed");
            } finally {
              setActionLoading(null);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: {
            color: "#6366f1",
          },
          modal: {
            ondismiss: () => {
              alert("Payment cancelled.");
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        alert("✅ Membership activated successfully!");
        fetchMyTeams();
      }
    } catch (err) {
      console.error("Pay joining fee error:", err);
      alert(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setActionLoading(null);
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

  // Motion variants
  const listReveal = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardReveal = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 14 }
    }
  };

  return (
    <div className="my-team-dashboard perspective-viewport">
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

      {/* View Switch with Stagger Entrance */}
      <AnimatePresence mode="wait">
        {activeTab === "captain" ? (
          <motion.div 
            key="captain-view"
            className="captain-view"
            variants={listReveal}
            initial="hidden"
            animate="show"
          >
            {teamsAsCaptain.length > 0 ? (
              teamsAsCaptain.map((team) => {
                const pendingPlayers = team.players?.filter((p) => p.status === "pending");
                const approvedPendingPaymentPlayers = team.players?.filter((p) => p.status === "approved_pending_payment");
                const approvedPlayers = team.players?.filter((p) => p.status === "approved");
                const rejectedPlayers = team.players?.filter((p) => p.status === "rejected");
                const maxPlayers = team.sportId?.playersPerTeam || 11;
                const totalCurrentPlayers = approvedPlayers?.length || 0;
                const progressPercent = (totalCurrentPlayers / maxPlayers) * 100;

                return (
                  <motion.div key={team._id} variants={cardReveal}>
                    <TiltCard className="team-card captain-card" style={{ height: "100%" }}>
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

                      {/* Approved (Pending Payment) Section */}
                      {approvedPendingPaymentPlayers?.length > 0 && (
                        <div className="pending-section" style={{ marginTop: "15px", borderTop: "1px solid #E2E8F0", paddingTop: "15px" }}>
                          <h4>💳 Approved (Pending Payment) ({approvedPendingPaymentPlayers.length})</h4>
                          <div className="pending-list">
                            {approvedPendingPaymentPlayers.map((player) => (
                              <div key={player._id} className="pending-item">
                                <div className="player-info">
                                  <strong>{player.userId?.name}</strong>
                                  <span className="player-email">{player.userId?.email}</span>
                                </div>
                                <span className="player-status-badge" style={{ backgroundColor: "#fee2e2", color: "#ef4444", fontSize: "12px", padding: "4px 8px", borderRadius: "4px", fontWeight: "bold" }}>
                                  Pending Payment
                                </span>
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
                        {approvedPendingPaymentPlayers?.length > 0 && (
                          <div className="stat-item">
                            <span className="stat-label">💳 Pending Payment:</span>
                            <span className="stat-value" style={{ color: "#ef4444", fontWeight: "bold" }}>{approvedPendingPaymentPlayers.length}</span>
                          </div>
                        )}
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
                        <Link to={`/team/${team._id}`} className="manage-btn light-sweep-wrapper">
                          Manage Team →
                        </Link>
                        <Link to={`/teams/edit/${team._id}`} className="edit-team-btn light-sweep-wrapper">
                          ✏️ Edit Team
                        </Link>
                        <button 
                          onClick={() => handleDeleteTeam(team._id, team.teamName)}
                          className="delete-team-btn light-sweep-wrapper"
                        >
                          🗑️ Delete Team
                        </button>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🏏</div>
                <p>You haven't created any teams yet</p>
                <Link to="/teams/create" className="create-btn light-sweep-wrapper">
                  + Create a Team
                </Link>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="player-view"
            className="player-view"
            variants={listReveal}
            initial="hidden"
            animate="show"
          >
            {teamsAsPlayer.length > 0 ? (
              teamsAsPlayer.map((team) => {
                const isCaptain = team.captainId?._id === currentUserId;
                const playerData = team.players?.find((p) => p.userId?._id === currentUserId);
                const playerStatus = isCaptain ? "captain" : playerData?.status;
                
                const getStatusInfo = () => {
                  switch(playerStatus) {
                    case "captain":
                      return { icon: "👑", text: "Captain", color: "#2563EB", bg: "#EFF6FF" };
                    case "approved_pending_payment":
                      return { icon: "💳", text: "Approved (Pending Payment)", color: "#ef4444", bg: "#fee2e2" };
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
                  <motion.div key={team._id} variants={cardReveal}>
                    <TiltCard className="team-card player-card" style={{ height: "100%" }}>
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
                        <div className="approved-warning" style={{ backgroundColor: "#EFF6FF", color: "#2563EB", border: "1px solid #E2E8F0" }}>
                          👑 You are the captain of this team!
                        </div>
                      )}

                      {playerStatus === "pending" && (
                        <div className="pending-warning">
                          ⏳ Your request is pending approval from the team captain
                        </div>
                      )}

                       {playerStatus === "approved_pending_payment" && (
                        <div className="pending-payment-warning" style={{ backgroundColor: "#fee2e2", color: "#ef4444", padding: "10px", borderRadius: "6px", marginBottom: "10px", fontSize: "14px", fontWeight: "500", border: "1px solid #fee2e2" }}>
                          💳 Approved! Please pay the joining fee of ₹{team.playerJoiningFee} to active your membership.
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
                        <Link to={`/team/${team._id}`} className="view-btn light-sweep-wrapper">
                          View Team Details →
                        </Link>
                        {playerStatus === "captain" && (
                          <Link to={`/team/${team._id}`} className="leave-btn light-sweep-wrapper" style={{ backgroundColor: "#2563EB", color: "white", textDecoration: "none", textAlign: "center" }}>
                            Manage Team
                          </Link>
                        )}
                        {playerStatus === "approved_pending_payment" && (
                          <button
                            onClick={() => handlePayJoiningFee(team)}
                            disabled={actionLoading === team._id}
                            className="pay-btn light-sweep-wrapper"
                            style={{ backgroundColor: "#10B981", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                          >
                            {actionLoading === team._id ? "..." : "💳 Pay Joining Fee"}
                          </button>
                        )}
                        {playerStatus === "pending" && (
                          <button 
                            onClick={() => handleLeaveTeam(team._id, team.teamName)}
                            className="leave-btn light-sweep-wrapper"
                          >
                            Cancel Request
                          </button>
                        )}
                        {(playerStatus === "approved" || playerStatus === "approved_pending_payment") && (
                          <button 
                            onClick={() => handleLeaveTeam(team._id, team.teamName)}
                            className="leave-btn light-sweep-wrapper"
                          >
                            Leave Team
                          </button>
                        )}
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🎮</div>
                <p>You haven't joined any teams yet</p>
                <div className="empty-actions">
                  <Link to="/teams" className="browse-btn light-sweep-wrapper">
                    Browse Teams
                  </Link>
                  <Link to="/teams/create" className="create-btn light-sweep-wrapper">
                    Create Your Own Team
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}