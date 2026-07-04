import React from "react";
import Skeleton from "./Skeleton";
import SkeletonStats from "./SkeletonStats";
import SkeletonTable from "./SkeletonTable";

export default function SkeletonDashboard({ style = {} }) {
  return (
    <div
      className="content"
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        width: "100%",
        padding: "36px 40px",
        ...style
      }}
    >
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <Skeleton width="300px" height="36px" borderRadius="6px" />
          <Skeleton width="500px" height="18px" borderRadius="4px" />
        </div>
        <Skeleton width="160px" height="42px" borderRadius="8px" />
      </div>

      {/* Stats Cards */}
      <SkeletonStats count={6} />

      {/* Quick Actions Panel */}
      <div className="skeleton-glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <Skeleton width="200px" height="24px" borderRadius="4px" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-glass-card" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "10px", height: "100px", justifyContent: "center" }}>
              <Skeleton width="32px" height="32px" borderRadius="50%" />
              <Skeleton width="60%" height="16px" borderRadius="4px" />
              <Skeleton width="80%" height="12px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>

      {/* Panels Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "30px" }}>
        <SkeletonTable rows={5} cols={4} />
        <SkeletonTable rows={5} cols={4} type="avatar" />
      </div>

      {/* Distributions Log Table */}
      <SkeletonTable rows={4} cols={11} />
    </div>
  );
}
