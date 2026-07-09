import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./AdminDashboard.css";
import { motion } from "framer-motion";
import TiltCard from "../components/TiltCard";
import SkeletonDashboard from "../components/loading/SkeletonDashboard";

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

export default function AdminDashboard() {
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [prizeDistributions, setPrizeDistributions] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [stats, setStats] = useState({
    users: 0,
    tournaments: 0,
    teams: 0,
    prizePool: 0,
    totalPrizeDistributed: 0,
    totalDistributionsCompleted: 0,
  });

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  const handleManualDistribute = async (tournamentId) => {
    try {
      setActionLoadingId(tournamentId);
      const res = await axios.post(`http://localhost:5000/api/prize-distributions/distribute/${tournamentId}`, {}, authHeader);
      alert(`✅ Prize distributed successfully! Distribution ID: ${res.data.distributionId}`);
      loadDashboardData();
    } catch (err) {
      console.error(err);
      alert(`❌ Error: ${err.response?.data?.message || err.message || "Failed to distribute prizes"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ================= LOAD DASHBOARD ================= */
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const usersRes = await axios.get("http://localhost:5000/api/users", authHeader);
      console.log("USERS OK");

      const tournamentsRes = await axios.get("http://localhost:5000/api/tournaments/public");
      console.log("TOURNAMENTS OK");

      const teamsRes = await axios.get("http://localhost:5000/api/teams", authHeader);
      console.log("TEAMS OK");

      const sponsorsRes = await axios.get("http://localhost:5000/api/sponsors", authHeader);
      console.log("SPONSORS OK");

      const registrationsRes = await axios.get("http://localhost:5000/api/registrations", authHeader);
      console.log("REGISTRATIONS OK");

      const analyticsRes = await axios.get("http://localhost:5000/api/analytics/stats", authHeader);
      const analyticsStats = analyticsRes.data.stats || {};
      console.log("ANALYTICS OK");

      const distsRes = await axios.get("http://localhost:5000/api/prize-distributions", authHeader);
      setPrizeDistributions(distsRes.data || []);
      console.log("DISTRIBUTIONS OK");

      const prizePool = sponsorsRes.data.reduce(
        (sum, s) => sum + Number(s.amount || 0),
        0
      );

      setUsers(usersRes.data);
      setTournaments(tournamentsRes.data);
      setRegistrations(registrationsRes.data);

      setStats({
        users: usersRes.data.length,
        tournaments: tournamentsRes.data.length,
        teams: teamsRes.data.length,
        prizePool,
        totalPrizeDistributed: analyticsStats.totalPrizeDistributed || 0,
        totalDistributionsCompleted: analyticsStats.totalDistributionsCompleted || 0,
      });
    } catch (err) {
      console.error("ADMIN DASHBOARD ERROR:", err.response?.data || err.message);
      alert("❌ Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <SkeletonDashboard />
      </div>
    );
  }

  // Animation variants
  const dashboardContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const dashboardItem = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 90, damping: 14 },
    },
  };

  return (
    <motion.div
      className="admin-layout perspective-viewport"
      variants={dashboardContainer}
      initial="hidden"
      animate="show"
    >
      <main className="content">
        <motion.div className="admin-header-row" variants={dashboardItem}>
          <div>
            <h1>📊 Admin Control Dashboard</h1>
            <p className="admin-subtitle">Manage system users, sports categories, collegiate teams, and sponsorship allocations.</p>
          </div>
          <button onClick={loadDashboardData} className="refresh-btn-premium light-sweep-wrapper">
            🔄 Refresh Analytics
          </button>
        </motion.div>

        {/* ================= STATS WITH 3D TILTS ================= */}
        <motion.div className="stats" variants={dashboardItem} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          <TiltCard className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total Users</span>
            <br />
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--primary)" }}>
              <AnimatedCounter value={stats.users} />
            </span>
          </TiltCard>

          <TiltCard className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Tournaments</span>
            <br />
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--teal)" }}>
              <AnimatedCounter value={stats.tournaments} />
            </span>
          </TiltCard>

          <TiltCard className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Teams</span>
            <br />
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--highlight)" }}>
              <AnimatedCounter value={stats.teams} />
            </span>
          </TiltCard>

          <TiltCard className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Prize Pool</span>
            <br />
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--premium)" }}>
              ₹<AnimatedCounter value={stats.prizePool} />
            </span>
          </TiltCard>

          <TiltCard className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Total Distributed</span>
            <br />
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--success)" }}>
              ₹<AnimatedCounter value={stats.totalPrizeDistributed} />
            </span>
          </TiltCard>

          <TiltCard className="card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Distributions Count</span>
            <br />
            <span style={{ fontSize: "32px", fontWeight: "800", color: "var(--primary)" }}>
              <AnimatedCounter value={stats.totalDistributionsCompleted} />
            </span>
          </TiltCard>
        </motion.div>

        {/* ================= QUICK ACTIONS WITH 3D HOVERS ================= */}
        <motion.section className="panel quick-actions-panel" variants={dashboardItem}>
          <h2>⚡ Admin Quick Shortcuts</h2>
          <div className="quick-actions-grid">
            <Link to="/admin/tournament/create" className="action-tile light-sweep-wrapper">
              <span className="tile-icon">🏆</span>
              <strong>Create Tournament</strong>
              <small>Build bracket brackets & schedules</small>
            </Link>
            <Link to="/admin/users" className="action-tile light-sweep-wrapper">
              <span className="tile-icon">👥</span>
              <strong>Manage Users</strong>
              <small>Modify roles, access, & accounts</small>
            </Link>
            <Link to="/admin/players/approve" className="action-tile light-sweep-wrapper">
              <span className="tile-icon">✅</span>
              <strong>Approve Players</strong>
              <small>Verify athlete registration logs</small>
            </Link>
            <Link to="/admin/venues" className="action-tile light-sweep-wrapper">
              <span className="tile-icon">🏟️</span>
              <strong>Manage Venues</strong>
              <small>Configure active collegiate courts</small>
            </Link>
          </div>
        </motion.section>

        {/* ================= PANELS GRID ================= */}
        <div className="admin-dashboard-panels-grid">
          {/* ================= TOURNAMENTS ================= */}
          <motion.section className="panel" variants={dashboardItem}>
            <h2>🏆 Active Tournaments</h2>
            <div className="table-container-fixed">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Sport</th>
                    <th>Location</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.slice(0, 5).map((t) => (
                    <tr key={t._id}>
                      <td><strong>{t.eventName}</strong></td>
                      <td>{t.sportId?.name || "N/A"}</td>
                      <td>{t.location || "-"}</td>
                      <td>
                        <span className={`status ${t.status}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <Link to="/admin/tournaments" className="view-all-link">Manage Tournaments List →</Link>
            </div>
          </motion.section>

          {/* ================= REGISTRATIONS ================= */}
          <motion.section className="panel" variants={dashboardItem}>
            <h2>📝 Athlete Registrations</h2>
            <div className="table-container-fixed">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Team</th>
                    <th>Tournament</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.slice(0, 5).map((r) => (
                    <tr key={r._id}>
                      <td><strong>{r.userId?.name}</strong></td>
                      <td>{r.teamId?.teamName}</td>
                      <td>{r.tournamentId?.eventName}</td>
                      <td>
                        <span className={`status ${r.approvalStatus}`}>
                          {r.approvalStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <Link to="/admin/registrations" className="view-all-link">Manage Registrations List →</Link>
            </div>
          </motion.section>
        </div>

        {/* ================= PRIZE DISTRIBUTION LOGS ================= */}
        <motion.section className="panel" variants={dashboardItem} style={{ marginTop: "30px" }}>
          <h2>🏆 Prize Distribution Logs & Recovery</h2>
          <div className="table-container-fixed" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table>
              <thead>
                <tr>
                  <th>Distribution ID</th>
                  <th>Tournament</th>
                  <th>Title Sponsor</th>
                  <th>Winner Team</th>
                  <th>Runner-Up Team</th>
                  <th>Winner Prize</th>
                  <th>Runner-Up Prize</th>
                  <th>Players Rewarded</th>
                  <th>Distribution Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.filter(t => t.status === "completed").map((t) => {
                  const dist = prizeDistributions.find(d => d.tournamentId?._id === t._id || d.tournamentId === t._id);
                  const formatCurrency = (val) => {
                    return new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 0
                    }).format(val || 0);
                  };

                  return (
                    <tr key={t._id}>
                      <td style={{ fontFamily: "monospace", fontWeight: "600" }}>{dist ? dist.distributionId : "-"}</td>
                      <td><strong>{t.eventName}</strong></td>
                      <td>{dist ? dist.snapshots?.brandName : "Title Sponsor"}</td>
                      <td>{dist ? dist.snapshots?.winnerTeamName : (t.winner?.teamName || "TBD")}</td>
                      <td>{dist ? dist.snapshots?.runnerUpTeamName : (t.runnerUp?.teamName || "TBD")}</td>
                      <td>{dist ? formatCurrency(dist.snapshots?.winnerPrizeTotal) : "-"}</td>
                      <td>{dist ? formatCurrency(dist.snapshots?.runnerUpPrizeTotal) : "-"}</td>
                      <td>{dist ? `${dist.playerRewards?.length || 0} Players` : "-"}</td>
                      <td>{dist ? new Date(dist.distributedAt).toLocaleDateString() : "-"}</td>
                      <td>
                        <span className={`status ${dist ? "approved" : "pending"}`} style={{ textTransform: "capitalize" }}>
                          {dist ? "Distributed" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleManualDistribute(t._id)}
                          disabled={!!dist || actionLoadingId === t._id}
                          className="refresh-btn-premium"
                          style={{
                            padding: "6px 12px",
                            fontSize: "12px",
                            opacity: dist ? 0.5 : 1,
                            cursor: dist ? "not-allowed" : "pointer"
                          }}
                        >
                          {actionLoadingId === t._id ? "Processing..." : (dist ? "Distributed" : "Distribute Prize")}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {tournaments.filter(t => t.status === "completed").length === 0 && (
                  <tr>
                    <td colSpan="11" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>
                      No completed tournaments recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </main>
    </motion.div>
  );
}
