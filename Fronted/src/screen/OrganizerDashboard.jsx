import React, { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { Link } from "react-router-dom";
import "../static/OrganizerDashboard.css";
import { motion } from "framer-motion";
import TiltCard from "../components/TiltCard";
import SkeletonDashboard from "../components/loading/SkeletonDashboard";

import socket from "../utils/socket";
import { useAuth } from "../context/AuthContext";

function AnimatedCounter({ value, duration = 1000 }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value, 10);
    if (isNaN(end) || end <= 0) {
      setCount(value || 0);
      return;
    }
    let stepTime = Math.max(Math.floor(duration / end), 15);
    let timer = setInterval(() => {
      start += Math.ceil(end / 40);
      if (start >= end) {
        start = end;
        clearInterval(timer);
      }
      setCount(start);
    }, stepTime);
    return () => clearInterval(timer);
  }, [value, duration]);
  return <span>{count}</span>;
}

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [data, setData] = useState({
    stats: { totalTournaments: 0, upcoming: 0, ongoing: 0, completed: 0, cancelled: 0 },
    registrations: { pending: 0, approved: 0, pendingPayment: 0, rejected: 0 },
    matches: { total: 0, completed: 0, remaining: 0 },
    financials: { registrationFeesCollected: 0, tournamentCreationFees: 0, sponsorContributions: 0, winnerPrize: 0, runnerUpPrize: 0, netProfit: 0 },
    activity: { recentRegistrations: [], recentTeamPayments: [], recentOrganizerPayments: [], recentSponsorPayments: [], notifications: [] }
  });

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, [user]);

  // Real-Time and Polling Fallback Hook
  useEffect(() => {
    if (!user) return;

    // Join the analytics room
    socket.emit("register-analytics", { userId: user._id || user.id });

    // Handle real-time updates
    const handleUpdate = (update) => {
      console.log("⚡ Real-time organizer dashboard update received:", update);
      fetchStats();
      fetchNotifications();
    };

    socket.on("dashboard_update", handleUpdate);
    socket.on("new_notification", handleUpdate);

    // Setup 10-second polling fallback if socket is disconnected
    const interval = setInterval(() => {
      if (!socket.connected) {
        console.log("🔌 Socket disconnected, falling back to 10-second polling for Organizer...");
        fetchStats();
        fetchNotifications();
      }
    }, 10000);

    return () => {
      socket.off("dashboard_update", handleUpdate);
      socket.off("new_notification", handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/organizer-dashboard");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load organizer dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load organizer dashboard notifications:", err);
    }
  };

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

  if (loading) {
    return (
      <div className="org-dashboard-container">
        <SkeletonDashboard />
      </div>
    );
  }

  // Animation variants
  const containerReveal = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemFadeUp = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 14 },
    },
  };

  const stats = data.stats || {};
  const registrations = data.registrations || {};
  const matches = data.matches || {};
  const financials = data.financials || {};
  const activity = data.activity || {};
  const recentRegistrations = activity.recentRegistrations || [];
  const recentTeamPayments = activity.recentTeamPayments || [];
  const recentOrganizerPayments = activity.recentOrganizerPayments || [];
  const recentSponsorPayments = activity.recentSponsorPayments || [];

  const totalRegistrationsCount = (registrations.pending || 0) + (registrations.approved || 0) + (registrations.pendingPayment || 0) + (registrations.rejected || 0);

  return (
    <motion.div 
      className="org-dashboard-container perspective-viewport"
      variants={containerReveal}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div className="org-dashboard-header" variants={itemFadeUp}>
        <div>
          <h1>🏆 Organizer Dashboard</h1>
          <p>Real-time tournament stats, teams metrics, and registration overviews.</p>
        </div>
        <button onClick={fetchStats} className="org-refresh-btn light-sweep-wrapper">
          🔄 Refresh Stats
        </button>
      </motion.div>

      {/* Widgets Grid */}
      <motion.div className="org-widgets-grid" variants={itemFadeUp}>
        {/* Tournament Widget */}
        <TiltCard className="org-widget-card tournaments" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">🏆</div>
          <h3>Tournaments Overview</h3>
          <div className="org-widget-number">
            <AnimatedCounter value={stats.totalTournaments} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>🟢 Active</span>
              <span className="org-detail-value">{stats.ongoing || 0}</span>
            </div>
            <div className="org-detail-row">
              <span>📅 Upcoming</span>
              <span className="org-detail-value">{stats.upcoming || 0}</span>
            </div>
            <div className="org-detail-row">
              <span>✅ Completed</span>
              <span className="org-detail-value">{stats.completed || 0}</span>
            </div>
          </div>
        </TiltCard>

        {/* Registrations Widget */}
        <TiltCard className="org-widget-card registrations" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">📝</div>
          <h3>Registration Overview</h3>
          <div className="org-widget-number">
            <AnimatedCounter value={totalRegistrationsCount} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>✅ Approved</span>
              <span className="org-detail-value" style={{ color: "var(--org-success)" }}>{registrations.approved || 0}</span>
            </div>
            <div className="org-detail-row">
              <span>⏳ Pending Approval</span>
              <span className="org-detail-value" style={{ color: "var(--org-warning)" }}>{registrations.pending || 0}</span>
            </div>
            <div className="org-detail-row">
              <span>💳 Pending Payment</span>
              <span className="org-detail-value" style={{ color: "#ef4444" }}>{registrations.pendingPayment || 0}</span>
            </div>
          </div>
        </TiltCard>

        {/* Matches Widget */}
        <TiltCard className="org-widget-card matches" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">⚽</div>
          <h3>Matches Overview</h3>
          <div className="org-widget-number">
            <AnimatedCounter value={matches.total} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>✅ Completed</span>
              <span className="org-detail-value">{matches.completed || 0}</span>
            </div>
            <div className="org-detail-row">
              <span>🔴 Remaining</span>
              <span className="org-detail-value">{matches.remaining || 0}</span>
            </div>
          </div>
        </TiltCard>

        {/* Financials Widget */}
        <TiltCard className="org-widget-card financials" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">💰</div>
          <h3>Net Profit / Loss</h3>
          <div className="org-widget-number" style={{ color: financials.netProfit >= 0 ? "var(--org-success)" : "var(--org-danger)" }}>
            {financials.netProfit >= 0 ? "+" : ""}{formatCurrency(financials.netProfit)}
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>📥 Registration Income</span>
              <span className="org-detail-value">{formatCurrency(financials.registrationFeesCollected)}</span>
            </div>
            <div className="org-detail-row">
              <span>🤝 Sponsor Contributions</span>
              <span className="org-detail-value">{formatCurrency(financials.sponsorContributions)}</span>
            </div>
            <div className="org-detail-row">
              <span>💸 Total Prize Money Paid</span>
              <span className="org-detail-value" style={{ color: "var(--org-danger)" }}>
                {formatCurrency((financials.winnerPrize || 0) + (financials.runnerUpPrize || 0))}
              </span>
            </div>
          </div>
        </TiltCard>
      </motion.div>

      {/* ================= QUICK ACTIONS ================= */}
      <motion.section className="org-panel org-quick-actions-panel" style={{ marginBottom: "32px" }} variants={itemFadeUp}>
        <h2>⚡ Organizer Quick Shortcuts</h2>
        <div className="org-quick-actions-grid">
          <Link to="/my-tournaments" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">📋</span>
            <strong>My Tournaments</strong>
            <small>View and edit your tournaments</small>
          </Link>
          <Link to="/create-tournament" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">✨</span>
            <strong>Create Tournament</strong>
            <small>Build a new collegiate league</small>
          </Link>
          <Link to="/organizer/registrations" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">📝</span>
            <strong>Team Registrations</strong>
            <small>Approve or reject team entries</small>
          </Link>
          <Link to="/organizer/matches/list" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">📋</span>
            <strong>Match List</strong>
            <small>View and filter match fixtures</small>
          </Link>
          <Link to="/organizer/matches" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">📅</span>
            <strong>Create Match / Manage Matches</strong>
            <small>Coordinate and edit match schedules</small>
          </Link>
          <Link to="/teams/create" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">➕</span>
            <strong>Create Team</strong>
            <small>Establish a new athletic squad</small>
          </Link>
          <Link to="/my-sponsors" className="org-action-tile light-sweep-wrapper">
            <span className="org-tile-icon">🤝</span>
            <strong>Manage Sponsors</strong>
            <small>Distribute sponsorship funding</small>
          </Link>
        </div>
      </motion.section>

      {/* Recent Notifications Panel */}
      <motion.section className="org-panel notifications-panel" style={{ marginBottom: "32px" }} variants={itemFadeUp}>
        <h2>🔔 Recent Notifications</h2>
        <div className="org-panel-table-wrapper" style={{ maxHeight: "250px" }}>
          {notifications.length === 0 ? (
            <p className="org-empty-text">🔔 No recent notifications.</p>
          ) : (
            <div className="org-notifications-list" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notifications.slice(0, 5).map((n) => (
                <div
                  key={n._id}
                  className={`org-notification-item ${!n.isRead ? "unread" : ""}`}
                  style={{
                    padding: "12px 16px",
                    borderRadius: "var(--radius-sm)",
                    background: n.isRead ? "var(--org-surface-2)" : "rgba(59, 130, 246, 0.08)",
                    borderLeft: n.isRead ? "3px solid var(--org-border)" : "3px solid var(--primary)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    border: "1px solid var(--org-border)"
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: n.isRead ? "500" : "700", color: "var(--org-text)" }}>{n.message}</p>
                    <small style={{ color: "var(--org-text-muted)", fontSize: "11px" }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now"}
                    </small>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={async () => {
                        try {
                          await api.put(`/notifications/${n._id}`);
                          setNotifications(prev => prev.map(item =>
                            item._id === n._id ? { ...item, isRead: true } : item
                          ));
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        background: "var(--org-surface)",
                        border: "1px solid var(--org-border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        color: "var(--org-text)"
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>

      {/* Sub-data Tables Grid */}
      <div className="org-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Recent Registrations */}
        <motion.div className="org-panel" variants={itemFadeUp}>
          <h2>📋 Recent Team Registrations</h2>
          <div className="org-panel-table-wrapper">
            {recentRegistrations.length === 0 ? (
              <p className="org-empty-text">No recent team registrations.</p>
            ) : (
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Tournament</th>
                    <th>Date Registered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRegistrations.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.teamId?.teamName || "N/A"}</strong></td>
                      <td>{item.tournamentId?.eventName || "N/A"}</td>
                      <td>{formatDate(item.registrationDate)}</td>
                      <td>
                        <span className={`status-badge ${item.approvalStatus}`}>
                          {item.approvalStatus || "pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Recent Team Payments */}
        <motion.div className="org-panel" variants={itemFadeUp}>
          <h2>💳 Recent Team Entry Payments</h2>
          <div className="org-panel-table-wrapper">
            {recentTeamPayments.length === 0 ? (
              <p className="org-empty-text">No recent payment activity.</p>
            ) : (
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Tournament</th>
                    <th>Date Paid</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTeamPayments.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.teamId?.teamName || "N/A"}</strong></td>
                      <td>{item.tournamentId?.eventName || "N/A"}</td>
                      <td>{formatDate(item.paidAt)}</td>
                      <td style={{ color: "var(--org-success)", fontWeight: "600" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>

      <div className="org-data-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Recent Organizer Payments (Creation Fees) */}
        <motion.div className="org-panel" variants={itemFadeUp}>
          <h2>💸 Tournament Creation Expenses</h2>
          <div className="org-panel-table-wrapper">
            {recentOrganizerPayments.length === 0 ? (
              <p className="org-empty-text">No tournament creation fees paid yet.</p>
            ) : (
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Date Paid</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrganizerPayments.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.tournamentId?.eventName || "N/A"}</strong></td>
                      <td>{formatDate(item.createdAt)}</td>
                      <td style={{ color: "var(--org-danger)", fontWeight: "600" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Recent Sponsor Contributions */}
        <motion.div className="org-panel" variants={itemFadeUp}>
          <h2>🤝 Sponsor Funding Contributions</h2>
          <div className="org-panel-table-wrapper">
            {recentSponsorPayments.length === 0 ? (
              <p className="org-empty-text">No sponsor funding active.</p>
            ) : (
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Sponsor</th>
                    <th>Tournament</th>
                    <th>Date Approved</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSponsorPayments.map((item, index) => (
                    <tr key={index}>
                      <td><strong>{item.sponsorId?.name || "N/A"}</strong></td>
                      <td>{item.tournamentId?.eventName || "N/A"}</td>
                      <td>{formatDate(item.updatedAt)}</td>
                      <td style={{ color: "var(--org-success)", fontWeight: "600" }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
