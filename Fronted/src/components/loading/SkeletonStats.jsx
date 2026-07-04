import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonStats({ count = 4, style = {} }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        width: "100%",
        ...style
      }}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton-glass-card"
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            height: "110px",
            justifyContent: "center"
          }}
        >
          <Skeleton width="45%" height="14px" borderRadius="4px" />
          <Skeleton width="75%" height="32px" borderRadius="6px" />
        </div>
      ))}
    </div>
  );
}
