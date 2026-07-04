import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonForm({ fields = 4, style = {} }) {
  return (
    <div
      className="skeleton-glass-card"
      aria-hidden="true"
      style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        ...style
      }}
    >
      <Skeleton width="30%" height="24px" borderRadius="4px" style={{ marginBottom: "8px" }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px"
        }}
      >
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Skeleton width="40%" height="14px" borderRadius="4px" />
            <Skeleton width="100%" height="40px" borderRadius="8px" />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px" }}>
        <Skeleton width="100px" height="40px" borderRadius="8px" />
        <Skeleton width="140px" height="40px" borderRadius="8px" />
      </div>
    </div>
  );
}
