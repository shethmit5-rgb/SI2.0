import React from "react";
import Skeleton from "./Skeleton";
import SkeletonStats from "./SkeletonStats";
import SkeletonCard from "./SkeletonCard";

export default function SkeletonTeam({ style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "30px",
        padding: "30px 20px",
        width: "100%",
        maxWidth: "1200px",
        margin: "0 auto",
        ...style
      }}
    >
      {/* Team Header */}
      <div className="skeleton-glass-card" style={{ height: "200px", padding: "30px", display: "flex", alignItems: "center", gap: "24px" }}>
        <Skeleton width="100px" height="100px" borderRadius="16px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
          <Skeleton width="250px" height="32px" borderRadius="6px" />
          <Skeleton width="150px" height="16px" borderRadius="4px" />
        </div>
      </div>

      <SkeletonStats count={3} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "30px" }}>
        <SkeletonCard height="300px" />
        <SkeletonCard height="300px" />
      </div>
    </div>
  );
}
