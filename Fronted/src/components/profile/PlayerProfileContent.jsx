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
  preview,
  handleImageChange,
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
              <p>No rewards record found. Win tournament brackets to earn payouts.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Tournament Name</th>
                    <th>My Team</th>
                    <th>My Rank</th>
                    <th>My Reward</th>
                    <th>Date Received</th>
                  </tr>
                </thead>
                <tbody>
                  {rewards.map((reward, idx) => (
                    <tr key={idx}>
                      <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {reward.brandLogo && (
                          <img
                            src={reward.brandLogo}
                            alt="logo"
                            className="table-avatar-round"
                            style={{ width: '24px', height: '24px', borderRadius: '50%' }}
                          />
                        )}
                        <span>{reward.tournamentName}</span>
                      </td>
                      <td>{reward.teamName}</td>
                      <td>
                        <span className={`status-pill ${reward.position === "Winner" ? "active" : "pending"}`}>
                          {reward.position}
                        </span>
                      </td>
                      <td><strong>₹{reward.individualPrize}</strong></td>
                      <td>{new Date(reward.distributedAt).toLocaleDateString()}</td>
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
          <h3>🏆 Achievements Showcase</h3>
          <div className="achievements-showcase-grid">
            {s.totalMatchesPlayed >= 10 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">👟</span>
                <strong>Active Contender</strong>
                <p>Played 10+ competitive matches</p>
              </div>
            )}
            {f.totalPrizeMoneyEarned >= 5000 && (
              <div className="badge-card-premium glass-card">
                <span className="badge-icon">💰</span>
                <strong>Prize earner</strong>
                <p>Earned over ₹5,000</p>
              </div>
            )}
            <div className="badge-card-premium glass-card">
              <span className="badge-icon">🏅</span>
              <strong>Active Athlete</strong>
              <p>Registered and active in college leagues</p>
            </div>
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
            preview={preview}
            handleImageChange={handleImageChange}
          />
        </div>
      );

    default:
      return null;
  }
}
