import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript, initiateJoinPayment, verifyJoinPayment, getRazorpayKey } from "../services/paymentService";
import "../static/MyTeamDashboard.css";
import SkeletonDashboard from "../components/loading/SkeletonDashboard";
import SkeletonChart from "../components/loading/SkeletonChart";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "../components/TiltCard";
import socket from "../utils/socket";

export default function MyTeamDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myTeams, setMyTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [editingFee, setEditingFee] = useState(null);
  const [feeValue, setFeeValue] = useState("");

  // Dashboard Stats States
  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Coach Join Fee Config State
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [editFeeVal, setEditFeeVal] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyTeams();
    fetchDashboardData();
  }, [user]);

  // Real-Time and Polling Fallback Hook
  useEffect(() => {
    if (!user) return;

    // Join the analytics room
    socket.emit("register-analytics", { userId: user._id || user.id });

    // Handle real-time updates
    const handleUpdate = (data) => {
      console.log("⚡ Real-time dashboard update received:", data);
      fetchDashboardData();
      fetchMyTeams();
    };

    socket.on("dashboard_update", handleUpdate);
    socket.on("new_notification", handleUpdate);

    // Setup 10-second polling fallback if socket is disconnected
    const interval = setInterval(() => {
      if (!socket.connected) {
        console.log("🔌 Socket disconnected, falling back to 10-second polling...");
        fetchDashboardData();
        fetchMyTeams();
      }
    }, 10000);

    return () => {
      socket.off("dashboard_update", handleUpdate);
      socket.off("new_notification", handleUpdate);
      clearInterval(interval);
    };
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

  const fetchDashboardData = async () => {
    if (!user) return;
    try {
      setDashboardError(null);
      setDashboardLoading(true);
      const rolePath = user.role === "player" ? "player-dashboard" : "coach-dashboard";
      const res = await api.get(`/analytics/${rolePath}`);
      setDashboardData(res.data);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setDashboardError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleUpdateFee = async (teamId) => {
    try {
      setActionLoading(teamId);
      await api.put(`/teams/${teamId}`, { playerJoiningFee: Number(feeValue) || 0 });
      setSuccessMessage("✅ Player joining fee updated successfully!");
      setEditingFee(null);
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchMyTeams();
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to update joining fee:", err);
      setError(err.response?.data?.message || "Failed to update joining fee");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveDashboardFee = async () => {
    if (!selectedTeamId) return;
    try {
      setActionLoading(selectedTeamId);
      await api.put(`/teams/${selectedTeamId}`, { playerJoiningFee: Number(editFeeVal) || 0 });
      setSuccessMessage("✅ Player joining fee updated successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
      fetchMyTeams();
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update joining fee");
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading(null);
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
      fetchDashboardData();
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
      fetchDashboardData();
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
      fetchDashboardData();
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
                fetchDashboardData();
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
        fetchDashboardData();
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
  const teamsAsPlayer = myTeams;

  // Sync zero fee configuration selection
  useEffect(() => {
    if (activeTab === "dashboard" && user?.role === "coach" && teamsAsCaptain.length > 0) {
      if (!selectedTeamId) {
        const defaultTeam = teamsAsCaptain[0];
        setSelectedTeamId(defaultTeam._id);
        setEditFeeVal(defaultTeam.playerJoiningFee || 0);
      }
    }
  }, [activeTab, myTeams, user]);

  if (loading) {
    return <SkeletonDashboard />;
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

  const renderPlayerDashboard = () => {
    const stats = dashboardData.stats || {};
    const financials = dashboardData.financials || {};
    const prizeHistory = dashboardData.prizeHistory || [];
    const paymentHistory = dashboardData.paymentHistory || [];
    const matchHistory = dashboardData.matchHistory || [];
    const tournamentHistory = dashboardData.tournamentHistory || [];

    const formatCurrency = (val) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(val || 0);
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    return (
      <div className="player-dashboard-analytics">
        {/* Stats Grid */}
        <div className="db-section">
          <h2>📊 Personal Statistics</h2>
          <div className="db-grid">
            <div className="db-card">
              <div className="db-card-header">
                <span>Matches Played</span>
                <span className="db-card-icon">🏏</span>
              </div>
              <div className="db-card-value">{stats.totalMatchesPlayed || 0}</div>
              <div className="db-card-sub">
                Won: {stats.matchesWon || 0} | Lost: {stats.matchesLost || 0}
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Win Rate</span>
                <span className="db-card-icon">📈</span>
              </div>
              <div className="db-card-value">{stats.winRate || 0}%</div>
              <div className="db-card-sub">Completed matches ratio</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Tournaments</span>
                <span className="db-card-icon">🏆</span>
              </div>
              <div className="db-card-value">{stats.tournamentsParticipated || 0}</div>
              <div className="db-card-sub">
                Won: {stats.tournamentsWon || 0} | Runner-up: {stats.runnerUpFinishes || 0}
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Current Team</span>
                <span className="db-card-icon">👥</span>
              </div>
              <div className="db-card-value" style={{ fontSize: "1.3rem", paddingTop: "8px", paddingBottom: "8px" }}>
                {stats.currentTeam && stats.currentTeam !== "0" ? stats.currentTeam : "None"}
              </div>
              <div className="db-card-sub">Sport: {stats.currentSport && stats.currentSport !== "0" ? stats.currentSport : "N/A"}</div>
            </div>
          </div>
        </div>

        {/* Financial Section */}
        <div className="db-section">
          <h2>💰 Financial Summary</h2>
          <div className="db-grid">
            <div className="db-card">
              <div className="db-card-header">
                <span>Joining Fees Paid</span>
                <span className="db-card-icon">💸</span>
              </div>
              <div className="db-card-value">{formatCurrency(financials.totalJoiningFeesPaid)}</div>
              <div className="db-card-sub">Total expense on teams</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Prize Money Earned</span>
                <span className="db-card-icon">💵</span>
              </div>
              <div className="db-card-value" style={{ color: "#10b981" }}>{formatCurrency(financials.totalPrizeMoneyEarned)}</div>
              <div className="db-card-sub">Split shares from tournament completions</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Net Profit / Loss</span>
                <span className="db-card-icon">⚖️</span>
              </div>
              <div className="db-card-value" style={{ color: financials.netProfitLoss >= 0 ? "#10b981" : "#ef4444" }}>
                {financials.netProfitLoss >= 0 ? "+" : ""}{formatCurrency(financials.netProfitLoss)}
              </div>
              <div className="db-card-sub">Overall financial outcome</div>
            </div>
          </div>
        </div>

        {/* Tournament Rewards */}
        <div className="db-section">
          <h2>🏆 Tournament Rewards</h2>
          {dashboardData.tournamentRewards && dashboardData.tournamentRewards.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Distribution ID</th>
                    <th>Tournament</th>
                    <th>Team</th>
                    <th>Position</th>
                    <th>Title Sponsor</th>
                    <th>Winner Team Prize</th>
                    <th>Runner-up Team Prize</th>
                    <th>My Reward</th>
                    <th>Distribution Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.tournamentRewards.map((reward, idx) => (
                    <tr key={idx}>
                      <td style={{ fontFamily: "monospace", fontWeight: "600" }}>{reward.distributionId}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{reward.tournamentName}</span>
                          <span className="sponsored-badge" style={{ background: "rgba(109, 40, 217, 0.1)", color: "#a78bfa", fontSize: "10px", padding: "2px 6px", borderRadius: "999px", fontWeight: "700" }}>SPONSORED</span>
                        </div>
                      </td>
                      <td>{reward.teamName}</td>
                      <td>
                        <span className={reward.position === "Winner" ? "badge-winner" : "badge-runner"}>
                          {reward.position}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {reward.brandLogo && (
                            <img src={reward.brandLogo} alt={reward.brandName} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                          )}
                          <span>{reward.brandName}</span>
                        </div>
                      </td>
                      <td>{formatCurrency(reward.winnerPrizeTotal)}</td>
                      <td>{formatCurrency(reward.runnerUpPrizeTotal)}</td>
                      <td style={{ color: "#10b981", fontWeight: "700" }}>{formatCurrency(reward.individualPrize)}</td>
                      <td>{formatDate(reward.distributedAt)}</td>
                      <td>
                        <span className="badge-winner" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>Completed</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state" style={{ padding: "30px", textAlign: "center", color: "var(--text-secondary)" }}>
              No prize money was available because this tournament had no active Title Sponsor.
            </div>
          )}
        </div>

        {/* Payment History */}
        <div className="db-section">
          <h2>💳 Joining Fee Payments</h2>
          {paymentHistory.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Date Paid</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.teamName && item.teamName !== "0" ? item.teamName : "N/A"}</td>
                      <td>{formatDate(item.date)}</td>
                      <td style={{ fontWeight: "600" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state">No Payments Recorded</div>
          )}
        </div>

        {/* Tournament History */}
        <div className="db-section">
          <h2>🏆 Tournament History</h2>
          {tournamentHistory.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Status</th>
                    <th>Result</th>
                    <th>Dates</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.tournamentName}</td>
                      <td style={{ textTransform: "capitalize" }}>{item.status}</td>
                      <td>
                        <span className={item.result === "Winner" ? "badge-winner" : item.result === "Runner-up" ? "badge-runner" : "badge-participant"}>
                          {item.result}
                        </span>
                      </td>
                      <td>{formatDate(item.startDate)} - {formatDate(item.endDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state">No Tournament History Available</div>
          )}
        </div>

        {/* Match History */}
        <div className="db-section">
          <h2>⚔️ Match Results History</h2>
          {matchHistory.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Opponent Team</th>
                    <th>Tournament</th>
                    <th>Match Date</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {matchHistory.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.opponent && item.opponent !== "0" ? item.opponent : "Draw/TBD"}</td>
                      <td>{item.tournamentName && item.tournamentName !== "0" ? item.tournamentName : "N/A"}</td>
                      <td>{formatDate(item.matchDate)}</td>
                      <td className={item.result === "Win" ? "win" : item.result === "Loss" ? "loss" : ""}>
                        {item.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state">No Matches Played Yet</div>
          )}
        </div>
      </div>
    );
  };

  const renderCoachDashboard = () => {
    const stats = dashboardData.stats || {};
    const financials = dashboardData.financials || {};
    const activity = dashboardData.activity || {};
    const recentPayments = activity.recentPlayerPayments || [];
    const recentRegistrations = activity.recentRegistrations || [];
    const recentMatches = activity.recentMatches || [];

    const formatCurrency = (val) => {
      const num = Number(val) || 0;
      return `₹${num.toLocaleString("en-IN")}`;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    return (
      <div className="coach-dashboard-analytics">
        {/* Stats Grid */}
        <div className="db-section">
          <h2>📊 Coach Statistics</h2>
          <div className="db-grid">
            <div className="db-card">
              <div className="db-card-header">
                <span>Teams Created</span>
                <span className="db-card-icon">🛡️</span>
              </div>
              <div className="db-card-value">{stats.teamsCreated || 0}</div>
              <div className="db-card-sub">Active rosters under management</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Active Players</span>
                <span className="db-card-icon">👥</span>
              </div>
              <div className="db-card-value">{stats.activePlayers || 0}</div>
              <div className="db-card-sub">
                Approved: {stats.approvedPlayers || 0} | Pending: {stats.pendingPlayers || 0}
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Matches Played</span>
                <span className="db-card-icon">⚔️</span>
              </div>
              <div className="db-card-value">{stats.matchesPlayed || 0}</div>
              <div className="db-card-sub">
                Won: {stats.wins || 0} | Lost: {stats.losses || 0}
              </div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Win Rate</span>
                <span className="db-card-icon">📈</span>
              </div>
              <div className="db-card-value">{stats.winRate || 0}%</div>
              <div className="db-card-sub">Coach success ratio</div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="db-section">
          <h2>💰 Financial Performance</h2>
          <div className="db-grid">
            <div className="db-card">
              <div className="db-card-header">
                <span>Fees Collected</span>
                <span className="db-card-icon">📥</span>
              </div>
              <div className="db-card-value" style={{ color: "#10b981" }}>{formatCurrency(financials.playerJoiningFeesCollected)}</div>
              <div className="db-card-sub">Player joining fees collected</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Prize Money Won</span>
                <span className="db-card-icon">🏆</span>
              </div>
              <div className="db-card-value" style={{ color: "#10b981" }}>{formatCurrency(financials.prizeMoneyWon)}</div>
              <div className="db-card-sub">Total team prizes received</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Registration Fees Paid</span>
                <span className="db-card-icon">📤</span>
              </div>
              <div className="db-card-value" style={{ color: "#ef4444" }}>{formatCurrency(financials.registrationFeesPaid)}</div>
              <div className="db-card-sub">Tournament entry expenses</div>
            </div>
            <div className="db-card">
              <div className="db-card-header">
                <span>Net Profit / Loss</span>
                <span className="db-card-icon">⚖️</span>
              </div>
              <div className="db-card-value" style={{ color: financials.netProfit >= 0 ? "#10b981" : "#ef4444" }}>
                {financials.netProfit >= 0 ? "+" : ""}{formatCurrency(financials.netProfit)}
              </div>
              <div className="db-card-sub">Overall team profits</div>
            </div>
          </div>
        </div>

        {/* Joining Fee Configuration form */}
        <div className="db-section">
          <h2>⚙️ Configure Player Joining Fee</h2>
          <p className="db-card-sub" style={{ marginBottom: "12px" }}>Set the entry fee for players joining your captained teams.</p>
          <div className="fee-config-form">
            <select 
              value={selectedTeamId} 
              onChange={(e) => {
                const teamId = e.target.value;
                setSelectedTeamId(teamId);
                const team = teamsAsCaptain.find(t => t._id === teamId);
                setEditFeeVal(team ? team.playerJoiningFee || 0 : "");
              }}
            >
              <option value="">Select Team</option>
              {teamsAsCaptain.map(team => (
                <option key={team._id} value={team._id}>
                  {team.teamName} ({team.tournamentId?.eventName})
                </option>
              ))}
            </select>
            <input 
              type="number" 
              value={editFeeVal} 
              onChange={(e) => setEditFeeVal(e.target.value)} 
              placeholder="Joining Fee (₹)"
              min="0"
            />
            <button 
              onClick={handleSaveDashboardFee}
              disabled={actionLoading === selectedTeamId || !selectedTeamId}
            >
              {actionLoading === selectedTeamId ? "Saving..." : "Save Config"}
            </button>
          </div>
        </div>

        {/* Recent Player Payments */}
        <div className="db-section">
          <h2>💸 Recent Player Payments</h2>
          {recentPayments.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Team</th>
                    <th>Date Paid</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPayments.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.userId?.name || "N/A"}</td>
                      <td>{item.teamId?.teamName || "N/A"}</td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td style={{ color: "#10b981", fontWeight: "600" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state">No Player Payments Recorded</div>
          )}
        </div>

        {/* Recent Registrations */}
        <div className="db-section">
          <h2>📋 Team Registrations Status</h2>
          {recentRegistrations.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Tournament</th>
                    <th>Date</th>
                    <th>Approval Status</th>
                    <th>Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.teamId?.teamName || "N/A"}</td>
                      <td>{item.tournamentId?.eventName || "N/A"}</td>
                      <td>{formatDate(item.registrationDate)}</td>
                      <td style={{ textTransform: "capitalize", fontWeight: "600" }}>
                        {item.approvalStatus === "approved" ? (
                          <span style={{ color: "#10b981" }}>Approved</span>
                        ) : item.approvalStatus === "rejected" ? (
                          <span style={{ color: "#ef4444" }}>Rejected</span>
                        ) : (
                          <span style={{ color: "#f59e0b" }}>{item.approvalStatus}</span>
                        )}
                      </td>
                      <td style={{ textTransform: "capitalize", fontWeight: "600" }}>
                        {item.paymentStatus === "Paid" || item.paymentStatus === "paid" ? (
                          <span style={{ color: "#10b981" }}>Paid</span>
                        ) : (
                          <span style={{ color: "#ef4444" }}>{item.paymentStatus || "Unpaid"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state">No Team Registrations Found</div>
          )}
        </div>

        {/* Recent Matches */}
        <div className="db-section">
          <h2>⚔️ Recent Match History</h2>
          {recentMatches.length > 0 ? (
            <div className="db-table-wrapper">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Opponent Team</th>
                    <th>Tournament</th>
                    <th>Match Date</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {recentMatches.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.opponent && item.opponent !== "0" ? item.opponent : "Draw/TBD"}</td>
                      <td>{item.tournamentName && item.tournamentName !== "0" ? item.tournamentName : "N/A"}</td>
                      <td>{formatDate(item.matchDate)}</td>
                      <td className={item.result === "Win" ? "win" : item.result === "Loss" ? "loss" : ""}>
                        {item.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="db-empty-state">No Matches Played Yet</div>
          )}
        </div>
      </div>
    );
  };

  const renderDashboardAnalytics = () => {
    if (dashboardLoading) {
      return <SkeletonChart type="bar" height="350px" style={{ marginTop: "20px" }} />;
    }

    if (dashboardError) {
      return (
        <div className="error-message">
          ❌ {dashboardError}
        </div>
      );
    }

    if (!dashboardData) {
      return (
        <div className="db-empty-state">
          No analytics data available.
        </div>
      );
    }

    if (user?.role === "player") {
      return renderPlayerDashboard();
    } else if (user?.role === "coach") {
      return renderCoachDashboard();
    }

    return null;
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
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard Analytics
        </button>
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
        {activeTab === "dashboard" ? (
          <motion.div
            key="dashboard-view"
            className="dashboard-view"
            variants={listReveal}
            initial="hidden"
            animate="show"
          >
            {renderDashboardAnalytics()}
          </motion.div>
        ) : activeTab === "captain" ? (
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
                         <div className="stat-item" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span className="stat-label">💰 Player Joining Fee:</span>
                          {editingFee === team._id ? (
                            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                              <input
                                type="number"
                                value={feeValue}
                                onChange={(e) => setFeeValue(e.target.value)}
                                min="0"
                                style={{ width: "80px", padding: "2px 5px", borderRadius: "4px", border: "1px solid #ccc", color: "#000" }}
                              />
                              <button 
                                onClick={() => handleUpdateFee(team._id)}
                                style={{ padding: "2px 8px", backgroundColor: "#10b981", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                Save
                              </button>
                              <button 
                                onClick={() => setEditingFee(null)}
                                style={{ padding: "2px 8px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="stat-value" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              ₹{team.playerJoiningFee || 0}
                              {(team.captainId?._id === currentUserId || user?.role === "admin") && (
                                <button
                                  onClick={() => {
                                    setEditingFee(team._id);
                                    setFeeValue(team.playerJoiningFee || 0);
                                  }}
                                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0", fontSize: "14px" }}
                                  title="Edit Fee"
                                >
                                  ✏️
                                </button>
                              )}
                            </span>
                          )}
                        </div>
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
                
                const player = playerData || {};
                console.log("Player Status:", player.status);
                console.log("Payment Status:", player.paymentStatus);
                console.log("Joining Fee:", team.playerJoiningFee);
                
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

                       {playerStatus === "approved_pending_payment" && player.paymentStatus === "unpaid" && (
                        <div className="pending-payment-warning" style={{ border: "1px dashed #ef4444", padding: "12px", borderRadius: "6px", marginBottom: "10px", backgroundColor: "#fff5f5" }}>
                          <div style={{ color: "#333", fontSize: "14px", marginBottom: "6px" }}>
                            <strong>Joining Fee:</strong> ₹{team.playerJoiningFee}
                          </div>
                          <div style={{ color: "#ef4444", fontSize: "14px", fontWeight: "bold" }}>
                            <strong>Status:</strong> Approved (Pending Payment)
                          </div>
                        </div>
                      )}

                      {playerStatus === "approved" && (
                        <div className="approved-warning">
                          ✅ Membership Activated
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
                        {playerStatus === "approved_pending_payment" && player.paymentStatus === "unpaid" && (
                          <button
                            onClick={() => handlePayJoiningFee(team)}
                            disabled={actionLoading === team._id}
                            className="pay-btn light-sweep-wrapper"
                            style={{ backgroundColor: "#10B981", color: "white", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                          >
                            {actionLoading === team._id ? "..." : "💳 Complete Payment"}
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