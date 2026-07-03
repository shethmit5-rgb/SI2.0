import React from "react";
import "../../static/Profile.css";

export default function ProfileActivityTimeline({ activities = [], emptyMessage = "No recent activity." }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (activities.length === 0) {
    return (
      <div className="activity-timeline-panel glass-panel">
        <h3>🔔 Recent Activities & Logs</h3>
        <div className="timeline-empty-state glass-card">
          <span className="empty-state-icon">📭</span>
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-timeline-panel glass-panel">
      <h3>🔔 Recent Activities & Logs</h3>
      <div className="timeline-container">
        {activities.map((act, idx) => (
          <div key={idx} className="timeline-item">
            <div className="timeline-badge-connector">
              <div className="timeline-bullet-glow"></div>
              {idx < activities.length - 1 && <div className="timeline-line"></div>}
            </div>
            <div className="timeline-card glass-card">
              <div className="timeline-card-header">
                <strong>{act.title}</strong>
                <span className="timeline-date">{formatDate(act.date || act.createdAt)}</span>
              </div>
              <p className="timeline-desc">{act.description || act.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
