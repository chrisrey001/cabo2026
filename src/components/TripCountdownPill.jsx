import React, { useEffect, useState } from "react";
import { COLORS, FONTS } from "../theme";
import { getCountdownLabel } from "../utils/trip";

export default function TripCountdownPill() {
  const [label, setLabel] = useState(getCountdownLabel);

  useEffect(() => {
    const id = setInterval(() => setLabel(getCountdownLabel()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        fontFamily: FONTS.mono,
        fontSize: "0.72rem",
        fontWeight: 600,
        color: COLORS.terracotta,
        background: "rgba(231,111,81,0.1)",
        padding: "5px 11px",
        borderRadius: 999,
        whiteSpace: "nowrap",
        letterSpacing: "0.02em",
        lineHeight: 1.4,
      }}
    >
      {label}
    </span>
  );
}
