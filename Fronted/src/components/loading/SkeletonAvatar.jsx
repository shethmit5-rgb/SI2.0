import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonAvatar({ size = "40px", withText = true, layout = "horizontal", style = {} }) {
  if (!withText) {
    return <Skeleton width={size} height={size} borderRadius="50%" style={style} />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: layout === "horizontal" ? "row" : "column",
        alignItems: layout === "horizontal" ? "center" : "flex-start",
        gap: "12px",
        ...style
      }}
      aria-hidden="true"
    >
      <Skeleton width={size} height={size} borderRadius="50%" />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
        <Skeleton width="120px" height="14px" borderRadius="4px" />
        <Skeleton width="80px" height="10px" borderRadius="4px" />
      </div>
    </div>
  );
}
