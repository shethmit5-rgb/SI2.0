import React from "react";
import { Link } from "react-router-dom";
import "../../static/Profile.css";

export default function ProfileQuickActions({ role, user }) {
  let actions = [];

  if (role === "organizer") {
    actions = [
      {
        title: "Create Tournament",
        path: "/create-tournament",
        icon: "➕",
        desc: "Design and launch a new sporting event.",
      },
      {
        title: "Manage Tournaments",
        path: "/my-tournaments",
        icon: "🏆",
        desc: "Edit existing event details and statuses.",
      },
      {
        title: "Manage Matches",
        path: "/organizer/matches",
        icon: "⚔️",
        desc: "Schedule matches, set scores, and declare rounds.",
      },
      {
        title: "Approve Teams",
        path: "/organizer/registrations",
        icon: "✔️",
        desc: "Approve pending team registrations.",
      },
    ];

    if (user?.role === "admin") {
      actions.push({
        title: "System Reports",
        path: "/admin/reports",
        icon: "📊",
        desc: "View financial and tournament reports.",
      });
    }
  } else if (role === "coach") {
    actions = [
      {
        title: "Create Team",
        path: "/teams/create",
        icon: "🛡️",
        desc: "Form a new collegiate team bracket.",
      },
      {
        title: "Manage Teams",
        path: "/my-teams",
        icon: "👥",
        desc: "Manage and approve player rosters.",
      },
      {
        title: "Register Tournament",
        path: "/RegisterTeam",
        icon: "📝",
        desc: "Register a team for an active tournament.",
      },
      {
        title: "View Schedule",
        path: "/schedule",
        icon: "📅",
        desc: "Check match schedules and venues.",
      },
    ];
  } else if (role === "player") {
    actions = [
      {
        title: "View My Teams",
        path: "/my-teams",
        icon: "🛡️",
        desc: "Check team rosters and positions.",
      },
      {
        title: "View Schedule",
        path: "/schedule",
        icon: "📅",
        desc: "Check upcoming match schedules.",
      },
      {
        title: "Browse Tournaments",
        path: "/tournaments",
        icon: "🏆",
        desc: "Explore upcoming collegiate tournaments.",
      },
    ];
  } else if (role === "sponsor") {
    actions = [
      {
        title: "Browse Tournaments to Sponsor",
        path: "/tournaments",
        icon: "💎",
        desc: "Find upcoming tournaments to sponsor.",
      },
      {
        title: "View My Sponsorships",
        path: "/my-sponsors",
        icon: "📈",
        desc: "Manage sponsored amounts and branding.",
      },
    ];
  }

  if (actions.length === 0) return null;

  return (
    <div className="quick-actions-panel glass-panel">
      <h3>⚡ Quick Actions</h3>
      <div className="quick-actions-grid">
        {actions.map((act, idx) => (
          <Link key={idx} to={act.path} className="action-tile glass-card">
            <span className="tile-icon">{act.icon}</span>
            <div className="tile-content">
              <strong>{act.title}</strong>
              <small>{act.desc}</small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
