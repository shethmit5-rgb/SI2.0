import React from "react";
import ProfileStatsCard from "./ProfileStatsCard";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActivityTimeline from "./ProfileActivityTimeline";
import "../../static/Profile.css";

export default function SponsorProfileContent({
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
  const history = dashboardData.history || [];
  const distributions = dashboardData.prizeDistributions || [];
  const notifications = dashboardData.notifications || [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Map activities
  const activitiesList = [];
  if (history) {
    history.forEach((h) => {
      activitiesList.push({
        title: "Sponsorship Active",
        date: h.startDate,
        description: `Sponsored "${h.tournamentName}" with ${formatCurrency(h.sponsoredAmount)} (${h.sponsorshipType})`,
      });
    });
  }

  const finalTimeline = activitiesList.length > 0 ? activitiesList : notifications;

  switch (activeTab) {
    case "overview":
      return (
        <div className="tab-pane-content">
          <ProfileStatsCard role="sponsor" statsData={dashboardData} />
          <ProfileActivityTimeline activities={finalTimeline} emptyMessage="No sponsorship history yet. Sponsor a tournament to start building your portfolio." />
        </div>
      );

    case "sponsorships":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>🏁 Sponsored Tournaments</h3>
          <div className="stats-metric-row">
            <span className="metric-pill">Active: {s.activeSponsorships || 0}</span>
            <span className="metric-pill">Completed: {s.completedSponsorships || 0}</span>
          </div>

          {history.length === 0 ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">💎</span>
              <p>No sponsorship history yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Tournament</th>
                    <th>Type</th>
                    <th>Funded</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td>{h.tournamentName}</td>
                      <td>{h.sponsorshipType}</td>
                      <td>{formatCurrency(h.sponsoredAmount)}</td>
                      <td>
                        <span className={`status-pill ${h.tournamentStatus === "completed" ? "active" : "pending"}`}>
                          {h.tournamentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );

    case "prize-distribution":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>🏆 Prize Distributions Funded</h3>
          <div className="stats-metric-row">
            <span className="metric-pill">Payout Distributions: {s.totalCompletedDistributions || 0}</span>
            <span className="metric-pill">Players Rewarded: {s.totalPlayersRewarded || 0}</span>
          </div>

          {distributions.length === 0 ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">🏆</span>
              <p>No prize distributions completed yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Distribution ID</th>
                    <th>Tournament</th>
                    <th>Winner Team</th>
                    <th>Runner-up Team</th>
                    <th>Players Rewarded</th>
                  </tr>
                </thead>
                <tbody>
                  {distributions.map((d, idx) => (
                    <tr key={idx}>
                      <td>{d.distributionId}</td>
                      <td>{d.tournamentName}</td>
                      <td>{d.winnerTeam} (₹{d.winnerPrize})</td>
                      <td>{d.runnerUpTeam} (₹{d.runnerUpPrize})</td>
                      <td>{d.playersRewardedCount} athletes</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );

    case "invoices":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>📑 Invoice & Payment History</h3>
          {history.length === 0 ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">📑</span>
              <p>No transactions found.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, idx) => (
                    <tr key={idx}>
                      <td>{new Date(h.startDate).toLocaleDateString()}</td>
                      <td>Sponsorship payment for {h.tournamentName}</td>
                      <td>{h.sponsorshipType}</td>
                      <td>{formatCurrency(h.sponsoredAmount)}</td>
                      <td><span className="status-pill active">Paid</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );

    case "analytics":
      return (
        <div className="tab-pane-content">
          <ProfileStatsCard role="sponsor" statsData={dashboardData} />
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
