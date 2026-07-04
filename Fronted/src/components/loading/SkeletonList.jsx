import React from "react";
import Skeleton from "./Skeleton";
import SkeletonAvatar from "./SkeletonAvatar";

export default function SkeletonList({ items = 5, style = {} }) {
  return (
    <div
      className="skeleton-glass-card"
      aria-hidden="true"
      style={{
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        ...style
      }}
    >
      <Skeleton width="25%" height="20px" borderRadius="4px" style={{ marginBottom: "8px" }} />
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.04)"
          }}
        >
          <SkeletonAvatar size="36px" />
          <Skeleton width="80px" height="12px" borderRadius="4px" />
        </div>
      ))}
    </div>
  );
}
