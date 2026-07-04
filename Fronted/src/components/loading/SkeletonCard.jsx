import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonCard({ height = "200px", padding = "20px", borderRadius = "16px", style = {} }) {
  return (
    <div
      className="skeleton-glass-card"
      aria-hidden="true"
      style={{
        padding,
        borderRadius,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...style
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <Skeleton width="40%" height="20px" borderRadius="4px" />
        <Skeleton width="85%" height="14px" borderRadius="4px" />
        <Skeleton width="60%" height="14px" borderRadius="4px" />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
        <Skeleton width="30%" height="12px" borderRadius="4px" />
        <Skeleton width="20%" height="24px" borderRadius="8px" />
      </div>
    </div>
  );
}
