import React, { useState } from "react";
import { FONTS } from "../theme";

function hueFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xfffffff;
  return h % 360;
}

function Pill({ voter }) {
  const hue = hueFromId(voter.voter_id);
  const initial = voter.voter_name ? voter.voter_name[0].toUpperCase() : "?";
  const bg = `hsl(${hue}, 55%, 62%)`;
  return (
    <div
      title={voter.voter_name || "Anonymous"}
      style={{
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONTS.sans,
        fontWeight: 700,
        fontSize: "0.75rem",
        color: "#fff",
        flexShrink: 0,
        border: "2px solid #fff",
        cursor: "default",
      }}
    >
      {initial}
    </div>
  );
}

export default function VoterPills({ voters = [], max = 6 }) {
  const [expanded, setExpanded] = useState(false);
  if (!voters.length) return null;

  const shown = expanded ? voters : voters.slice(0, max);
  const overflow = voters.length - max;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
      {shown.map((v) => (
        <Pill key={v.voter_id} voter={v} />
      ))}
      {!expanded && overflow > 0 && (
        <button
          onClick={() => setExpanded(true)}
          style={{
            fontFamily: FONTS.sans,
            fontSize: "0.75rem",
            fontWeight: 600,
            color: "rgba(38,70,83,0.55)",
            padding: "2px 6px",
          }}
        >
          +{overflow} more
        </button>
      )}
    </div>
  );
}
