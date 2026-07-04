import React from "react";
import Skeleton from "./Skeleton";
import SkeletonStats from "./SkeletonStats";
import SkeletonTable from "./SkeletonTable";

export default function SkeletonTournament({ style = {} }) {
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
      {/* Tournament Hero */}
      <div className="skeleton-glass-card" style={{ height: "280px", padding: "40px", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "16px" }}>
        <Skeleton width="100px" height="24px" borderRadius="12px" />
        <Skeleton width="400px" height="42px" borderRadius="6px" />
        <div style={{ display: "flex", gap: "16px" }}>
          <Skeleton width="120px" height="16px" borderRadius="4px" />
          <Skeleton width="120px" height="16px" borderRadius="4px" />
        </div>
      </div>

      {/* Overview Cards */}
      <SkeletonStats count={4} />

      {/* Tabs */}
      <div className="skeleton-glass-card" style={{ height: "65px", padding: "12px 24px", display: "flex", gap: "16px", alignItems: "center" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} width="100px" height="36px" borderRadius="8px" />
        ))}
      </div>

      {/* Content layout */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "30px" }}>
        <SkeletonTable rows={6} cols={4} />
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <div className="skeleton-glass-card" style={{ padding: "24px", height: "180px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton width="50%" height="20px" borderRadius="4px" />
            <Skeleton width="100%" height="40px" borderRadius="8px" />
            <Skeleton width="100%" height="40px" borderRadius="8px" />
          </div>
          <div className="skeleton-glass-card" style={{ padding: "24px", height: "200px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Skeleton width="60%" height="20px" borderRadius="4px" />
            <Skeleton width="80%" height="14px" borderRadius="4px" />
            <Skeleton width="90%" height="14px" borderRadius="4px" />
            <Skeleton width="40%" height="14px" borderRadius="4px" />
          </div>
        </div>
      </div>
    </div>
  );
}
