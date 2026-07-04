import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/TournamentDetails.css";
import { loadRazorpayScript, getRazorpayKey } from "../services/paymentService";
import SkeletonTournament from "../components/loading/SkeletonTournament";

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
  const [distribution, setDistribution] = useState(null);

  const [showSponsorModal, setShowSponsorModal] = useState(false);
  const [sponsorshipError, setSponsorshipError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [sponsorForm, setSponsorForm] = useState({
    brandName: "",
    type: "title",
    winnerPrize: 100000,
    runnerUpPrize: 50000,
    equipment: "",
    amount: 50000,
  });
  const [sponsorLogoFile, setSponsorLogoFile] = useState(null);

  const [showMockRazorpay, setShowMockRazorpay] = useState(false);
  const [mockRazorpayData, setMockRazorpayData] = useState(null);
  const [mockPaymentForm, setMockPaymentForm] = useState({
    cardNo: "",
    expiry: "",
    cvv: "",
    name: "",
    upiId: "",
    phone: "",
    email: "",
    method: "card",
  });
  const [mockSubmitting, setMockSubmitting] = useState(false);

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

      // Fetch Prize Distribution Details
      try {
        const distRes = await api.get(`/prize-distributions/${id}`);
        setDistribution(distRes.data);
      } catch (distErr) {
        console.log("No prize distribution found for this tournament yet.");
      }

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

  const handleSponsorSubmit = async (e) => {
    e.preventDefault();
    setSponsorshipError("");
    setPaymentLoading(true);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      // 2. Load Razorpay Key
      const keyData = await getRazorpayKey();
      if (!keyData || !keyData.key) {
        throw new Error("Payment service configuration missing.");
      }

      // 3. Prepare FormData
      const formData = new FormData();
      formData.append("brandName", sponsorForm.brandName);
      formData.append("tournamentId", id);
      formData.append("type", sponsorForm.type);

      if (sponsorForm.type === "title") {
        formData.append("winnerPrize", sponsorForm.winnerPrize);
        formData.append("runnerUpPrize", sponsorForm.runnerUpPrize);
      } else {
        formData.append("equipment", sponsorForm.equipment);
        formData.append("amount", sponsorForm.amount);
      }

      if (sponsorLogoFile) {
        formData.append("logo", sponsorLogoFile);
      } else {
        throw new Error("Brand logo image is required.");
      }

      // 4. Create Order on Backend
      const orderRes = await api.post("/sponsors/self-sponsor", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!orderRes.data.success) {
        throw new Error(orderRes.data.message || "Failed to initiate sponsorship.");
      }

      const { order, sponsorId } = orderRes.data;

      // Check if it's a mock order (starts with order_mock_) or if we use local/dummy key
      const isDummyKey = !keyData.key || keyData.key.includes("xxxx") || order.id.startsWith("order_mock_");
      if (isDummyKey) {
        setMockRazorpayData({
          order,
          sponsorId,
          amount: totalAmount,
          brandName: sponsorForm.brandName,
          type: sponsorForm.type
        });
        setMockPaymentForm({
          cardNo: "",
          expiry: "",
          cvv: "",
          name: user?.name || "",
          upiId: "",
          phone: user?.phoneNumber || "",
          email: user?.email || "",
          method: "card"
        });
        setPaymentLoading(false);
        setShowMockRazorpay(true);
        return;
      }

      // 5. Open Razorpay Modal
      const options = {
        key: keyData.key,
        amount: order.amount,
        currency: order.currency,
        name: sponsorForm.brandName,
        description: `Tournament ${sponsorForm.type === "title" ? "Title" : "In-Kind"} Sponsorship`,
        image: tournament.logo || "",
        order_id: order.id,
        handler: async function (response) {
          try {
            setPaymentLoading(true);
            const verifyRes = await api.post("/sponsors/verify-self-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              sponsorId,
            });

            if (verifyRes.data.success) {
              alert("🎉 Sponsorship active! Thank you for your support.");
              setShowSponsorModal(false);
              setSponsorForm({
                brandName: "",
                type: "title",
                winnerPrize: 100000,
                runnerUpPrize: 50000,
                equipment: "",
                amount: 50000,
              });
              setSponsorLogoFile(null);
              fetchTournamentData();
            } else {
              setSponsorshipError(verifyRes.data.message || "Verification failed.");
            }
          } catch (verifyErr) {
            console.error("Verification error:", verifyErr);
            setSponsorshipError(verifyErr.response?.data?.message || "Payment verification failed.");
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
            setSponsorshipError("Payment window was closed.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error("Sponsorship submit error:", err);
      setSponsorshipError(err.response?.data?.message || err.message || "Failed to process sponsorship.");
      setPaymentLoading(false);
    }
  };

  const handleMockPaymentSubmit = async (e) => {
    e.preventDefault();
    setSponsorshipError("");
    setMockSubmitting(true);

    try {
      // Simulate network request delay of 1.5 seconds
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const verifyRes = await api.post("/sponsors/verify-self-payment", {
        razorpay_order_id: mockRazorpayData.order.id,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: "mock_signature",
        sponsorId: mockRazorpayData.sponsorId,
      });

      if (verifyRes.data.success) {
        alert("🎉 Sponsorship active! Thank you for your support.");
        setShowMockRazorpay(false);
        setShowSponsorModal(false);
        setSponsorForm({
          brandName: "",
          type: "title",
          winnerPrize: 100000,
          runnerUpPrize: 50000,
          equipment: "",
          amount: 50000,
        });
        setSponsorLogoFile(null);
        fetchTournamentData();
      } else {
        setSponsorshipError(verifyRes.data.message || "Payment verification failed.");
      }
    } catch (err) {
      console.error("Mock payment error:", err);
      setSponsorshipError(err.response?.data?.message || err.message || "Payment failed.");
    } finally {
      setMockSubmitting(false);
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
    return <SkeletonTournament />;
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
          {tournament.titleSponsorLogo && (
            <div className="title-sponsor-brand">
              <span className="sponsored-by-lbl">Sponsored By:</span>
              <img src={tournament.titleSponsorLogo} alt="Title Sponsor" className="title-sponsor-logo-hero" />
            </div>
          )}
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
              {user?.role === "sponsor" ? (
                new Date() >= new Date(tournament.startDate) ? (
                  <div className="sponsorship-closed-msg" style={{ color: "#ef4444", fontWeight: 600, padding: "10px", backgroundColor: "rgba(239, 68, 68, 0.1)", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                    🚫 Sponsorship is closed because the tournament has already started.
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setSponsorshipError("");
                      setShowSponsorModal(true);
                    }} 
                    className="sponsor-btn-cta"
                  >
                    🤝 Sponsor This Event
                  </button>
                )
              ) : !user ? (
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

              {/* Sponsorship & Prize Distribution Details (Read-only) */}
              {distribution && (
                <div className="description-section" style={{ marginTop: "24px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "20px" }}>
                  <h3 style={{ display: "flex", alignItems: "center", gap: "8px", margin: "0 0 16px 0", color: "var(--text)" }}>🏆 Sponsored Prize Details</h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Sponsored By</p>
                      {distribution.brandName ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {distribution.brandLogo && (
                            <img src={distribution.brandLogo} alt={distribution.brandName} style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                          )}
                          <strong style={{ fontSize: "14px", color: "var(--text)" }}>{distribution.brandName}</strong>
                        </div>
                      ) : (
                        <strong style={{ fontSize: "14px", color: "var(--text-secondary)" }}>No Active Title Sponsor</strong>
                      )}
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Winner Team Prize</p>
                      <strong style={{ fontSize: "14px", color: "var(--success)" }}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(distribution.winnerPrizeTotal || 0)}
                      </strong>
                    </div>
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Runner-Up Team Prize</p>
                      <strong style={{ fontSize: "14px", color: "var(--success)" }}>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(distribution.runnerUpPrizeTotal || 0)}
                      </strong>
                    </div>
                    {distribution.distributed && (
                      <>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Winner Team</p>
                          <strong style={{ fontSize: "14px", color: "var(--text)" }}>{distribution.winnerTeam}</strong>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Runner-Up Team</p>
                          <strong style={{ fontSize: "14px", color: "var(--text)" }}>{distribution.runnerUpTeam}</strong>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Players Rewarded</p>
                          <strong style={{ fontSize: "14px", color: "var(--text)" }}>{distribution.playersRewardedCount} Players</strong>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Distribution Date</p>
                          <strong style={{ fontSize: "14px", color: "var(--text)" }}>{new Date(distribution.distributedAt).toLocaleDateString()}</strong>
                        </div>
                        <div>
                          <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Distribution ID</p>
                          <strong style={{ fontSize: "14px", color: "var(--text)", fontFamily: "monospace" }}>{distribution.distributionId}</strong>
                        </div>
                      </>
                    )}
                    <div>
                      <p style={{ margin: "0 0 4px 0", fontSize: "11px", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>Prize Distribution Status</p>
                      <strong style={{ fontSize: "14px", color: distribution.distributed ? "var(--success)" : "var(--primary)" }}>
                        {distribution.distributed ? "Completed" : "Pending completion"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

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

              {tournament.activeSponsorships && tournament.activeSponsorships.length > 0 && (
                <div className="overview-sponsors-section">
                  <h3>🤝 Tournament Sponsors</h3>
                  <div className="overview-sponsors-logos">
                    {tournament.activeSponsorships.map((s) => (
                      <div key={s._id} className="overview-sponsor-logo-card">
                        {s.logo ? <img src={s.logo} alt={s.name} /> : <span>🏢</span>}
                        <span>{s.name} ({s.type === "title" ? "Title Sponsor" : `In-Kind: ${s.equipment}`})</span>
                      </div>
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
                        <img src={sponsor.logo} alt={sponsor.name} style={{ maxHeight: "80px", objectFit: "contain", margin: "0 auto 15px auto", display: "block" }} />
                      ) : (
                        <div className="sponsor-placeholder">🏢</div>
                      )}
                      <h3>{sponsor.name}</h3>
                      {sponsor.type === "title" && (
                        <span className="sponsor-type-tag" style={{ display: "inline-block", padding: "4px 10px", borderRadius: "12px", backgroundColor: "#fef3c7", color: "#d97706", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>Title Sponsor</span>
                      )}
                      {sponsor.type === "inkind" && (
                        <span className="sponsor-type-tag" style={{ display: "inline-block", padding: "4px 10px", borderRadius: "12px", backgroundColor: "#dbeafe", color: "#2563eb", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>In-Kind: {sponsor.equipment}</span>
                      )}
                      <p className="sponsor-amount" style={{ fontWeight: 600, color: "#10b981" }}>💰 ₹{sponsor.amount?.toLocaleString()}</p>
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

      {showSponsorModal && (
        <div className="sponsor-modal-overlay">
          <div className="sponsor-modal">
            <div className="sponsor-modal-header">
              <h2>Sponsor This Event</h2>
              <button className="close-btn" onClick={() => setShowSponsorModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSponsorSubmit} className="sponsor-form-content">
              {sponsorshipError && (
                <div className="error-message-box">
                  {sponsorshipError}
                </div>
              )}

              <div className="form-group">
                <label>Sponsorship Type</label>
                <div className="type-options">
                  <label className="type-option">
                    <input 
                      type="radio" 
                      name="type" 
                      value="title" 
                      checked={sponsorForm.type === "title"} 
                      onChange={(e) => setSponsorForm({ ...sponsorForm, type: e.target.value })} 
                    />
                    Title Sponsor
                  </label>
                  <label className="type-option">
                    <input 
                      type="radio" 
                      name="type" 
                      value="inkind" 
                      checked={sponsorForm.type === "inkind"} 
                      onChange={(e) => setSponsorForm({ ...sponsorForm, type: e.target.value })} 
                    />
                    In-Kind Sponsor
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Brand Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Brand Name" 
                  value={sponsorForm.brandName} 
                  onChange={(e) => setSponsorForm({ ...sponsorForm, brandName: e.target.value })} 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Brand Logo</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => setSponsorLogoFile(e.target.files[0])} 
                  required 
                />
                <span className="help-text">Upload a high-quality brand logo.</span>
              </div>

              {sponsorForm.type === "title" ? (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Winner Prize (INR)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={sponsorForm.winnerPrize} 
                        onChange={(e) => setSponsorForm({ ...sponsorForm, winnerPrize: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Runner-Up Prize (INR)</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={sponsorForm.runnerUpPrize} 
                        onChange={(e) => setSponsorForm({ ...sponsorForm, runnerUpPrize: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="calculation-details">
                    <p>Total Title Sponsorship Amount (Winner + Runner-Up):</p>
                    <h3>₹{(Number(sponsorForm.winnerPrize || 0) + Number(sponsorForm.runnerUpPrize || 0)).toLocaleString()}</h3>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Equipment Category</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Cricket Bats, Jerseys, Drinks" 
                      value={sponsorForm.equipment} 
                      onChange={(e) => setSponsorForm({ ...sponsorForm, equipment: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Sponsorship Amount (INR)</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={sponsorForm.amount} 
                      onChange={(e) => setSponsorForm({ ...sponsorForm, amount: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="calculation-details">
                    <p>Total In-Kind Sponsorship Amount:</p>
                    <h3>₹{Number(sponsorForm.amount || 0).toLocaleString()}</h3>
                  </div>
                </>
              )}

              <button 
                type="submit" 
                className="pay-now-btn" 
                disabled={paymentLoading}
              >
                {paymentLoading ? "Processing Payment..." : "Complete Sponsorship Payment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showMockRazorpay && mockRazorpayData && (
        <div className="sponsor-modal-overlay" style={{ zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="sponsor-modal" style={{ maxWidth: "420px", padding: 0, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", background: "#1f2937", color: "#f3f4f6" }}>
            {/* Razorpay Mimicking Header */}
            <div style={{ backgroundColor: "#111827", padding: "20px", color: "white", position: "relative", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <button 
                type="button"
                onClick={() => {
                  setShowMockRazorpay(false);
                  setPaymentLoading(false);
                }} 
                style={{ position: "absolute", top: "15px", right: "15px", background: "none", border: "none", color: "#9ca3af", fontSize: "24px", cursor: "pointer", lineHeight: 1 }}
              >
                &times;
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ backgroundColor: "#2563eb", width: "40px", height: "40px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "bold" }}>A</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "white" }}>ArenaSync</h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>{mockRazorpayData.brandName} - {mockRazorpayData.type === "title" ? "Title Sponsor" : "In-Kind Sponsor"}</p>
                </div>
              </div>
              <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "13px", color: "#9ca3af" }}>Sponsorship Amount</span>
                <span style={{ fontSize: "22px", fontWeight: 700, color: "#10b981" }}>₹{mockRazorpayData.amount.toLocaleString()}</span>
              </div>
            </div>

            {/* Razorpay Mimicking Body */}
            {mockSubmitting ? (
              <div style={{ padding: "40px 20px", textAlign: "center" }}>
                <div className="loading-spinner" style={{ margin: "0 auto 20px auto" }}></div>
                <h4 style={{ margin: "0 0 5px 0", color: "#f3f4f6" }}>Processing Payment...</h4>
                <p style={{ fontSize: "13px", color: "#9ca3af", margin: 0 }}>Please do not close this window or refresh the page.</p>
              </div>
            ) : (
              <form onSubmit={handleMockPaymentSubmit} style={{ padding: "20px" }}>
                {sponsorshipError && (
                  <div className="error-message-box" style={{ marginBottom: "15px" }}>
                    {sponsorshipError}
                  </div>
                )}
                
                {/* Prefilled/editable User Details */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>Mobile Number</label>
                    <input 
                      type="text" 
                      value={mockPaymentForm.phone} 
                      onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, phone: e.target.value })} 
                      required 
                      style={{ padding: "8px", fontSize: "13px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1, margin: 0 }}>
                    <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>Email ID</label>
                    <input 
                      type="email" 
                      value={mockPaymentForm.email} 
                      onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, email: e.target.value })} 
                      required 
                      style={{ padding: "8px", fontSize: "13px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                    />
                  </div>
                </div>

                {/* Payment Methods tabs */}
                <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.1)", marginBottom: "15px" }}>
                  <button 
                    type="button"
                    onClick={() => setMockPaymentForm({ ...mockPaymentForm, method: "card" })}
                    style={{ flex: 1, padding: "10px", background: "none", border: "none", borderBottom: mockPaymentForm.method === "card" ? "2px solid #2563eb" : "none", color: mockPaymentForm.method === "card" ? "#2563eb" : "#9ca3af", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                  >
                    💳 Card
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMockPaymentForm({ ...mockPaymentForm, method: "upi" })}
                    style={{ flex: 1, padding: "10px", background: "none", border: "none", borderBottom: mockPaymentForm.method === "upi" ? "2px solid #2563eb" : "none", color: mockPaymentForm.method === "upi" ? "#2563eb" : "#9ca3af", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                  >
                    📱 UPI
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMockPaymentForm({ ...mockPaymentForm, method: "netbanking" })}
                    style={{ flex: 1, padding: "10px", background: "none", border: "none", borderBottom: mockPaymentForm.method === "netbanking" ? "2px solid #2563eb" : "none", color: mockPaymentForm.method === "netbanking" ? "#2563eb" : "#9ca3af", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                  >
                    🏦 Netbanking
                  </button>
                </div>

                {/* Form fields depending on selected method */}
                {mockPaymentForm.method === "card" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>Card Number</label>
                      <input 
                        type="text" 
                        placeholder="4111 1111 1111 1111" 
                        value={mockPaymentForm.cardNo} 
                        onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, cardNo: e.target.value })} 
                        required 
                        style={{ padding: "10px", fontSize: "14px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY" 
                          value={mockPaymentForm.expiry} 
                          onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, expiry: e.target.value })} 
                          required 
                          style={{ padding: "10px", fontSize: "14px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, margin: 0 }}>
                        <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>CVV</label>
                        <input 
                          type="password" 
                          placeholder="123" 
                          maxLength="3"
                          value={mockPaymentForm.cvv} 
                          onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, cvv: e.target.value })} 
                          required 
                          style={{ padding: "10px", fontSize: "14px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                        />
                      </div>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>Cardholder Name</label>
                      <input 
                        type="text" 
                        placeholder="Card Owner Name" 
                        value={mockPaymentForm.name} 
                        onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, name: e.target.value })} 
                        required 
                        style={{ padding: "10px", fontSize: "14px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                      />
                    </div>
                  </div>
                )}

                {mockPaymentForm.method === "upi" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "4px" }}>UPI ID / VPA</label>
                      <input 
                        type="text" 
                        placeholder="e.g. success@upi" 
                        value={mockPaymentForm.upiId} 
                        onChange={(e) => setMockPaymentForm({ ...mockPaymentForm, upiId: e.target.value })} 
                        required 
                        style={{ padding: "10px", fontSize: "14px", width: "100%", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.1)", background: "#374151", color: "white" }}
                      />
                      <span style={{ fontSize: "11px", color: "#9ca3af", marginTop: "4px", display: "block" }}>Enter any test UPI ID to proceed.</span>
                    </div>
                  </div>
                )}

                {mockPaymentForm.method === "netbanking" && (
                  <div style={{ marginBottom: "20px" }}>
                    <label style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 600, color: "#9ca3af", display: "block", marginBottom: "8px" }}>Select Popular Bank</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                      {["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank"].map((bank) => (
                        <label 
                          key={bank} 
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            padding: "10px", 
                            border: "1px solid rgba(255,255,255,0.1)", 
                            borderRadius: "6px", 
                            fontSize: "12px", 
                            cursor: "pointer", 
                            backgroundColor: "#374151" 
                          }}
                        >
                          <input type="radio" name="bank" defaultChecked={bank === "HDFC Bank"} />
                          {bank}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  type="submit" 
                  className="pay-now-btn" 
                  style={{ width: "100%", padding: "14px", fontSize: "16px", backgroundColor: "#2563eb", marginTop: "10px", color: "white" }}
                >
                  Pay ₹{mockRazorpayData.amount.toLocaleString()}
                </button>
                <p style={{ textAlign: "center", fontSize: "11px", color: "#9ca3af", marginTop: "12px", margin: "12px 0 0 0" }}>
                  🔒 Secured by ArenaSync Test Checkout
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}