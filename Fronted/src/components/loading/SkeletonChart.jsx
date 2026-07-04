import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonChart({ height = "300px", type = "bar", style = {} }) {
  return (
    <div
      className="skeleton-glass-card"
      aria-hidden="true"
      style={{
        padding: "24px",
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...style
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Skeleton width="180px" height="20px" borderRadius="4px" />
        <Skeleton width="90px" height="14px" borderRadius="4px" />
      </div>
      
      {/* Chart Mock Body */}
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "24px", padding: "20px 10px", position: "relative" }}>
        {type === "bar" ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%" }}>
              <div style={{ flex: 1, display: "flex", alignItems: "flex-end", width: "100%" }}>
                <Skeleton
                  width="100%"
                  height={`${Math.max(15, Math.floor(Math.random() * 80) + 15)}%`}
                  borderRadius="6px 6px 0 0"
                />
              </div>
              <Skeleton width="24px" height="10px" borderRadius="2px" />
            </div>
          ))
        ) : type === "pie" ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", gap: "32px", height: "100%" }}>
            <Skeleton width="140px" height="140px" borderRadius="50%" />
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Skeleton width="80px" height="14px" borderRadius="4px" />
              <Skeleton width="60px" height="14px" borderRadius="4px" />
              <Skeleton width="70px" height="14px" borderRadius="4px" />
            </div>
          </div>
        ) : (
          /* Line chart mock */
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ flex: 1, width: "100%", borderLeft: "2px solid rgba(255,255,255,0.08)", borderBottom: "2px solid rgba(255,255,255,0.08)", position: "relative", overflow: "hidden" }}>
              <svg width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}>
                <path
                  d="M0,80 Q50,20 100,60 T200,30 T300,90 T400,40"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: "absolute", bottom: "10%", left: "20%" }}><Skeleton width="8px" height="8px" borderRadius="50%" /></div>
              <div style={{ position: "absolute", bottom: "40%", left: "45%" }}><Skeleton width="8px" height="8px" borderRadius="50%" /></div>
              <div style={{ position: "absolute", bottom: "70%", left: "75%" }}><Skeleton width="8px" height="8px" borderRadius="50%" /></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <Skeleton width="30px" height="10px" borderRadius="2px" />
              <Skeleton width="30px" height="10px" borderRadius="2px" />
              <Skeleton width="30px" height="10px" borderRadius="2px" />
              <Skeleton width="30px" height="10px" borderRadius="2px" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
