import React from "react";
import Skeleton from "./Skeleton";
import SkeletonAvatar from "./SkeletonAvatar";

export default function SkeletonTable({ rows = 8, cols = 4, type = "default", noCard = false, style = {} }) {
  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Skeleton width="200px" height="24px" borderRadius="4px" />
        <Skeleton width="100px" height="32px" borderRadius="8px" />
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} style={{ padding: "12px 16px", textAlign: "left" }}>
                <Skeleton width="80px" height="14px" borderRadius="4px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rIndex) => (
            <tr key={rIndex} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
              {Array.from({ length: cols }).map((_, cIndex) => (
                <td key={cIndex} style={{ padding: "16px" }}>
                  {cIndex === 0 && type === "avatar" ? (
                    <SkeletonAvatar size="32px" />
                  ) : cIndex === cols - 1 ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Skeleton width="48px" height="24px" borderRadius="6px" />
                      <Skeleton width="48px" height="24px" borderRadius="6px" />
                    </div>
                  ) : (
                    <Skeleton width={cIndex % 2 === 0 ? "70%" : "50%"} height="14px" borderRadius="4px" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  if (noCard) {
    return (
      <div aria-hidden="true" style={{ overflowX: "auto", ...style }}>
        {content}
      </div>
    );
  }

  return (
    <div
      className="skeleton-glass-card"
      aria-hidden="true"
      style={{
        padding: "24px",
        overflowX: "auto",
        ...style
      }}
    >
      {content}
    </div>
  );
}
