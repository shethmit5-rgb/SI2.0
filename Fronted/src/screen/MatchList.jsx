import React, { useEffect, useState } from "react";
import axios from "axios";
import "../static/MatchList.css";
import SkeletonMatch from "../components/loading/SkeletonMatch";

export default function MatchList() {
  const token = localStorage.getItem("token");
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [editMatch, setEditMatch] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter matches
  const filteredMatches = matches.filter(match => {
    if (filter !== "all" && match.status !== filter) return false;
    if (searchTerm) {
      const teamAName = match.teams[0]?.teamName?.toLowerCase() || "";
      const teamBName = match.teams[1]?.teamName?.toLowerCase() || "";
      const venueName = match.venueId?.name?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return teamAName.includes(search) || teamBName.includes(search) || venueName.includes(search);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="matchlist-container">
        <div className="matchlist-header">
          <h1>🏆 Tournament Matches</h1>
          <p>Real-time brackets and fixture schedules</p>
        </div>
        <SkeletonMatch items={6} />
      </div>
    );
  }

  return (
    <div className="matchlist-container">
      <div className="matchlist-header">
        <h1>⚽ Match Management</h1>
        <p>Manage, update and track all matches</p>
      </div>

      {/* Filters */}
      <div className="matchlist-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Search by team or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-buttons">
          <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
          <button onClick={() => setFilter("scheduled")} className={filter === "scheduled" ? "active" : ""}>📅 Scheduled</button>
          <button onClick={() => setFilter("live")} className={filter === "live" ? "active" : ""}>🔴 Live</button>
          <button onClick={() => setFilter("completed")} className={filter === "completed" ? "active" : ""}>✅ Completed</button>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Found <strong>{filteredMatches.length}</strong> match{filteredMatches.length !== 1 ? 'es' : ''}
      </div>

      {/* Matches Table */}
      {filteredMatches.length === 0 ? (
        <div className="no-matches">
          <div className="no-matches-icon">⚽</div>
          <h3>No matches found</h3>
          <p>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="matches-table-wrapper">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Match</th>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMatches.map((match) => (
                <tr key={match._id} className={`match-row ${match.status}`}>
                  <td className="match-teams-cell">
                    <div className="match-teams">
                      <span className="team-name">{match.teams[0]?.teamName || "TBD"}</span>
                      <span className="vs">VS</span>
                      <span className="team-name">{match.teams[1]?.teamName || "TBD"}</span>
                    </div>
                  </td>
                  <td className="match-date">
                    {new Date(match.matchDate).toLocaleString()}
                  </td>
                  <td className="match-venue">
                    🏟️ {match.venueId?.name || "TBD"}
                  </td>
                  <td className="match-status-cell">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(match.status) }}>
                      {getStatusText(match.status)}
                    </span>
                  </td>
                  <td className="match-result">
                    {match.status === "completed" && match.result?.score ? (
                      <span className="result-score">{match.result.score}</span>
                    ) : (
                      <span className="no-result">—</span>
                    )}
                  </td>
                  <td className="match-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => {
                        setSelectedMatch(match);
                        setShowViewPopup(true);
                      }}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => {
                        setEditMatch({
                          _id: match._id,
                          winnerTeamId: match.result?.winnerTeamId || "",
                          score: match.result?.score || "",
                          status: match.status,
                          teamA: match.teams[0]?._id,
                          teamB: match.teams[1]?._id,
                          teamAName: match.teams[0]?.teamName,
                          teamBName: match.teams[1]?.teamName,
                        });
                        setShowEditPopup(true);
                      }}
                      title="Edit Result"
                    >
                      ✏️
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(match._id)}
                      title="Delete Match"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW POPUP */}
      {showViewPopup && selectedMatch && (
        <div className="modal-overlay" onClick={() => setShowViewPopup(false)}>
          <div className="modal view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Match Details</h2>
              <button className="close-modal" onClick={() => setShowViewPopup(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <label>Match</label>
                <div className="match-teams-display">
                  <span className="team">{selectedMatch.teams[0]?.teamName}</span>
                  <span className="vs">VS</span>
                  <span className="team">{selectedMatch.teams[1]?.teamName}</span>
                </div>
              </div>
              <div className="detail-section">
                <label>Date & Time</label>
                <p>{new Date(selectedMatch.matchDate).toLocaleString()}</p>
              </div>
              <div className="detail-section">
                <label>Venue</label>
                <p>🏟️ {selectedMatch.venueId?.name}</p>
                <p className="venue-address">{selectedMatch.venueId?.address}</p>
              </div>
              <div className="detail-section">
                <label>Status</label>
                <span className="status-badge" style={{ backgroundColor: getStatusColor(selectedMatch.status) }}>
                  {getStatusText(selectedMatch.status)}
                </span>
              </div>
              {selectedMatch.status === "completed" && selectedMatch.result && (
                <>
                  <div className="detail-section">
                    <label>Winner</label>
                    <p className="winner-name">
                      🏆 {selectedMatch.result.winnerTeamId === selectedMatch.teams[0]?._id 
                        ? selectedMatch.teams[0]?.teamName 
                        : selectedMatch.teams[1]?.teamName}
                    </p>
                  </div>
                  <div className="detail-section">
                    <label>Score</label>
                    <p className="score">{selectedMatch.result.score}</p>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowViewPopup(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RESULT POPUP */}
      {showEditPopup && editMatch && (
        <div className="modal-overlay" onClick={() => setShowEditPopup(false)}>
          <div className="modal edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Match Result</h2>
              <button className="close-modal" onClick={() => setShowEditPopup(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <label>Match</label>
                <p className="match-name">{editMatch.teamAName} vs {editMatch.teamBName}</p>
              </div>
              <div className="detail-section">
                <label>Winner Team</label>
                <select
                  value={editMatch.winnerTeamId}
                  onChange={(e) => setEditMatch({ ...editMatch, winnerTeamId: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Winner</option>
                  <option value={editMatch.teamA}>{editMatch.teamAName}</option>
                  <option value={editMatch.teamB}>{editMatch.teamBName}</option>
                </select>
              </div>
              <div className="detail-section">
                <label>Score</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., 2-1, 100/2, 4-0"
                  value={editMatch.score}
                  onChange={(e) => setEditMatch({ ...editMatch, score: e.target.value })}
                />
              </div>
              <div className="detail-section">
                <label>Match Status</label>
                <select
                  value={editMatch.status}
                  onChange={(e) => setEditMatch({ ...editMatch, status: e.target.value })}
                  className="form-select"
                >
                  <option value="scheduled">📅 Scheduled</option>
                  <option value="live">🔴 Live</option>
                  <option value="completed">✅ Completed</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditPopup(false)}>Cancel</button>
              <button className="save-btn" onClick={handleUpdateResult}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}