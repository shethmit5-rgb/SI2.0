import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { loadRazorpayScript, verifyTournamentPayment, getRazorpayKey } from "../services/paymentService";
import "../static/MyTournaments.css";

export default function MyTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMyTournaments();
  }, []);

  const fetchMyTournaments = async () => {
    try {
      const res = await api.get("/tournaments/my-tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteTournament = async (id, name) => {
    if (!window.confirm(`⚠️ Delete "${name}"?\n\nThis action cannot be undone.`)) return;
    try {
      await api.delete(`/tournaments/${id}`);
      alert("✅ Tournament deleted successfully");
      fetchMyTournaments();
    } catch (err) {
      alert("Failed to delete tournament");
    }
  };

  const handlePayFee = async (tournament) => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay SDK failed to load. Are you online?");
        return;
      }

      const keyRes = await getRazorpayKey();
      const options = {
        key: keyRes.key,
        amount: 50000 * 100, // paise
        currency: "INR",
        name: "Tournament Creation Fee",
        description: "Pay fee to create tournament",
        order_id: tournament.razorpayOrderId,
        handler: async (paymentRes) => {
          setLoading(true);
          try {
            const verifyRes = await verifyTournamentPayment({
              razorpay_order_id: paymentRes.razorpay_order_id,
              razorpay_payment_id: paymentRes.razorpay_payment_id,
              razorpay_signature: paymentRes.razorpay_signature,
              transactionId: tournament._id,
            });
            if (verifyRes.success) {
              alert("✅ Tournament created and activated successfully!");
              fetchMyTournaments();
            } else {
              alert("❌ Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: "",
          email: "",
        },
        theme: {
          color: "#6366f1",
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Pay fee error:", err);
      alert("Failed to initiate payment");
    }
  };

  const exportToCSV = () => {
    const headers = ["Event Name", "Sport", "Status", "Teams", "Prize Pool", "Start Date", "End Date"];
    const data = tournaments.map(t => [
      t.eventName,
      t.sportId?.name || "N/A",
      t.status,
      t.teams?.length || 0,
      t.prizePool || 0,
      new Date(t.startDate).toLocaleDateString(),
      new Date(t.endDate).toLocaleDateString()
    ]);
    
    const csvContent = [headers, ...data].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_tournaments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case "upcoming": return "#f59e0b";
      case "ongoing": return "#10b981";
      case "completed": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const filteredTournaments = tournaments.filter(t => {
    if (filter !== "all" && t.status !== filter) return false;
    if (searchTerm && !t.eventName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="loading">Loading your tournaments...</div>;

  return (
    <div className="my-tournaments-page">
      <div className="page-header">
        <div>
          <h1>🏆 My Tournaments</h1>
          <p>Manage and track tournaments you've created</p>
        </div>
        <div className="header-actions">
          <button onClick={exportToCSV} className="export-btn" disabled={tournaments.length === 0}>
            📥 Export CSV
          </button>
          <Link to="/create-tournament" className="create-btn">+ Create Tournament</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search tournaments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
          <button onClick={() => setFilter("upcoming")} className={filter === "upcoming" ? "active" : ""}>📅 Upcoming</button>
          <button onClick={() => setFilter("ongoing")} className={filter === "ongoing" ? "active" : ""}>🔥 Ongoing</button>
          <button onClick={() => setFilter("completed")} className={filter === "completed" ? "active" : ""}>✅ Completed</button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Found <strong>{filteredTournaments.length}</strong> tournament{filteredTournaments.length !== 1 ? 's' : ''}
      </div>

      {filteredTournaments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h3>No tournaments found</h3>
          <p>{searchTerm || filter !== "all" ? "Try adjusting your search or filters" : "You haven't created any tournaments yet"}</p>
          {!searchTerm && filter === "all" && (
            <Link to="/create-tournament" className="create-first-btn">Create Your First Tournament</Link>
          )}
        </div>
      ) : (
        <div className="tournaments-grid">
          {filteredTournaments.map(tournament => (
            <div key={tournament._id} className="tournament-card">
              <div className="card-header">
                <div className="card-title">
                  <h3>{tournament.eventName}</h3>
                  {tournament.paymentStatus === "Pending" ? (
                    <span className="status-badge" style={{ backgroundColor: "#ef4444" }}>
                      💳 Pending Payment
                    </span>
                  ) : (
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(tournament.status) }}>
                      {tournament.status === "upcoming" && "📅"}
                      {tournament.status === "ongoing" && "🔥"}
                      {tournament.status === "completed" && "✅"} {tournament.status}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="card-details">
                <div className="detail-item">
                  <span className="detail-icon">⚽</span>
                  <div>
                    <label>Sport</label>
                    <p>{tournament.sportId?.name || "N/A"}</p>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">👥</span>
                  <div>
                    <label>Teams Registered</label>
                    <p>{tournament.teams?.length || 0}</p>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">💰</span>
                  <div>
                    <label>Prize Pool</label>
                    <p>₹{tournament.prizePool?.toLocaleString() || 0}</p>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <div>
                    <label>Dates</label>
                    <p>{new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="card-actions">
                {tournament.paymentStatus === "Pending" && (
                  <button onClick={() => handlePayFee(tournament)} className="pay-btn" style={{ backgroundColor: "#10b981", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                    💳 Pay Fee
                  </button>
                )}
                <Link to={`/tournament/${tournament._id}`} className="view-btn">View Details</Link>
                <Link to={`/edit-tournament/${tournament._id}`} className="edit-btn">Edit</Link>
                <button onClick={() => deleteTournament(tournament._id, tournament.eventName)} className="delete-btn">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}