import React, { useEffect, useState } from "react";
import { Cloud, CloudOff, Check } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { hasSupabase } from "../supabase";

const bus = new EventTarget();

export function emitSave(state = "saving") {
  bus.dispatchEvent(new CustomEvent("save", { detail: state }));
}

export default function SaveBadge() {
  const [state, setState] = useState("idle");

  useEffect(() => {
    const handler = (e) => {
      setState(e.detail);
      if (e.detail === "saved") {
        const t = setTimeout(() => setState("idle"), 1400);
        return () => clearTimeout(t);
      }
    };
    bus.addEventListener("save", handler);
    return () => bus.removeEventListener("save", handler);
  }, []);

  if (!hasSupabase) {
    return (
      <span
        title="Supabase not configured — edits are local only"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: FONTS.sans,
          fontSize: "0.72rem",
          color: COLORS.muted,
          padding: "4px 10px",
          borderRadius: 999,
          background: "rgba(38,70,83,0.07)",
        }}
      >
        <CloudOff size={12} /> local
      </span>
    );
  }

  const palette = {
    idle: { bg: "rgba(42,157,143,0.1)", fg: COLORS.teal, icon: <Cloud size={12} />, text: "synced" },
    saving: { bg: "rgba(233,196,106,0.18)", fg: "#8a6a1f", icon: <Cloud size={12} />, text: "saving…" },
    saved: { bg: "rgba(42,157,143,0.18)", fg: COLORS.teal, icon: <Check size={12} />, text: "saved" },
    error: { bg: "rgba(231,111,81,0.18)", fg: COLORS.terracotta, icon: <CloudOff size={12} />, text: "offline" },
  }[state] || { bg: "rgba(42,157,143,0.1)", fg: COLORS.teal, icon: <Cloud size={12} />, text: "synced" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONTS.sans,
        fontSize: "0.72rem",
        fontWeight: 600,
        color: palette.fg,
        padding: "4px 10px",
        borderRadius: 999,
        background: palette.bg,
        transition: "all 0.25s ease",
      }}
    >
      {palette.icon} {palette.text}
    </span>
  );
}
