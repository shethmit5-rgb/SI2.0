import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import { Link } from "react-router-dom";
import "../static/schedule.css";
import SkeletonMatch from "../components/loading/SkeletonMatch";
import { useAuth } from "../context/AuthContext";

export default function Schedule() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  useEffect(() => {
    fetchMatches();
  }, [user]);

  const fetchMatches = async () => {
    try {
      const endpoint = user ? "/matches/my-schedule" : "/matches/public/upcoming";
      const res = await api.get(endpoint);
      setMatches(res.data);
    } catch (err) {
      console.error("Failed to load matches", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = matches.filter(m => {
    if (filter === "all") return true;
    return m.status === filter;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case "scheduled": return "#f59e0b";
      case "live": return "#ef4444";
      case "completed": return "#10b981";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="schedule-page">
        <div className="schedule-header">
          <h1>📅 Match Schedule</h1>
          <p>Upcoming and live matches</p>
        </div>
        <SkeletonMatch items={6} />
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>📅 Match Schedule</h1>
        <p>Upcoming and live matches</p>
      </div>

      <div className="schedule-filters">
        <button onClick={() => setFilter("all")} className={filter === "all" ? "active" : ""}>All</button>
        <button onClick={() => setFilter("scheduled")} className={filter === "scheduled" ? "active" : ""}>Upcoming</button>
        <button onClick={() => setFilter("live")} className={filter === "live" ? "active" : ""}>Live</button>
        <button onClick={() => setFilter("completed")} className={filter === "completed" ? "active" : ""}>Completed</button>
      </div>

      {filteredMatches.length === 0 ? (
        <div className="no-matches">
          <p>No matches found</p>
        </div>
      ) : (
        <div className="matches-grid">
          {filteredMatches.map(match => (
            <div key={match._id} className="match-card">
              <div className="match-teams">
                <div className="team">
                  <span className="team-name">{match.teams?.[0]?.teamName || "TBD"}</span>
                </div>
                <div className="vs">VS</div>
                <div className="team">
                  <span className="team-name">{match.teams?.[1]?.teamName || "TBD"}</span>
                </div>
              </div>
              <div className="match-info">
                <p>🏟️ {match.venueId?.name || "Venue TBD"}</p>
                <p>📅 {new Date(match.matchDate).toLocaleString()}</p>
                <span className="status" style={{ backgroundColor: getStatusColor(match.status) }}>
                  {match.status}
                </span>
              </div>
              <Link to={`/tournament/${match.tournamentId?._id}`} className="view-btn">
                View Tournament →
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}