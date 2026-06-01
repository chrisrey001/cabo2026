import React from "react";

export default function CenteredGrid({ minWidth = 220, gap = 20, maxCols = 5, style, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", ...style }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
          gap,
          width: "100%",
          maxWidth: minWidth * maxCols + gap * (maxCols - 1),
        }}
      >
        {children}
      </div>
    </div>
  );
}
