import React from "react";
import { COLORS, FONTS } from "../theme";

export default function CountdownUnit({ value, label }) {
  const padded = String(value).padStart(2, "0");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 72,
      }}
    >
      <span
        style={{
          fontFamily: FONTS.mono,
          fontSize: "clamp(2rem, 6vw, 3.2rem)",
          fontWeight: 500,
          color: COLORS.foam,
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}
      >
        {padded}
      </span>
      <span
        style={{
          fontFamily: FONTS.sans,
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.2em",
          color: COLORS.gold,
          marginTop: 8,
        }}
      >
        {label}
      </span>
    </div>
  );
}
