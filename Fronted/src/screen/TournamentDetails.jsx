import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/TournamentDetails.css";

export default function TournamentDetails() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isCoachOrAdmin = user?.role === "coach" || user?.role === "admin" || user?.role === "organizer";

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [userTeam, setUserTeam] = useState(null);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const fetchTournamentData = async () => {
    setLoading(true);
    try {
      // Fetch tournament details - using public endpoint for better access
      let tournamentRes;
      try {
        tournamentRes = await api.get(`/tournaments/public/${id}`);
      } catch {
        tournamentRes = await api.get(`/tournaments/${id}`);
      }
      setTournament(tournamentRes.data);

      // Fetch teams in this tournament
      const teamsRes = await api.get(`/teams/tournament/${id}`);
      setTeams(teamsRes.data);

      // Fetch matches - try public endpoint first
      let matchesRes;
      try {
        matchesRes = await api.get(`/matches/public/tournament/${id}`);
      } catch {
        matchesRes = await api.get(`/matches/tournament/${id}`);
      }
      setMatches(matchesRes.data);

      // Fetch sponsors
      const sponsorsRes = await api.get(`/sponsors/public/tournament/${id}`);
      setSponsors(sponsorsRes.data || []);

      // If user is logged in, check their team and registration
      if (user) {
        // Check if user has a team in this tournament
        const userTeamsRes = await api.get("/teams/my-teams");
        const userTeamInTournament = userTeamsRes.data.find(
          t => t.tournamentId?._id === id || t.tournamentId === id
        );
        setUserTeam(userTeamInTournament);

        // Check registration status
        if (userTeamInTournament) {
          try {
            const regRes = await api.get(`/registrations/check/${id}/${userTeamInTournament._id}`);
            setRegistration(regRes.data);
          } catch (err) {
            console.log("No registration found");
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch tournament data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate("/login");
      return;
    }

    setRegistering(true);
    try {
      let teamId = userTeam?._id;

      // 🔥 IF NO TEAM → CREATE TEAM AUTOMATICALLY
      if (!teamId) {
        const teamRes = await api.post("/teams", {
          teamName: `${user.name}'s Team`,
          tournamentId: id,
          sportId: tournament.sportId?._id,
        });
        teamId = teamRes.data._id;
      }

      // 🔥 REGISTER TEAM
      await api.post("/registrations", {
        tournamentId: id,
        teamId,
      });

      alert("✅ Team registered successfully! Waiting for admin approval.");
      fetchTournamentData(); // refresh

    } catch (err) {
      console.error("Registration error:", err);
      alert(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "upcoming": return "#f59e0b";
      case "ongoing": return "#10b981";
      case "completed": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getMatchStatusColor = (status) => {
    switch(status) {
      case "scheduled": return "#f59e0b";
      case "live": return "#ef4444";
      case "completed": return "#10b981";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading tournament details...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="error-container">
        <h2>❌ Tournament Not Found</h2>
        <p>The tournament you're looking for doesn't exist or has been removed.</p>
        <Link to="/tournaments" className="back-btn">Browse Tournaments</Link>
      </div>
    );
  }

  return (
    <div className="tournament-details-page">
      {/* Hero Section */}
      <div className="tournament-hero">
        <div className="hero-content">
          {/* Tournament Logo */}
          {tournament.logo && (
            <div className="tournament-logo">
              <img src={tournament.logo} alt={tournament.eventName} />
            </div>
          )}

          {/* TITLE + SUBTITLE */}
          <h1>{tournament.eventName}</h1>
          <p className="hero-sub">
            {tournament.description?.slice(0, 100) || "Compete, win prizes, and become a champion 🏆"}
          </p>

          {/* BADGES */}
          <div className="tournament-badges">
            <span className="sport-badge">
              🏅 {tournament.sportId?.name}
            </span>

            <span
              className="status-badge"
              style={{ backgroundColor: getStatusColor(tournament.status) }}
            >
              {tournament.status === "upcoming" && "📅 Upcoming"}
              {tournament.status === "ongoing" && "🔥 Ongoing"}
              {tournament.status === "completed" && "✅ Completed"}
            </span>
          </div>

          {/* REGISTRATION CTA */}
          {tournament.status === "upcoming" && (
            <div className="registration-cta">
              {!user ? (
                <Link to="/login" className="register-btn">
                  🔐 Login to Participate
                </Link>
              ) : isCoachOrAdmin ? (
                registration ? (
                  <div className="registration-status">
                    <span 
                      className={`reg-status-badge ${registration.approvalStatus}`}
                      style={{
                        backgroundColor: registration.approvalStatus === "approved" ? "#10b981" : 
                                       registration.approvalStatus === "pending" ? "#f59e0b" : "#ef4444"
                      }}
                    >
                      {registration.approvalStatus === "approved" && "✅ Approved"}
                      {registration.approvalStatus === "pending" && "⏳ Pending Approval"}
                      {registration.approvalStatus === "rejected" && "❌ Rejected"}
                    </span>
                    {registration.approvalStatus === "pending" && (
                      <p>Your registration is waiting for admin approval</p>
                    )}
                    {registration.approvalStatus === "approved" && (
                      <p>Your team is registered! Check the schedule for match timings.</p>
                    )}
                    {registration.approvalStatus === "rejected" && (
                      <p>Your registration was rejected. Please contact the organizer.</p>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleRegister} 
                    className="register-btn"
                    disabled={registering}
                  >
                    {registering ? "⏳ Registering..." : "🚀 Register Your Team"}
                  </button>
                )
              ) : (
                <p className="player-notice">Players can join teams from the Teams tab below.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="tournament-content">
        {/* Tabs */}
        <div className="content-tabs">
          <button 
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📋 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === "teams" ? "active" : ""}`}
            onClick={() => setActiveTab("teams")}
          >
            👥 Teams ({teams.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "matches" ? "active" : ""}`}
            onClick={() => setActiveTab("matches")}
          >
            ⚽ Matches ({matches.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === "sponsors" ? "active" : ""}`}
            onClick={() => setActiveTab("sponsors")}
          >
            🤝 Sponsors ({sponsors.length})
          </button>
        </div>

        {/* Tab Panels */}
        <div className="tab-panel">
          {activeTab === "overview" && (
            <div className="overview-panel">
              <div className="info-grid">
                <div className="info-card">
                  <h3>📅 Dates</h3>
                  <p><strong>Start:</strong> {new Date(tournament.startDate).toLocaleDateString()}</p>
                  <p><strong>End:</strong> {new Date(tournament.endDate).toLocaleDateString()}</p>
                  <p><strong>Duration:</strong> {
                    Math.ceil((new Date(tournament.endDate) - new Date(tournament.startDate)) / (1000 * 60 * 60 * 24))
                  } days</p>
                </div>

                <div className="info-card">
                  <h3>📍 Location</h3>
                  <p>{tournament.location || "TBD"}</p>
                  {tournament.venueId && <p className="venue-name">🏟️ {tournament.venueId.name}</p>}
                </div>

                <div className="info-card">
                  <h3>👥 Participants</h3>
                  <p>{teams.length} / {tournament.maxParticipants || "∞"} Teams</p>
                  <p className="small-text">Register your team before slots fill up!</p>
                </div>

                <div className="info-card">
                  <h3>🏆 Prize Pool</h3>
                  <p className="prize-amount">₹{tournament.prizePool?.toLocaleString() || 0}</p>
                </div>
              </div>

              {tournament.description && tournament.description !== "No description available." && (
                <div className="description-section">
                  <h3>📖 About the Tournament</h3>
                  <p>{tournament.description}</p>
                </div>
              )}

              {tournament.rules && tournament.rules !== "No rules specified." && (
                <div className="rules-section">
                  <h3>📜 Rules & Guidelines</h3>
                  <div className="rules-content">
                    {tournament.rules.split('\n').map((rule, index) => (
                      <p key={index}>{rule}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "teams" && (
            <div className="teams-panel">
              <h2>📋 Registered Teams</h2>
              {teams.length > 0 ? (
                <div className="teams-grid">
                  {teams.map(team => (
                    <div key={team._id} className="team-card">
                      <div className="team-card-header">
                        <h3>{team.teamName}</h3>
                        {userTeam?._id === team._id && <span className="your-team-badge">Your Team</span>}
                      </div>
                      <p className="captain">👑 Captain: {team.captainId?.name}</p>
                      <p className="players">👥 {team.players?.filter(p => p.status === "approved").length || 0} Players</p>
                      <Link to={`/team/${team._id}`} className="view-team-btn">
                        View Team →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">
                  <p>🚫 No teams registered yet</p>
                  {tournament.status === "upcoming" && (
                    <button onClick={handleRegister} className="be-first-btn">
                      Be the first to register!
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "matches" && (
            <div className="matches-panel">
              <h2>⚽ Match Schedule</h2>
              {matches.length > 0 ? (
                <div className="matches-list">
                  {matches.map(match => (
                    <div key={match._id} className="match-card">
                      <div className="match-teams">
                        <span className="team">{match.teams?.[0]?.teamName || "TBD"}</span>
                        <span className="vs">VS</span>
                        <span className="team">{match.teams?.[1]?.teamName || "TBD"}</span>
                      </div>
                      <div className="match-details">
                        <p>📅 {match.matchDate ? new Date(match.matchDate).toLocaleString() : "TBD"}</p>
                        <p>🏟️ {match.venueId?.name || "TBD"}</p>
                        <span 
                          className={`match-status ${match.status}`}
                          style={{ backgroundColor: getMatchStatusColor(match.status) }}
                        >
                          {match.status === "scheduled" && "📅 Scheduled"}
                          {match.status === "live" && "🔴 LIVE"}
                          {match.status === "completed" && "✅ Completed"}
                        </span>
                      </div>
                      {match.status === "completed" && match.result?.score && (
                        <div className="match-result">
                          🏆 Result: {match.result.score}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">🚫 No matches scheduled yet</p>
              )}
            </div>
          )}

          {activeTab === "sponsors" && (
            <div className="sponsors-panel">
              <h2>🤝 Our Sponsors</h2>
              {sponsors.length > 0 ? (
                <div className="sponsors-grid">
                  {sponsors.map(sponsor => (
                    <div key={sponsor._id} className="sponsor-card">
                      {sponsor.logo ? (
                        <img src={sponsor.logo} alt={sponsor.name} />
                      ) : (
                        <div className="sponsor-placeholder">🏢</div>
                      )}
                      <h3>{sponsor.name}</h3>
                      <p className="sponsor-amount">💰 ₹{sponsor.amount?.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">🚫 No sponsors yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}