import React, { useState } from "react";
import "../../static/Profile.css";

export default function ProfileHero({
  name,
  role,
  email,
  createdAt,
  preview,
  isEditing,
  handleImageChange,
  primaryStats = [],
  form = {},
  organizationName,
  brandName,
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // 1. Calculate Profile Completeness Percentage
  const completenessItems = [
    { name: "Profile Photo", present: !!preview },
    { name: "Bio / Description", present: !!form.description },
    { name: "Phone Number", present: !!form.phoneNumber },
    { name: "Location", present: !!form.location },
  ];

  if (role === "organizer") {
    completenessItems.push({ name: "Organization Name", present: !!organizationName || !!form.organizationName });
  } else if (role === "sponsor") {
    completenessItems.push({ name: "Brand Name", present: !!brandName || !!form.brandName });
  } else if (role === "coach") {
    completenessItems.push({ name: "Experience / Bio", present: !!form.description });
  } else if (role === "player") {
    completenessItems.push({ name: "Gender", present: !!form.gender });
  }

  const completedCount = completenessItems.filter(item => item.present).length;
  const completenessPercent = Math.round((completedCount / completenessItems.length) * 100);
  const missingItems = completenessItems.filter(item => !item.present).map(item => item.name);

  // 2. Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // 3. Determine Banner Gradient Class
  const bannerClass = `profile-header-banner banner-theme-${role.toLowerCase()}`;

  return (
    <div className="profile-hero-card glass-panel">
      {/* Identity block */}
      <div className="profile-hero-identity">
        {/* Profile Photo */}
        <div className="profile-avatar-wrapper">
          <img
            src={
              preview ||
              `https://ui-avatars.com/api/?name=${name || "User"}&background=4f46e5&color=fff`
            }
            alt="profile"
            className={`profile-avatar ${imageLoaded ? "loaded" : "loading"}`}
            onLoad={() => setImageLoaded(true)}
            style={{
              opacity: imageLoaded ? 1 : 0.6,
              transition: "opacity 0.4s ease-in-out"
            }}
          />
        </div>

        {/* User Details */}
        <div className="profile-hero-details">
          <div className="profile-hero-name-row">
            <h1 className="profile-name">
              {name || "Your Name"}
              <span className="verified-badge-premium" title="Verified Account">✔</span>
            </h1>
            <span className={`role-badge-premium badge-theme-${role.toLowerCase()}`}>
              {role.toUpperCase()}
            </span>
          </div>

          {/* Subtitle for role-specific organization/brand names */}
          {role === "organizer" && (
            <div className="profile-hero-subtitle">
              🏛️ {form.organizationName || "No Organization Name Added"}
            </div>
          )}
          {role === "sponsor" && (
            <div className="profile-hero-subtitle">
              💎 {form.brandName || "No Brand Name Added"}
            </div>
          )}

          <p className="profile-email-joined">
            <span>✉ {email}</span>
            <span className="bullet-separator">•</span>
            <span>📅 Member Since {formatDate(createdAt)}</span>
          </p>

          {/* Completeness Bar */}
          <div className="profile-completeness-section">
            <div className="completeness-label-row">
              <span>Profile Completeness:</span>
              <strong className="completeness-percentage">{completenessPercent}%</strong>
            </div>
            <div className="completeness-bar-bg">
              <div 
                className="completeness-bar-fill" 
                style={{ width: `${completenessPercent}%` }}
              ></div>
            </div>
            {missingItems.length > 0 && (
              <p className="missing-fields-text">
                Missing: {missingItems.join(", ")}
              </p>
            )}
          </div>
        </div>

        {/* Hero Level Stats */}
        <div className="profile-hero-stats">
          {primaryStats.map((stat, idx) => (
            <div key={idx} className="hero-stat-card glass-card">
              <span className="hero-stat-value">{stat.value}</span>
              <span className="hero-stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
