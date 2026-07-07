import React from "react";
import ProfileStatsCard from "./ProfileStatsCard";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActivityTimeline from "./ProfileActivityTimeline";
import "../../static/Profile.css";

export default function CoachProfileContent({
  activeTab,
  dashboardData = {},
  user,
  form,
  isEditing,
  setIsEditing,
  handleChange,
  handleSubmit,
  saving,
  handleDelete,
  preview,
  handleImageChange,
}) {
  const s = dashboardData.stats || {};
  const activity = dashboardData.activity || {};
  
  // Format activities
  const activitiesList = [];
  if (activity.recentPlayerPayments) {
    activity.recentPlayerPayments.forEach((p) => {
      activitiesList.push({
        title: "Player Payment Received",
        date: p.createdAt,
        description: `Player "${p.userId?.name || "N/A"}" paid joining fee for team "${p.teamId?.teamName || "N/A"}"`,
      });
    });
  }
  if (activity.recentRegistrations) {
    activity.recentRegistrations.forEach((r) => {
      activitiesList.push({
        title: "Team Registration",
        date: r.registrationDate,
        description: `Registered team "${r.teamId?.teamName || "N/A"}" for tournament "${r.tournamentId?.eventName || "N/A"}"`,
      });
    });
  }

  const finalTimeline = activitiesList.length > 0 ? activitiesList : (activity.notifications || []);

  switch (activeTab) {
    case "overview":
      return null;

    case "teams":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>🛡️ Coached Teams</h3>
          {!s.teamsCreated ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">🛡️</span>
              <p>No teams managed yet. Create your first team.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Roster Name</th>
                    <th>Coached Players</th>
                    <th>Win Index</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Active Roster Brackets</td>
                    <td>{s.activePlayers || 0} athletes</td>
                    <td>{s.winRate || 0}% wins</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      );

    case "players":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>👟 Athletes & Rosters</h3>
          <div className="stats-metric-row">
            <span className="metric-pill">Active: {s.approvedPlayers || 0}</span>
            <span className="metric-pill">Pending: {s.pendingPlayers || 0}</span>
            <span className="metric-pill">Rejected: {s.rejectedPlayers || 0}</span>
          </div>

          {!s.activePlayers && !s.pendingPlayers ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">👟</span>
              <p>No rostered athletes found.</p>
            </div>
          ) : (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">👥</span>
              <p>Roster details can be managed from the Team Dashboard.</p>
            </div>
          )}
        </div>
      );

    case "matches":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>⚔️ Coach Match History</h3>
          <div className="matches-split-grid">
            <div className="match-split-column">
              <h4>Upcoming</h4>
              {activity.upcomingMatches?.length === 0 ? (
                <p className="no-events-text">No upcoming schedules.</p>
              ) : (
                activity.upcomingMatches?.map((match, idx) => (
                  <div key={idx} className="match-card-mini glass-card">
                    <strong>{match.tournamentId?.eventName}</strong>
                    <span className="match-meta">📅 {new Date(match.matchDate).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>

            <div className="match-split-column">
              <h4>Completed</h4>
              {activity.recentMatches?.length === 0 ? (
                <p className="no-events-text">No past matches.</p>
              ) : (
                activity.recentMatches?.map((match, idx) => (
                  <div key={idx} className="match-card-mini glass-card">
                    <strong>vs {match.opponent}</strong>
                    <span className={`result-indicator ${match.result === "Win" ? "win" : "loss"}`}>
                      {match.result}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      );

    case "achievements":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>🏆 Coaching Achievements</h3>
          <div className="achievements-showcase-grid">
            {s.wins >= 5 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">🏆</span>
                <strong>Champion Coach</strong>
                <p>Won at least 5 matches</p>
              </div>
            )}
            {s.activePlayers >= 5 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">👥</span>
                <strong>Development Expert</strong>
                <p>Coached 5+ active players</p>
              </div>
            )}
            <div className="badge-card-premium glass-card">
              <span className="badge-icon">🛡️</span>
              <strong>Active Bracket Leader</strong>
              <p>Formed a collegiate team roster</p>
            </div>
          </div>
        </div>
      );

    case "settings":
      return (
        <div className="tab-pane-content">
          <ProfileInfoCard
            user={user}
            form={form}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            saving={saving}
            handleDelete={handleDelete}
            preview={preview}
            handleImageChange={handleImageChange}
          />
        </div>
      );

    default:
      return null;
  }
}
