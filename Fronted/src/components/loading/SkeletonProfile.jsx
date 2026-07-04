import React from "react";
import Skeleton from "./Skeleton";
import SkeletonStats from "./SkeletonStats";
import SkeletonCard from "./SkeletonCard";

export default function SkeletonProfile({ style = {} }) {
  return (
    <div
      className="profile-page-wrapper"
      aria-hidden="true"
      style={{
        padding: "40px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        ...style
      }}
    >
      {/* Hero Banner */}
      <div className="skeleton-glass-card" style={{ height: "240px", padding: "30px", display: "flex", alignItems: "flex-end", gap: "24px" }}>
        <Skeleton width="100px" height="100px" borderRadius="50%" />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1, marginBottom: "10px" }}>
          <Skeleton width="200px" height="24px" borderRadius="4px" />
          <Skeleton width="150px" height="14px" borderRadius="4px" />
        </div>
      </div>

      {/* Tabs */}
      <div className="skeleton-glass-card" style={{ height: "60px", padding: "12px 20px", display: "flex", gap: "16px", alignItems: "center" }}>
        <Skeleton width="80px" height="32px" borderRadius="6px" />
        <Skeleton width="80px" height="32px" borderRadius="6px" />
        <Skeleton width="80px" height="32px" borderRadius="6px" />
      </div>

      {/* Profile Details Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "30px" }}>
        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <SkeletonCard height="180px" />
          <SkeletonCard height="220px" />
        </div>
        
        {/* Main Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <SkeletonCard height="400px" />
        </div>
      </div>
    </div>
  );
}
