import React from "react";
import "../../static/Profile.css";

export default function ProfileTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="profile-tabs glass-panel">
      {tabs.map((tab) => {
        const id = tab.toLowerCase().replace(/\s+/g, "-");
        return (
          <button
            key={id}
            className={`tab-btn ${activeTab === id ? "active" : ""}`}
            onClick={() => onTabChange(id)}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
