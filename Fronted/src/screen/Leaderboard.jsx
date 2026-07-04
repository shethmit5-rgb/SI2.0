import React, { useEffect, useState } from "react";
import api from "../utils/axiosConfig";
import "../static/Leaderboard.css";
import SkeletonTable from "../components/loading/SkeletonTable";

export default function Leaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get("/teams/public");
      // Sort by team name or any criteria (you can customize this)
      const sortedTeams = res.data.sort((a, b) => {
        return (a.wins || 0) - (b.wins || 0);
      });
      setTeams(sortedTeams.slice(0, 20));
    } catch (err) {
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  const getMedalColor = (index) => {
    if (index === 0) return "#FFD700"; // Gold
    if (index === 1) return "#C0C0C0"; // Silver
    if (index === 2) return "#CD7F32"; // Bronze
    return "#6b7280"; // Gray for others
  };

  if (loading) {
    return (
      <div className="leaderboard-page">
        <div className="leaderboard-header">
          <h1>🏆 Leaderboard</h1>
          <p>Top teams in ArenaSync</p>
        </div>
        <SkeletonTable rows={10} cols={5} />
      </div>
    );
  }

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1>🏆 Leaderboard</h1>
        <p>Top teams in ArenaSync</p>
      </div>

      {teams.length === 0 ? (
        <div className="empty-leaderboard">
          <p>📭 No teams found</p>
        </div>
      ) : (
        <div className="leaderboard-table">
          <div className="table-header">
            <div>Rank</div>
            <div>Team Name</div>
            <div>Tournament</div>
            <div>Matches</div>
            <div>Wins</div>
          </div>

          {teams.map((team, index) => (
            <div key={team._id} className="table-row">
              <div className="rank">
                <span className="medal" style={{ backgroundColor: getMedalColor(index) }}>
                  {index + 1}
                </span>
              </div>
              <div className="team">{team.teamName}</div>
              <div className="tournament">{team.tournamentId?.eventName || "N/A"}</div>
              <div className="matches">{team.matchesPlayed || 0}</div>
              <div className="wins">{team.wins || 0}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}