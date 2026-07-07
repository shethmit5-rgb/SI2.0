import React from "react";
import ProfileStatsCard from "./ProfileStatsCard";
import ProfileInfoCard from "./ProfileInfoCard";
import ProfileActivityTimeline from "./ProfileActivityTimeline";
import "../../static/Profile.css";

export default function OrganizerProfileContent({
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
  const reg = dashboardData.registrations || {};
  const m = dashboardData.matches || {};
  const activity = dashboardData.activity || {};

  // Formulate activities list for organizer
  const activitiesList = [];
  if (activity.recentRegistrations) {
    activity.recentRegistrations.forEach((r) => {
      activitiesList.push({
        title: "Registration Received",
        date: r.registrationDate,
        description: `Team "${r.teamId?.teamName || "N/A"}" registered for "${r.tournamentId?.eventName || "N/A"}"`,
      });
    });
  }
  if (activity.recentOrganizerPayments) {
    activity.recentOrganizerPayments.forEach((p) => {
      activitiesList.push({
        title: "Tournament Fee Paid",
        date: p.createdAt,
        description: `Paid creation fee for "${p.tournamentId?.eventName || "N/A"}"`,
      });
    });
  }

  // Fallback to notifications if no active events
  const finalTimeline = activitiesList.length > 0 ? activitiesList : (activity.notifications || []);

  switch (activeTab) {
    case "overview":
      return (
        <div className="tab-pane-content">
          {/* Calendar placeholder */}
          <div className="calendar-panel glass-card">
            <h3>📅 Tournament Schedule Calendar</h3>
            <div className="mock-calendar">
              <div className="calendar-header-row">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              <div className="calendar-days-grid">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div key={i} className={`calendar-day ${i === 12 ? "active-day" : ""}`}>
                    <span className="day-num">{i + 1}</span>
                    {i === 12 && <span className="day-dot"></span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );

    case "tournaments":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>🏆 Tournaments Organized</h3>
          <div className="stats-metric-row">
            <span className="metric-pill">Upcoming: {s.upcoming || 0}</span>
            <span className="metric-pill">Ongoing: {s.ongoing || 0}</span>
            <span className="metric-pill">Completed: {s.completed || 0}</span>
          </div>

          {/* Premium Empty State */}
          {!s.totalTournaments ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">🏆</span>
              <p>No tournaments created yet. Create your first tournament.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="profile-table">
                <thead>
                  <tr>
                    <th>Tournament Name</th>
                    <th>Status</th>
                    <th>Teams Limit</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Since dashboard data has tournaments, we can show stats */}
                  <tr>
                    <td>Active Event Brackets</td>
                    <td><span className="status-pill active">Active</span></td>
                    <td>{reg.approved || 0} approved teams</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      );

    case "matches":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>⚔️ Matches Managed</h3>
          <div className="stats-metric-row">
            <span className="metric-pill">Completed: {m.completed || 0}</span>
            <span className="metric-pill">Remaining: {m.remaining || 0}</span>
          </div>

          {!m.total ? (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">⚔️</span>
              <p>No matches scheduled yet.</p>
            </div>
          ) : (
            <div className="timeline-empty-state glass-card">
              <span className="empty-state-icon">📅</span>
              <p>Manage matches directly in the Organizer Match Panel.</p>
            </div>
          )}
        </div>
      );

    case "reports":
      return (
        <div className="tab-pane-content glass-panel">
          <h3>📊 Financial Reports</h3>
          <div className="financial-stats-grid">
            <div className="fin-card">
              <span>Creation Fees Paid</span>
              <strong>₹{dashboardData.financials?.tournamentCreationFees || 0}</strong>
            </div>
            <div className="fin-card">
              <span>Sponsor Contributions</span>
              <strong>₹{dashboardData.financials?.sponsorContributions || 0}</strong>
            </div>
            <div className="fin-card">
              <span>Net Profit/Loss</span>
              <strong className={dashboardData.financials?.netProfit >= 0 ? "text-success" : "text-danger"}>
                ₹{dashboardData.financials?.netProfit || 0}
              </strong>
            </div>
          </div>
        </div>
      );

    case "activity":
      return (
        <div className="tab-pane-content">
          <ProfileActivityTimeline activities={finalTimeline} emptyMessage="No recent activities." />
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
