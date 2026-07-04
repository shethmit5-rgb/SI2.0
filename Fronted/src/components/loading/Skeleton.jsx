import React from "react";

export default function Skeleton({ width = "100%", height = "16px", borderRadius = "4px", className = "", style = {} }) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      aria-hidden="true"
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
    />
  );
}
