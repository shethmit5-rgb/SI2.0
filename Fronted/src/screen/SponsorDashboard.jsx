import React, { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import "../static/SponsorDashboard.css";
import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";
import SkeletonDashboard from "../components/loading/SkeletonDashboard";

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDistribution, setSelectedDistribution] = useState(null);
  const [data, setData] = useState({
    stats: { 
      sponsoredTournaments: 0, 
      activeSponsorships: 0, 
      completedSponsorships: 0,
      totalSponsoredPrizeAmount: 0,
      totalPlayersRewarded: 0,
      totalWinnerTeamsSponsored: 0,
      totalRunnerUpTeamsSponsored: 0,
      totalCompletedDistributions: 0
    },
    financials: { totalSponsoredAmount: 0, titleSponsorshipAmount: 0, inKindSponsorshipAmount: 0 },
    history: [],
    upcomingSponsoredEvents: [],
    completedSponsoredEvents: [],
    notifications: [],
    prizeDistributions: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Real-Time and Polling Fallback Hook
  useEffect(() => {
    if (!user) return;

    // Join the analytics room
    socket.emit("register-analytics", { userId: user._id || user.id });

    // Handle real-time updates
    const handleUpdate = (update) => {
      console.log("⚡ Real-time sponsor dashboard update received:", update);
      fetchDashboardData();
    };

    socket.on("dashboard_update", handleUpdate);
    socket.on("new_notification", handleUpdate);

    // Setup 10-second polling fallback if socket is disconnected
    const interval = setInterval(() => {
      if (!socket.connected) {
        console.log("🔌 Socket disconnected, falling back to 10-second polling for Sponsor...");
        fetchDashboardData();
      }
    }, 10000);

    return () => {
      socket.off("dashboard_update", handleUpdate);
      socket.off("new_notification", handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/analytics/sponsor-dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch sponsor dashboard data:", err);
      setError("Failed to load sponsorship analytics.");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="sponsor-db-container">
        <SkeletonDashboard />
      </div>
    );
  }

  const stats = data.stats || {};
  const financials = data.financials || {};
  const history = data.history || [];
  const upcomingEvents = data.upcomingSponsoredEvents || [];
  const completedEvents = data.completedSponsoredEvents || [];
  const notifications = data.notifications || [];

  return (
    <div className="sponsor-db-container">
      <div className="sponsor-db-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1>Sponsor Dashboard</h1>
          <p>A summary of your sponsorships, contributions, and tournament results.</p>
        </div>
        <button onClick={fetchDashboardData} className="org-refresh-btn light-sweep-wrapper" style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text)", fontSize: "14px", fontWeight: "700", cursor: "pointer" }}>
          🔄 Refresh Stats
        </button>
      </div>

      {error && <div className="error-banner" style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", borderLeft: "4px solid #dc2626" }}>{error}</div>}

      {/* Stats Cards */}
      <div className="sponsor-db-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card total" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Sponsored Tournaments</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>{stats.sponsoredTournaments || 0}</p>
        </div>
        <div className="stat-card active" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Active Sponsorships</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>{stats.activeSponsorships || 0}</p>
        </div>
        <div className="stat-card completed" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Completed Sponsorships</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--text)" }}>{stats.completedSponsorships || 0}</p>
        </div>
      </div>

      {/* Financials Cards */}
      <div className="sponsor-db-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card total-amount" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Total Sponsored Amount</h4>
          <p className="stat-value" style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--success)" }}>{formatCurrency(financials.totalSponsoredAmount)}</p>
        </div>
        <div className="stat-card title-amount" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Title Sponsorship funding</h4>
          <p className="stat-value" style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--primary)" }}>{formatCurrency(financials.titleSponsorshipAmount)}</p>
        </div>
        <div className="stat-card inkind-amount" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>In-Kind Contributions</h4>
          <p className="stat-value" style={{ fontSize: "2.2rem", fontWeight: "800", color: "#6d28d9" }}>{formatCurrency(financials.inKindSponsorshipAmount)}</p>
        </div>
      </div>

      {/* Title Sponsorship ROI Metrics */}
      <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text)", marginBottom: "15px" }}>🏆 Title Sponsorship ROI Statistics</h3>
      <div className="sponsor-db-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "30px" }}>
        <div className="stat-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Total Sponsored Prize</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--success)" }}>{formatCurrency(stats.totalSponsoredPrizeAmount)}</p>
        </div>
        <div className="stat-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Players Rewarded</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--primary)" }}>{stats.totalPlayersRewarded || 0}</p>
        </div>
        <div className="stat-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Winner Teams Sponsored</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--highlight)" }}>{stats.totalWinnerTeamsSponsored || 0}</p>
        </div>
        <div className="stat-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Runner-Up Teams Sponsored</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--teal)" }}>{stats.totalRunnerUpTeamsSponsored || 0}</p>
        </div>
        <div className="stat-card" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "8px" }}>Completed Distributions</h4>
          <p className="stat-value" style={{ fontSize: "2rem", fontWeight: "800", color: "var(--premium)" }}>{stats.totalCompletedDistributions || 0}</p>
        </div>
      </div>

      {/* History Table */}
      <div className="sponsor-db-table-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", marginBottom: "20px" }}>Sponsorship History & Tournament Results</h2>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          {history.length === 0 ? (
            <div className="no-data-message" style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
              You haven't sponsored any tournaments yet. Visit the Events tab to browse and sponsor upcoming tournaments.
            </div>
          ) : (
            <table className="sponsor-history-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Tournament Name</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Sponsorship Type</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Amount Sponsored</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Winner Team</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Runner-Up Team</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Tournament Status</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Dates</th>
                </tr>
              </thead>
              <tbody>
                {history.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="tournament-cell" style={{ padding: "14px", fontSize: "14px", color: "var(--text)", fontWeight: "600" }}>{s.tournamentName}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)" }}>
                      <span className={`type-badge ${s.sponsorshipType.toLowerCase().includes("title") ? "title" : "inkind"}`} style={{ display: "inline-flex", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: "600" }}>
                        {s.sponsorshipType}
                      </span>
                    </td>
                    <td className="amount-cell" style={{ padding: "14px", fontSize: "14px", color: "var(--success)", fontWeight: "600" }}>{formatCurrency(s.sponsoredAmount)}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)" }}>{s.winnerTeam && s.winnerTeam !== "0" ? s.winnerTeam : "TBD"}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)" }}>{s.runnerUpTeam && s.runnerUpTeam !== "0" ? s.runnerUpTeam : "TBD"}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)", textTransform: "capitalize" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: s.tournamentStatus === "ongoing" ? "var(--teal-light)" : s.tournamentStatus === "upcoming" ? "var(--warning-light)" : "var(--surface-2)",
                        color: s.tournamentStatus === "ongoing" ? "var(--teal)" : s.tournamentStatus === "upcoming" ? "var(--warning)" : "var(--text-secondary)"
                      }}>
                        {s.tournamentStatus}
                      </span>
                    </td>
                    <td style={{ padding: "14px", fontSize: "13px", color: "var(--text-muted)" }}>{formatDate(s.startDate)} - {formatDate(s.endDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Prize Distributions Table */}
      <div className="sponsor-db-table-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", marginBottom: "30px" }}>
        <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", marginBottom: "20px" }}>🏆 Title Sponsorship Prize Distributions</h2>
        <div className="table-wrapper" style={{ overflowX: "auto" }}>
          {!data.prizeDistributions || data.prizeDistributions.length === 0 ? (
            <div className="no-data-message" style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px" }}>
              No completed prize distributions recorded.
            </div>
          ) : (
            <table className="sponsor-history-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Distribution ID</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Tournament</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Winner Team</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Runner-Up Team</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Winner Prize</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Runner-Up Prize</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Players Rewarded</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Distribution Date</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Status</th>
                  <th style={{ padding: "12px 14px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.prizeDistributions.map((d, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "14px", fontSize: "13px", color: "var(--text)", fontFamily: "monospace", fontWeight: "600" }}>{d.distributionId}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)", fontWeight: "600" }}>{d.tournamentName}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)" }}>{d.winnerTeam}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)" }}>{d.runnerUpTeam}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--success)", fontWeight: "600" }}>{formatCurrency(d.winnerPrize)}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--success)", fontWeight: "600" }}>{formatCurrency(d.runnerUpPrize)}</td>
                    <td style={{ padding: "14px", fontSize: "14px", color: "var(--text)" }}>{d.playersRewardedCount} Players</td>
                    <td style={{ padding: "14px", fontSize: "13px", color: "var(--text-muted)" }}>{formatDate(d.distributionDate)}</td>
                    <td style={{ padding: "14px", fontSize: "13px" }}>
                      <span style={{ padding: "4px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: "700", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                        Completed
                      </span>
                    </td>
                    <td style={{ padding: "14px", fontSize: "13px" }}>
                      <button 
                        onClick={() => setSelectedDistribution(d)}
                        className="org-refresh-btn"
                        style={{ padding: "6px 12px", background: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontWeight: "600" }}
                      >
                        👁️ View Distribution
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Notifications / Scheduled Events Row */}
      <div className="sponsor-db-activities" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
        {/* Upcoming Sponsored Events */}
        <div className="sponsor-db-table-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", marginBottom: "15px" }}>📅 Upcoming Sponsored Events</h2>
          {upcomingEvents.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>No upcoming sponsored tournaments scheduled.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {upcomingEvents.map((event, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <strong style={{ fontSize: "14px", color: "var(--text)" }}>{event.tournamentName}</strong>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Starts: {formatDate(event.startDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="sponsor-db-table-section" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text)", marginBottom: "15px" }}>🔔 Recent Alerts</h2>
          {notifications.length === 0 ? (
            <p style={{ color: "var(--text-muted)", fontSize: "14px", textAlign: "center", padding: "20px" }}>No recent alerts.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {notifications.slice(0, 5).map((n) => (
                <div key={n._id} style={{ padding: "10px 14px", background: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--border)", borderLeft: n.isRead ? "3px solid var(--border)" : "3px solid var(--primary)" }}>
                  <p style={{ margin: "0 0 4px 0", fontSize: "13px", color: "var(--text)", fontWeight: n.isRead ? "500" : "700" }}>{n.message}</p>
                  <small style={{ color: "var(--text-muted)", fontSize: "11px" }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}</small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for View Distribution */}
      {selectedDistribution && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "24px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text)" }}>
                🏆 Payout Breakdown ({selectedDistribution.distributionId})
              </h3>
              <button 
                onClick={() => setSelectedDistribution(null)}
                style={{ background: "none", border: "none", color: "var(--text-secondary)", fontSize: "20px", cursor: "pointer", fontWeight: "700" }}
              >
                &times;
              </button>
            </div>
            
            <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Tournament: <strong>{selectedDistribution.tournamentName}</strong>
            </p>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Winner Team: <strong>{selectedDistribution.winnerTeam}</strong> (Winner Prize: {formatCurrency(selectedDistribution.winnerPrize)})
            </p>
            <p style={{ margin: "4px 0 20px 0", fontSize: "14px", color: "var(--text-secondary)" }}>
              Runner-up Team: <strong>{selectedDistribution.runnerUpTeam}</strong> (Runner-up Prize: {formatCurrency(selectedDistribution.runnerUpPrize)})
            </p>

            <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "8px" }}>Roster Payouts</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {selectedDistribution.playerRewards.map((player, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface-2)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  <div>
                    <strong style={{ fontSize: "14px", color: "var(--text)" }}>{player.playerName}</strong>
                    <div style={{ display: "flex", gap: "10px", marginTop: "2px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>Team: {player.position === "Winner" ? selectedDistribution.winnerTeam : selectedDistribution.runnerUpTeam}</span>
                      <span style={{ fontSize: "11px", color: player.position === "Winner" ? "var(--success)" : "var(--primary)", fontWeight: "700" }}>{player.position}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--success)" }}>{formatCurrency(player.individualPrize)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
