import React, { useEffect, useState } from "react";
import axios from "axios";
import "./AdminDashboard.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function MatchList() {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editMatch, setEditMatch] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:5000/api/matches", auth);
      setMatches(res.data);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
      alert("Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  // Delete match
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this match?")) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/matches/${id}`, auth);
      alert("✅ Match deleted successfully!");
      fetchMatches();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("❌ Failed to delete match");
    }
  };

  // Update match result
  const handleUpdateResult = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/matches/${editMatch._id}/result`,
        {
          winnerTeamId: editMatch.winnerTeamId,
          score: editMatch.score,
          status: editMatch.status,
        },
        auth
      );
      alert("✅ Match result updated successfully!");
      setShowEditPopup(false);
      fetchMatches();
    } catch (err) {
      console.error("Update failed:", err);
      alert("❌ Failed to update match result");
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch(status) {
      case "scheduled": return "#f59e0b";
      case "live": return "#ef4444";
      case "completed": return "#10b981";
      default: return "#6b7280";
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch(status) {
      case "scheduled": return "📅 Scheduled";
      case "live": return "🔴 LIVE";
      case "completed": return "✅ Completed";
      default: return status;
    }
  };

  // Button styles
  const buttonStyles = {
    view: {
      backgroundColor: "#2563EB",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "5px",
      fontSize: "12px",
    },
    edit: {
      backgroundColor: "#f59e0b",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "5px",
      fontSize: "12px",
    },
    delete: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
    },
    save: {
      backgroundColor: "#10b981",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "10px",
      fontSize: "14px",
    },
    cancel: {
      backgroundColor: "#6b7280",
      color: "white",
      border: "none",
      padding: "10px 20px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "14px",
    },
    close: {
      backgroundColor: "#ef4444",
      color: "white",
      border: "none",
      fontSize: "20px",
      cursor: "pointer",
      width: "30px",
      height: "30px",
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  };

  const modalOverlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "white",
    padding: "25px",
    borderRadius: "12px",
    width: "500px",
    maxWidth: "90%",
    maxHeight: "80vh",
    overflowY: "auto",
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <main className="content">
          <SkeletonTable rows={8} cols={7} />
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <main className="content">
        <h1>Matches</h1>

        <section className="panel">
          {matches.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px" }}>No matches found</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6", borderBottom: "2px solid #e5e7eb" }}>
                  <th style={{ padding: "12px", textAlign: "left" }}>Match</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Venue</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "left" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={m._id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "12px" }}>
                      <strong>{m.teams[0]?.teamName}</strong> vs <strong>{m.teams[1]?.teamName}</strong>
                    </td>
                    <td style={{ padding: "12px" }}>{new Date(m.matchDate).toLocaleString()}</td>
                    <td style={{ padding: "12px" }}>{m.venueId?.name}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        backgroundColor: getStatusColor(m.status),
                        color: "white",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: "bold",
                        display: "inline-block",
                      }}>
                        {getStatusText(m.status)}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <button
                        style={buttonStyles.view}
                        onClick={() => {
                          setSelectedMatch(m);
                          setShowViewPopup(true);
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#1D4ED8"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#2563EB"}
                      >
                        View
                      </button>
                      <button
                        style={buttonStyles.edit}
                        onClick={() => {
                          setEditMatch({
                            _id: m._id,
                            winnerTeamId: m.result?.winnerTeamId || "",
                            score: m.result?.score || "",
                            status: m.status,
                            teamA: m.teams[0]?._id,
                            teamB: m.teams[1]?._id,
                            teamAName: m.teams[0]?.teamName,
                            teamBName: m.teams[1]?.teamName,
                          });
                          setShowEditPopup(true);
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#d97706"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#f59e0b"}
                      >
                        Edit Result
                      </button>
                      <button
                        style={buttonStyles.delete}
                        onClick={() => handleDelete(m._id)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = "#dc2626"}
                        onMouseLeave={(e) => e.target.style.backgroundColor = "#ef4444"}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* VIEW POPUP */}
      {showViewPopup && selectedMatch && (
        <div style={modalOverlayStyle} onClick={() => setShowViewPopup(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>Match Details</h2>
              <button style={buttonStyles.close} onClick={() => setShowViewPopup(false)}>×</button>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Match:</strong>
              <p style={{ margin: "5px 0", fontSize: "18px" }}>
                {selectedMatch.teams[0]?.teamName} vs {selectedMatch.teams[1]?.teamName}
              </p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Date & Time:</strong>
              <p>{new Date(selectedMatch.matchDate).toLocaleString()}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Venue:</strong>
              <p>{selectedMatch.venueId?.name}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Status:</strong>
              <span style={{
                backgroundColor: getStatusColor(selectedMatch.status),
                color: "white",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "bold",
                display: "inline-block",
                marginLeft: "10px",
              }}>
                {getStatusText(selectedMatch.status)}
              </span>
            </div>

            {selectedMatch.status === "completed" && selectedMatch.result && (
              <>
                <div style={{ marginBottom: "15px" }}>
                  <strong>Winner:</strong>
                  <p style={{ color: "#10b981", fontWeight: "bold" }}>
                    {selectedMatch.result.winnerTeamId === selectedMatch.teams[0]?._id 
                      ? selectedMatch.teams[0]?.teamName 
                      : selectedMatch.teams[1]?.teamName}
                  </p>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <strong>Score:</strong>
                  <p>{selectedMatch.result.score}</p>
                </div>
              </>
            )}

            <button
              style={{ ...buttonStyles.cancel, width: "100%", marginTop: "10px" }}
              onClick={() => setShowViewPopup(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EDIT RESULT POPUP */}
      {showEditPopup && editMatch && (
        <div style={modalOverlayStyle} onClick={() => setShowEditPopup(false)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0 }}>Edit Match Result</h2>
              <button style={buttonStyles.close} onClick={() => setShowEditPopup(false)}>×</button>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <strong>Match:</strong>
              <p>{editMatch.teamAName} vs {editMatch.teamBName}</p>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Winner Team</label>
              <select
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                value={editMatch.winnerTeamId}
                onChange={(e) => setEditMatch({ ...editMatch, winnerTeamId: e.target.value })}
              >
                <option value="">Select Winner</option>
                <option value={editMatch.teamA}>{editMatch.teamAName}</option>
                <option value={editMatch.teamB}>{editMatch.teamBName}</option>
              </select>
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Score</label>
              <input
                type="text"
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                placeholder="e.g., 2-1, 100/2, 4-0"
                value={editMatch.score}
                onChange={(e) => setEditMatch({ ...editMatch, score: e.target.value })}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Match Status</label>
              <select
                style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                value={editMatch.status}
                onChange={(e) => setEditMatch({ ...editMatch, status: e.target.value })}
              >
                <option value="scheduled">Scheduled</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
              <button
                style={buttonStyles.cancel}
                onClick={() => setShowEditPopup(false)}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#4b5563"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#6b7280"}
              >
                Cancel
              </button>
              <button
                style={buttonStyles.save}
                onClick={handleUpdateResult}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#059669"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#10b981"}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}