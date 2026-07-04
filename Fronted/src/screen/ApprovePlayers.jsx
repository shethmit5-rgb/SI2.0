import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function ApprovePlayers() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // ================= FETCH TEAMS =================
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchTeams();
  }, [user]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await api.get("/teams/captain-teams");

      if (!res.data || res.data.length === 0) {
        setTeams([]);
        return;
      }

      setTeams(res.data);
    } catch (err) {
      console.error("Fetch teams error:", err);
      setError(err.response?.data?.message || "Failed to load your teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  // ================= APPROVE / REJECT =================
  const handleAction = async (teamId, userId, action, playerName) => {
    setActionLoading(`${teamId}-${userId}`);
    try {
      await api.put(`/teams/${teamId}/approve`, {
        userId,
        action,
      });

      const actionText = action === "approved" ? "approved" : "rejected";
      alert(`✅ ${playerName} has been ${actionText}!`);
      
      fetchTeams(); // Refresh the list
    } catch (err) {
      console.error("Action failed:", err);

      if (err.response?.status === 403) {
        alert("❌ Only captain can approve players");
      } else {
        alert(err.response?.data?.message || "Something went wrong");
      }
    } finally {
      setActionLoading(null);
    }
  };

  // ================= LOADING STATE =================
  if (loading) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <SkeletonTable rows={8} cols={5} />
      </div>
    );
  }

  // ================= ERROR STATE =================
  if (error) {
    return (
      <div style={styles.center}>
        <h2>❌ Error</h2>
        <p>{error}</p>
        <button onClick={fetchTeams} style={styles.retryBtn}>
          Try Again
        </button>
      </div>
    );
  }

  // ================= NO TEAMS (NOT A CAPTAIN) =================
  if (teams.length === 0) {
    return (
      <div style={styles.center}>
        <h2>🚫 Access Denied</h2>
        <p>You are not a team captain.</p>
        <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
          Only team captains can approve or reject player requests.
        </p>
        <button 
          onClick={() => navigate("/teams/create")} 
          style={styles.createBtn}
        >
          + Create a Team
        </button>
      </div>
    );
  }

  // ================= MAIN RENDER =================
  const totalPending = teams.reduce((total, team) => {
    return total + (team.players?.filter(p => p.status === "pending").length || 0);
  }, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>👑 Player Requests</h2>
        {totalPending > 0 && (
          <span style={styles.pendingBadge}>{totalPending} Pending</span>
        )}
      </div>
      <p style={styles.subtitle}>Approve or reject players who want to join your teams</p>

      {teams.map((team) => {
        const pendingPlayers = team.players?.filter(
          (p) => p.status === "pending"
        );
        const approvedCount = team.players?.filter(p => p.status === "approved").length || 0;
        const maxPlayers = team.sportId?.playersPerTeam || 11;

        return (
          <div key={team._id} style={styles.teamCard}>
            <div style={styles.teamHeader}>
              <h3 style={styles.teamName}>{team.teamName}</h3>
              <span style={styles.teamStats}>
                {approvedCount}/{maxPlayers} Players
              </span>
            </div>
            
            <p style={styles.tournamentName}>
              🏆 {team.tournamentId?.eventName || "Tournament"}
            </p>

            {pendingPlayers && pendingPlayers.length > 0 ? (
              <div>
                <p style={styles.sectionTitle}>
                  ⏳ Pending Requests ({pendingPlayers.length})
                </p>
                {pendingPlayers.map((p) => (
                  <div key={p._id} style={styles.playerRow}>
                    <div style={styles.playerInfo}>
                      <span style={styles.playerName}>
                        {p.userId?.name || "Unknown"}
                      </span>
                      <span style={styles.playerEmail}>
                        {p.userId?.email || ""}
                      </span>
                    </div>

                    <div style={styles.buttonGroup}>
                      <button
                        style={styles.approveBtn}
                        disabled={actionLoading === `${team._id}-${p.userId?._id}`}
                        onClick={() =>
                          handleAction(team._id, p.userId?._id, "approved", p.userId?.name)
                        }
                      >
                        {actionLoading === `${team._id}-${p.userId?._id}` ? "..." : "✅ Approve"}
                      </button>

                      <button
                        style={styles.rejectBtn}
                        disabled={actionLoading === `${team._id}-${p.userId?._id}`}
                        onClick={() =>
                          handleAction(team._id, p.userId?._id, "rejected", p.userId?.name)
                        }
                      >
                        {actionLoading === `${team._id}-${p.userId?._id}` ? "..." : "❌ Reject"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noDataContainer}>
                <p style={styles.noData}>✨ No pending requests</p>
                <p style={styles.noDataSub}>All player requests have been processed</p>
              </div>
            )}

            {/* Progress Bar */}
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div 
                  style={{
                    ...styles.progressFill,
                    width: `${(approvedCount / maxPlayers) * 100}%`
                  }}
                ></div>
              </div>
              <p style={styles.progressText}>
                Team capacity: {approvedCount}/{maxPlayers} players
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    padding: "40px",
    maxWidth: "1000px",
    margin: "0 auto",
    minHeight: "100vh",
    backgroundColor: "transparent",
  },
  center: {
    textAlign: "center",
    padding: "80px 20px",
    background: "var(--glass-bg, rgba(255, 255, 255, 0.18))",
    backdropFilter: "Glass(14px) blur(14px)",
    WebkitBackdropFilter: "Glass(14px) blur(14px)",
    border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.25))",
    borderRadius: "24px",
    margin: "40px auto",
    maxWidth: "500px",
    boxShadow: "var(--glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.08))",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  title: {
    margin: "0",
    color: "inherit",
    fontSize: "28px",
  },
  subtitle: {
    color: "inherit",
    opacity: 0.8,
    marginBottom: "30px",
    fontSize: "14px",
  },
  pendingBadge: {
    backgroundColor: "#f59e0b",
    color: "white",
    padding: "5px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  teamCard: {
    background: "var(--glass-bg, rgba(255, 255, 255, 0.18))",
    backdropFilter: "Glass(14px) blur(14px)",
    WebkitBackdropFilter: "Glass(14px) blur(14px)",
    border: "1px solid var(--glass-border, rgba(255, 255, 255, 0.25))",
    padding: "25px",
    borderRadius: "24px",
    marginBottom: "25px",
    boxShadow: "var(--glass-shadow, 0 8px 32px rgba(0, 0, 0, 0.08))",
  },
  teamHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  teamName: {
    margin: "0",
    color: "#2563EB",
    fontSize: "20px",
  },
  teamStats: {
    fontSize: "14px",
    color: "#666",
    backgroundColor: "#f3f4f6",
    padding: "4px 10px",
    borderRadius: "20px",
  },
  tournamentName: {
    color: "#666",
    fontSize: "14px",
    marginBottom: "20px",
    paddingBottom: "15px",
    borderBottom: "1px solid #eee",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: "15px",
    color: "#f59e0b",
    fontSize: "14px",
  },
  playerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  playerInfo: {
    display: "flex",
    flexDirection: "column",
  },
  playerName: {
    fontWeight: "600",
    color: "#333",
    fontSize: "16px",
  },
  playerEmail: {
    fontSize: "12px",
    color: "#999",
    marginTop: "2px",
  },
  buttonGroup: {
    display: "flex",
    gap: "10px",
  },
  approveBtn: {
    background: "#10b981",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  rejectBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  noDataContainer: {
    textAlign: "center",
    padding: "30px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
  },
  noData: {
    color: "#888",
    fontStyle: "italic",
    margin: "0",
  },
  noDataSub: {
    color: "#aaa",
    fontSize: "12px",
    marginTop: "5px",
  },
  progressContainer: {
    marginTop: "20px",
    paddingTop: "15px",
    borderTop: "1px solid #eee",
  },
  progressBar: {
    height: "8px",
    backgroundColor: "#e5e7eb",
    borderRadius: "4px",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: "4px",
    transition: "width 0.3s ease",
  },
  progressText: {
    fontSize: "12px",
    color: "#666",
    marginTop: "8px",
    textAlign: "right",
  },
  retryBtn: {
    background: "#2563EB",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "15px",
    fontSize: "14px",
  },
  createBtn: {
    background: "#2563EB",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
    marginTop: "20px",
    fontSize: "14px",
  },
};