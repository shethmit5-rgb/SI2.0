import React, { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { Link } from "react-router-dom";
import "../static/OrganizerDashboard.css";
import { motion } from "framer-motion";
import TiltCard from "../components/TiltCard";

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
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [data, setData] = useState({
    teamsOverview: { total: 0, byTournament: [], bySport: [] },
    tournamentOverview: { total: 0, active: 0, upcoming: 0, completed: 0 },
    matchOverview: { total: 0, scheduled: 0, ongoing: 0, completed: 0 },
    registrationOverview: { total: 0, approved: 0, pending: 0 }
  });

  useEffect(() => {
    fetchStats();
    fetchNotifications();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/analytics/organizer-stats");
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

  if (loading) {
    return (
      <div className="org-dashboard-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div className="loading-spinner" style={{ margin: "0 auto 20px" }}></div>
          <h2 style={{ color: "var(--org-text-main)" }}>Loading organizer stats...</h2>
        </div>
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
            <AnimatedCounter value={data.tournamentOverview.total} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>🟢 Active</span>
              <span className="org-detail-value">{data.tournamentOverview.active}</span>
            </div>
            <div className="org-detail-row">
              <span>📅 Upcoming</span>
              <span className="org-detail-value">{data.tournamentOverview.upcoming}</span>
            </div>
            <div className="org-detail-row">
              <span>✅ Completed</span>
              <span className="org-detail-value">{data.tournamentOverview.completed}</span>
            </div>
          </div>
        </TiltCard>

        {/* Teams Widget */}
        <TiltCard className="org-widget-card teams" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">👥</div>
          <h3>Teams Overview</h3>
          <div className="org-widget-number">
            <AnimatedCounter value={data.teamsOverview.total} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>Tournaments Participating</span>
              <span className="org-detail-value">{data.teamsOverview.byTournament.length}</span>
            </div>
            <div className="org-detail-row">
              <span>Active Sports</span>
              <span className="org-detail-value">{data.teamsOverview.bySport.length}</span>
            </div>
          </div>
        </TiltCard>

        {/* Matches Widget */}
        <TiltCard className="org-widget-card matches" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">⚽</div>
          <h3>Matches Overview</h3>
          <div className="org-widget-number">
            <AnimatedCounter value={data.matchOverview.total} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>📅 Scheduled</span>
              <span className="org-detail-value">{data.matchOverview.scheduled}</span>
            </div>
            <div className="org-detail-row">
              <span>🔴 Ongoing</span>
              <span className="org-detail-value">{data.matchOverview.ongoing}</span>
            </div>
            <div className="org-detail-row">
              <span>✅ Completed</span>
              <span className="org-detail-value">{data.matchOverview.completed}</span>
            </div>
          </div>
        </TiltCard>

        {/* Registrations Widget */}
        <TiltCard className="org-widget-card registrations" style={{ height: "100%" }}>
          <div className="org-widget-card-icon">📝</div>
          <h3>Registration Overview</h3>
          <div className="org-widget-number">
            <AnimatedCounter value={data.registrationOverview.total} />
          </div>
          <div className="org-widget-details">
            <div className="org-detail-row">
              <span>✅ Approved</span>
              <span className="org-detail-value" style={{ color: "var(--org-success)" }}>{data.registrationOverview.approved}</span>
            </div>
            <div className="org-detail-row">
              <span>⏳ Pending</span>
              <span className="org-detail-value" style={{ color: "var(--org-warning)" }}>{data.registrationOverview.pending}</span>
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
      <div className="org-data-grid">
        {/* Teams by Tournament */}
        <motion.div className="org-panel" variants={itemFadeUp}>
          <h2>📊 Teams by Tournament</h2>
          <div className="org-panel-table-wrapper">
            {data.teamsOverview.byTournament.length === 0 ? (
              <p className="org-empty-text">No teams registered in tournaments yet.</p>
            ) : (
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Registered Teams</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teamsOverview.byTournament.map((t, index) => (
                    <tr key={index}>
                      <td><strong>{t.name}</strong></td>
                      <td>{t.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>

        {/* Teams by Sport */}
        <motion.div className="org-panel" variants={itemFadeUp}>
          <h2>🏅 Teams by Sport</h2>
          <div className="org-panel-table-wrapper">
            {data.teamsOverview.bySport.length === 0 ? (
              <p className="org-empty-text">No teams registered under sports yet.</p>
            ) : (
              <table className="org-table">
                <thead>
                  <tr>
                    <th>Sport</th>
                    <th>Total Teams</th>
                  </tr>
                </thead>
                <tbody>
                  {data.teamsOverview.bySport.map((s, index) => (
                    <tr key={index}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.count}</td>
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
