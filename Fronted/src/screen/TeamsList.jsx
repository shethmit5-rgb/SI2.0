import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../utils/axiosConfig";
import { useAuth } from "../context/AuthContext";
import "../static/TeamsList.css";
import SkeletonCard from "../components/loading/SkeletonCard";

export default function TeamsList() {
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tournament: "all",
    sport: "all",
    status: "all",
    search: ""
  });
  

  useEffect(() => {
    fetchTeams();
    fetchTournaments();
    fetchSports();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await api.get("/teams/public");
      setTeams(res.data);
    } catch (err) {
      console.error("Failed to fetch teams", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTournaments = async () => {
    try {
      const res = await api.get("/tournaments/public");
      setTournaments(res.data);
    } catch (err) {
      console.error("Failed to fetch tournaments", err);
    }
  };

  const fetchSports = async () => {
    try {
      const res = await api.get("/sports");
      setSports(res.data);
    } catch (err) {
      console.error("Failed to fetch sports", err);
    }
  };

  const filteredTeams = teams.filter(team => {
    if (filters.tournament !== "all" && team.tournamentId?._id !== filters.tournament) return false;
    if (filters.sport !== "all" && team.sportId?._id !== filters.sport) return false;
    if (filters.status !== "all" && team.tournamentId?.status !== filters.status) return false;
    if (filters.search && !team.teamName.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="teams-list-page">
      <div className="page-header">
        <h1>Teams</h1>
        <p>Browse all teams and find players</p>
        {user && user.role !== "organizer" && (
          <Link to="/teams/create" className="create-team-btn">
            + Create New Team
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text"
          placeholder="Search teams..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="search-input"
        />
        
        <select
          value={filters.tournament}
          onChange={(e) => setFilters({ ...filters, tournament: e.target.value })}
        >
          <option value="all">All Tournaments</option>
          {tournaments.map(t => (
            <option key={t._id} value={t._id}>{t.eventName}</option>
          ))}
        </select>

        <select
          value={filters.sport}
          onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
        >
          <option value="all">All Sports</option>
          {sports.map(s => (
            <option key={s._id} value={s._id}>{s.name}</option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Teams Grid */}
      {loading ? (
        <div className="teams-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", width: "100%" }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} height="240px" />
          ))}
        </div>
      ) : (
        <div className="teams-grid">
          {filteredTeams.length > 0 ? (
            filteredTeams.map(team => (
              <div key={team._id} className="team-card">
                <div className="team-header">
                  <h3>{team.teamName}</h3>
                  <span className="team-sport">{team.sportId?.name}</span>
                </div>
                
                <div className="team-info">
                  <p><strong>Captain:</strong> {team.captainId?.name}</p>
                  <p><strong>Tournament:</strong> {team.tournamentId?.eventName}</p>
                  <p><strong>Players:</strong> {team.players?.length || 0}/{team.sportId?.playersPerTeam || 11}</p>
                </div>

                <div className="team-actions">
                  <Link to={`/team/${team._id}`} className="view-btn">
                    View Details
                  </Link>
                  {user && user.role !== "organizer" && user._id !== team.captainId?._id && (
                    <button className="apply-btn">Apply to Join</button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-data">No teams found</p>
          )}
        </div>
      )}
    </div>
  );
}