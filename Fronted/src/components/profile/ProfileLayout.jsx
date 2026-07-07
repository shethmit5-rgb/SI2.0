import React from "react";
import "../../static/Profile.css";

export default function ProfileLayout({ hero, tabs, sidebar, content, role }) {
  if (role === "organizer" || role === "coach" || role === "admin") {
    if (role === "admin") {
      return (
        <div className="profile-page-wrapper-3col">
          {/* Dynamic Header Hero Section */}
          <div className="profile-hero-wrapper">
            {hero}
          </div>

          {/* Tabs Selector */}
          <div className="profile-tabs-wrapper">
            {tabs}
          </div>

          <div className="profile-grid-container-3col" style={{ marginTop: "20px" }}>
            {/* Column 1: Left Sidebar */}
            <div className="profile-sidebar-left">
              {sidebar?.left}
            </div>

            {/* Column 2: Center Content */}
            <div className="profile-main-center">
              <div className="profile-center-body">{content?.center}</div>
            </div>

            {/* Column 3: Right Sidebar */}
            <div className="profile-sidebar-right">
              {sidebar?.right}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="profile-page-wrapper-3col">
        <div className="profile-grid-container-3col">
          {/* Column 1: Left Sidebar */}
          <div className="profile-sidebar-left">
            {sidebar?.left}
          </div>

          {/* Column 2: Center Content */}
          <div className="profile-main-center">
            <div className="profile-hero-wrapper">{hero}</div>
            <div className="profile-tabs-wrapper">{tabs}</div>
            <div className="profile-center-body">{content?.center}</div>
          </div>

          {/* Column 3: Right Sidebar */}
          <div className="profile-sidebar-right">
            {sidebar?.right}
          </div>
        </div>
      </div>
    );
  }

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
