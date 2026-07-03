import React from "react";
import ProfileStatsCard from "./ProfileStatsCard";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActivityTimeline from "./ProfileActivityTimeline";
import "../../static/Profile.css";

export default function PlayerProfileContent({
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
}) {
  const s = dashboardData.stats || {};
  const f = dashboardData.financials || {};
  const notifications = dashboardData.notifications || [];
  const rewards = dashboardData.tournamentRewards || [];

  // Map activities
  const activitiesList = [];
  if (dashboardData.prizeHistory) {
    dashboardData.prizeHistory.forEach((p) => {
      activitiesList.push({
        title: "Reward Received",
        date: p.receivedDate,
        description: `Earned ₹${p.prizeAmount} in "${p.tournamentName}" as ${p.role}`,
      });
    });
  }

  const finalTimeline = activitiesList.length > 0 ? activitiesList : notifications;

  switch (activeTab) {
    case "overview":
      return (
        <div className="tab-pane-content">
          <ProfileStatsCard role="player" statsData={dashboardData} />
          <ProfileActivityTimeline activities={finalTimeline} emptyMessage="No rewards earned yet. Win your first tournament to receive sponsor rewards." />
        </div>
      );

    case "performance":
      return (
        <div className="tab-pane-content">
          <ProfileStatsCard role="player" statsData={dashboardData} />
        </div>
      );

    case "rewards":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>💰 Tournament Rewards & Earnings</h3>
          <div className="stats-metric-row">
            <span className="metric-pill">Lifetime Earnings: ₹{f.totalPrizeMoneyEarned || 0}</span>
            <span className="metric-pill">Joining Fees Paid: ₹{f.totalJoiningFeesPaid || 0}</span>
          </div>

          {rewards.length === 0 ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">💰</span>
              <p>No tournament rewards yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Team</th>
                    <th>Position</th>
                    <th>Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((r, idx) => (
                    <tr key={idx}>
                      <td>{r.tournamentName}</td>
                      <td>{r.teamName}</td>
                      <td>
                        <span className={`status-pill ${r.position === "Winner" ? "active" : "pending"}`}>
                          {r.position}
                        </span>
                      </td>
                      <td>₹{r.individualPrize}</td>
                      <td>{new Date(r.distributedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );

    case "achievements":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>🏆 Player Achievements</h3>
          <div className="achievements-showcase-grid">
            {s.tournamentsWon > 0 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">🥇</span>
                <strong>Tournament Champion</strong>
                <p>Won a collegiate tournament bracket</p>
              </div>
            )}
            {f.totalPrizeMoneyEarned > 0 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">💰</span>
                <strong>Prize Winner</strong>
                <p>Earned direct sponsor payouts</p>
              </div>
            )}
            {s.totalMatchesPlayed >= 1 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">⚔️</span>
                <strong>Competitive Athlete</strong>
                <p>Played an official matches bracket</p>
              </div>
            )}
            {s.winRate >= 60 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">🔥</span>
                <strong>Consistent MVP</strong>
                <p>Win rate above 60%</p>
              </div>
            )}
          </div>
        </div>
      );

    case "history":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>📅 Match & Tournament History</h3>
          <div className="matches-split-grid">
            <div className="match-split-column">
              <h4>Matches Played</h4>
              {dashboardData.matchHistory?.length === 0 ? (
                <p className="no-events-text">No matches played yet.</p>
              ) : (
                dashboardData.matchHistory?.map((match, idx) => (
                  <div key={idx} className="match-card-mini glass-card">
                    <strong>vs {match.opponent}</strong>
                    <span className="match-meta">{match.tournamentName}</span>
                    <span className={`result-indicator ${match.result === "Win" ? "win" : "loss"}`}>
                      {match.result}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="match-split-column">
              <h4>Tournaments</h4>
              {dashboardData.tournamentHistory?.length === 0 ? (
                <p className="no-events-text">No tournaments participated in.</p>
              ) : (
                dashboardData.tournamentHistory?.map((tourney, idx) => (
                  <div key={idx} className="match-card-mini glass-card">
                    <strong>{tourney.tournamentName}</strong>
                    <span className="match-meta">{tourney.status} • {tourney.result}</span>
                  </div>
                ))
              )}
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
          />
        </div>
      );

    default:
      return null;
  }
}
