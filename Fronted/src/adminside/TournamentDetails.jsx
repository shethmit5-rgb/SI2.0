import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./TournamentDetails.css";
import SkeletonTournament from "../components/loading/SkeletonTournament";

export default function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const fetchTournament = async () => {
    try {
      // ✅ FIXED: Use public endpoint to get tournament details
      const res = await axios.get(`http://localhost:5000/api/tournaments/public/${id}`);
      setTournament(res.data);
    } catch (err) {
      console.error("Failed to fetch tournament:", err);
      alert("Failed to load tournament details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this tournament?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/tournaments/${id}`, auth);
      alert("Tournament deleted successfully!");
      navigate("/admin/tournaments");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete tournament");
    }
  };

  // Custom button styles
  const buttonStyles = {
    back: {
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      marginRight: "10px",
    },
    edit: {
      backgroundColor: "#f59e0b",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
      marginRight: "10px",
    },
    delete: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
      fontWeight: "500",
    },
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case "upcoming":
        return { backgroundColor: "#f59e0b", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "inline-block" };
      case "ongoing":
        return { backgroundColor: "#10b981", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "inline-block" };
      case "completed":
        return { backgroundColor: "#6b7280", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "inline-block" };
      default:
        return { backgroundColor: "#6b7280", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold", display: "inline-block" };
    }
  };

  if (loading) {
    return <SkeletonTournament />;
  }

  if (!tournament) {
    return (
      <div className="error-container">
        <h2>Tournament Not Found</h2>
        <button 
          style={buttonStyles.back}
          onClick={() => navigate("/admin/tournaments")}
        >
          ← Back to Tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="tournament-details-container">
      <div className="details-header">
        <h1>{tournament.eventName}</h1>
        <div className="button-group">
          <button 
            style={buttonStyles.back}
            onClick={() => navigate("/admin/tournaments")}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#4b5563"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#6b7280"}
          >
            ← Back
          </button>
          <button 
            style={buttonStyles.edit}
            onClick={() => navigate(`/admin/tournament/edit/${id}`)}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#d97706"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#f59e0b"}
          >
            ✏️ Edit
          </button>
          <button 
            style={buttonStyles.delete}
            onClick={handleDelete}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="details-content">
        <div className="info-section">
          <div className="info-card">
            <h3>Sport</h3>
            <p>{tournament.sportId?.name || "N/A"}</p>
          </div>
          <div className="info-card">
            <h3>Status</h3>
            <span style={getStatusStyle(tournament.status)}>
              {tournament.status || "upcoming"}
            </span>
          </div>
          <div className="info-card">
            <h3>Location</h3>
            <p>{tournament.location || "TBD"}</p>
          </div>
          <div className="info-card">
            <h3>Prize Pool</h3>
            <p>₹{tournament.prizePool?.toLocaleString() || 0}</p>
          </div>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>Start Date</h3>
            <p>{new Date(tournament.startDate).toLocaleDateString()}</p>
          </div>
          <div className="info-card">
            <h3>End Date</h3>
            <p>{new Date(tournament.endDate).toLocaleDateString()}</p>
          </div>
          <div className="info-card">
            <h3>Max Participants</h3>
            <p>{tournament.maxParticipants || "Unlimited"}</p>
          </div>
          <div className="info-card">
            <h3>Teams Registered</h3>
            <p>{tournament.teams?.length || 0}</p>
          </div>
        </div>

        {tournament.description && (
          <div className="description-section">
            <h3>Description</h3>
            <p>{tournament.description}</p>
          </div>
        )}

        {tournament.rules && (
          <div className="rules-section">
            <h3>Rules & Guidelines</h3>
            <p>{tournament.rules}</p>
          </div>
        )}
      </div>
    </div>
  );
}