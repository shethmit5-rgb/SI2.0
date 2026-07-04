import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import "../static/home.css";
import { useAuth } from "../context/AuthContext";
import SkeletonCard from "../components/loading/SkeletonCard";
import SkeletonStats from "../components/loading/SkeletonStats";
import { motion } from "framer-motion";
import ThreeBgCanvas from "../components/ThreeBgCanvas";
import TiltCard from "../components/TiltCard";

function AnimatedCounter({ value, duration = 1200 }) {
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
      start += Math.ceil(end / 45);
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

export default function Home() {
  const [stats, setStats] = useState({
    tournaments: 0,
    teams: 0,
    matches: 0,
    players: 0,
  });

  const { user } = useAuth();
  const [featuredTournaments, setFeaturedTournaments] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const tournamentsRes = await api.get("/tournaments/public");
        const tournaments = tournamentsRes.data;

        setStats((prev) => ({
          ...prev,
          tournaments: tournaments.length,
        }));

        const featured = tournaments
          .filter((t) => ["upcoming", "ongoing"].includes(t.status))
          .slice(0, 3);
        setFeaturedTournaments(featured);

        try {
          const matchesRes = await api.get("/matches/public/upcoming");
          setUpcomingMatches(matchesRes.data.slice(0, 5));
          setStats((prev) => ({
            ...prev,
            matches: matchesRes.data.length,
          }));
        } catch {
          setUpcomingMatches([]);
        }

        try {
          const teamsRes = await api.get("/teams/public");
          setStats((prev) => ({
            ...prev,
            teams: teamsRes.data.length,
          }));
        } catch {
          setStats((prev) => ({ ...prev, teams: 0 }));
        }

        try {
          const usersRes = await api.get("/users/public");
          const players = usersRes.data.filter((u) => u.role === "player");
          setStats((prev) => ({
            ...prev,
            players: players.length,
          }));
        } catch {
          setStats((prev) => ({ ...prev, players: 0 }));
        }
      } catch (err) {
        console.error("Failed to fetch home data:", err);
        setStats({
          tournaments: 0,
          teams: 0,
          matches: 0,
          players: 0,
        });
        setFeaturedTournaments([]);
        setUpcomingMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return (
      <div className="home-container" style={{ padding: "40px 20px" }}>
        {/* Mock Hero */}
        <div className="skeleton-glass-card" style={{ height: "350px", marginBottom: "40px" }} />
        
        {/* Mock Stats */}
        <SkeletonStats count={4} style={{ marginBottom: "40px" }} />
        
        {/* Mock Tournaments */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
          <SkeletonCard height="240px" />
          <SkeletonCard height="240px" />
          <SkeletonCard height="240px" />
        </div>
      </div>
    );
  }

  // Animation Variants for orchestrated entrance
  const revealContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemFadeUp = {
    hidden: { opacity: 0, y: 35 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 80, damping: 14 },
    },
  };

  return (
    <div className="sports-event-page perspective-viewport">
      {/* HERO SECTION WITH 3D CANVAS */}
      <section className="hero clean-hero" style={{ position: "relative", overflow: "hidden" }}>
        {/* Animated Three.js Particle and Geometry Background */}
        <ThreeBgCanvas />

        <div className="overlay" style={{ background: "linear-gradient(180deg, rgba(10, 15, 31, 0.45) 0%, rgba(10, 15, 31, 0.75) 100%)", zIndex: 2 }}></div>
        
        <motion.div 
          className="hero-content"
          variants={revealContainer}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 3 }}
        >
          <div className="hero-glass-card">
            <motion.div className="hero-badge" variants={itemFadeUp}>
              🏆 Next-Gen Collegiate Tournaments
            </motion.div>
            <motion.h1 className="fade-up" variants={itemFadeUp}>
              Elevate Your Game With <br />
              <span className="highlight" style={{
                background: "linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>ArenaSync Platform</span>
            </motion.h1>
            <motion.p className="fade-up" variants={itemFadeUp}>
              Host premium athletic brackets, recruit elite team rosters, coordinate matches schedules, and secure sponsorship funding dynamically.
            </motion.p>

            <motion.div className="hero-buttons" variants={itemFadeUp}>
              <Link to="/events" className="primary-btn light-sweep-wrapper">
                Browse Events 🏆
              </Link>
              <Link to="/register" className="secondary-btn light-sweep-wrapper">
                Register Athlete 👥
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* STATS SECTION WITH PERSPECTIVE TILT */}
      <motion.section 
        className="stats-section"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}
      >
        <TiltCard className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-number">
            <AnimatedCounter value={stats.tournaments} />+
          </div>
          <div className="stat-label">Active Tournaments</div>
        </TiltCard>

        <TiltCard className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-number">
            <AnimatedCounter value={stats.teams} />+
          </div>
          <div className="stat-label">Registered Teams</div>
        </TiltCard>

        <TiltCard className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-number">
            <AnimatedCounter value={stats.matches} />+
          </div>
          <div className="stat-label">Matches Played</div>
        </TiltCard>

        <TiltCard className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-number">
            <AnimatedCounter value={stats.players} />+
          </div>
          <div className="stat-label">Active Players</div>
        </TiltCard>
      </motion.section>

      {/* FEATURED TOURNAMENTS WITH INDIVIDUAL 3D TILTS */}
      <section className="tournaments-section">
        <div className="section-header">
          <h2>🔥 FEATURED TOURNAMENTS</h2>
          <Link to="/events" className="view-all">
            View All →
          </Link>
        </div>

        <motion.div 
          className="tournament-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          variants={revealContainer}
        >
          {featuredTournaments.length > 0 ? (
            featuredTournaments.map((t) => (
              <motion.div key={t._id} variants={itemFadeUp}>
                <TiltCard className="tournament-card" style={{ height: "100%", padding: 0 }}>
                  <div className="tournament-image">
                    {t.logo ? (
                      <img src={t.logo} alt={t.eventName} />
                    ) : (
                      <div className="default-image">🏆</div>
                    )}
                    <span className={`status-badge ${t.status}`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="tournament-details" style={{ padding: "20px" }}>
                    <h3>{t.eventName}</h3>
                    <p className="sport">{t.sportId?.name}</p>

                    <div className="tournament-meta">
                      <span>
                        📅 {new Date(t.startDate).toLocaleDateString()}
                      </span>
                      <span>👥 {t.teams?.length || 0} teams</span>
                    </div>

                    <div className="tournament-prize">
                      🏆 Prize Pool: ₹{t.prizePool?.toLocaleString() || 0}
                    </div>

                    <Link
                      to={`/tournament/${t._id}`}
                      className="btn-outline light-sweep-wrapper"
                      style={{ display: "block", textAlign: "center", marginTop: "15px" }}
                    >
                      View Details
                    </Link>
                  </div>
                </TiltCard>
              </motion.div>
            ))
          ) : (
            <p className="no-data">No tournaments available</p>
          )}
        </motion.div>
      </section>

      {/* UPCOMING MATCHES STAGGER LIST */}
      <section className="matches-section">
        <h2>📅 UPCOMING MATCHES</h2>

        <motion.div 
          className="matches-list"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={revealContainer}
        >
          {upcomingMatches.length > 0 ? (
            upcomingMatches.map((m) => (
              <motion.div key={m._id} className="match-card" variants={itemFadeUp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="match-teams">
                  <span className="team">
                    {m.teams?.[0]?.teamName || "TBD"}
                  </span>
                  <span className="vs">VS</span>
                  <span className="team">
                    {m.teams?.[1]?.teamName || "TBD"}
                  </span>
                </div>

                <div className="match-info">
                  <span>🏟️ {m.venueId?.name}</span>
                  <span>
                    📅 {new Date(m.matchDate).toLocaleString()}
                  </span>
                  <span className={`status ${m.status}`}>
                    {m.status}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="no-data">No upcoming matches</p>
          )}
        </motion.div>
      </section>

      {/* CALL TO ACTION SECTION */}
      {!user && (
        <motion.section 
          className="cta-section"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 60, damping: 15 }}
        >
          <div className="cta-content">
            <h2>READY TO COMPETE?</h2>
            <p>
              Join {stats.players}+ athletes and {stats.teams}+ teams already on our platform
            </p>

            <div className="cta-buttons">
              <Link to="/register" className="cta-primary light-sweep-wrapper">
                Create Account
              </Link>
              <Link to="/events" className="cta-secondary light-sweep-wrapper">
                Browse Tournaments
              </Link>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}