import React from "react";
import "../../static/Profile.css";

export default function ProfileLayout({ hero, tabs, sidebar, content }) {
  return (
    <div className="profile-page-wrapper">
      {/* Dynamic Header Hero Section */}
      <div className="profile-hero-wrapper">
        {hero}
      </div>

      {/* Tabs Selector */}
      <div className="profile-tabs-wrapper">
        {tabs}
      </div>

      {/* Responsive Grid System: 3-column on Desktop, 2-column on Tablet, 1-column on Mobile */}
      <div className="profile-grid-container">
        {/* Left Side: Profile Information, Settings, and Actions */}
        <div className="profile-sidebar-column">
          {sidebar}
        </div>

        {/* Right Side: Main Stats, Charts, Achievements, and Lists */}
        <div className="profile-main-column">
          {content}
        </div>
      </div>
    </div>
  );
}
