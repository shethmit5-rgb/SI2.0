import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonMatch({ items = 4, style = {} }) {
  return (
    <div
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "100%",
        ...style
      }}
    >
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="skeleton-glass-card"
          style={{
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          {/* Team 1 info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "150px" }}>
            <Skeleton width="32px" height="32px" borderRadius="50%" />
            <Skeleton width="100px" height="16px" borderRadius="4px" />
          </div>

          {/* VS Details */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", width: "100px" }}>
            <Skeleton width="40px" height="14px" borderRadius="4px" />
            <Skeleton width="24px" height="24px" borderRadius="50%" />
            <Skeleton width="60px" height="10px" borderRadius="2px" />
          </div>

          {/* Team 2 info */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexDirection: "row-reverse", flex: 1, minWidth: "150px", textAlign: "right" }}>
            <Skeleton width="32px" height="32px" borderRadius="50%" />
            <Skeleton width="100px" height="16px" borderRadius="4px" />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", width: "120px", justifyContent: "flex-end" }}>
            <Skeleton width="80px" height="32px" borderRadius="6px" />
          </div>
        </div>
      ))}
    </div>
  );
}
