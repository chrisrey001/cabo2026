import React, { useEffect, useState } from "react";
import { X, Plus, SkipForward } from "lucide-react";
import { COLORS, FONTS } from "../theme";

const TAG_COLORS = {
  Culinary: COLORS.coral,
  Sightseeing: COLORS.teal,
  Culture: COLORS.terracotta,
  Adventure: COLORS.indigo,
};

export default function SuggestionsModal({ suggestions: initial, onAdd, onClose }) {
  const [remaining, setRemaining] = useState(initial);

  useEffect(() => {
    if (remaining.length === 0) onClose();
  }, [remaining, onClose]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const skip = (idx) => setRemaining((prev) => prev.filter((_, i) => i !== idx));
  const add = (s, idx) => {
    onAdd(s);
    skip(idx);
  };

  if (!remaining.length) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="AI activity suggestions"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(26,31,58,0.6)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: COLORS.warmWhite,
          borderRadius: 22,
          width: "100%",
          maxWidth: 580,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 72px rgba(26,31,58,0.22)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 24px 16px",
            borderBottom: "1px solid rgba(38,70,83,0.08)",
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontFamily: FONTS.display, fontSize: "1.3rem", fontWeight: 800, color: COLORS.night, letterSpacing: "-0.01em" }}>
              ✨ Ideas from Claude
            </div>
            <div style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted, marginTop: 2 }}>
              {remaining.length} suggestion{remaining.length !== 1 ? "s" : ""} — Add what looks good, skip the rest
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ padding: 8, borderRadius: 10, color: COLORS.muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Suggestion list */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          {remaining.map((s, idx) => {
            const tagColor = TAG_COLORS[s.tag] || COLORS.teal;
            return (
              <div
                key={idx}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid rgba(38,70,83,0.08)",
                  boxShadow: "0 4px 14px rgba(38,70,83,0.06)",
                  flexShrink: 0,
                }}
              >
                <div style={{ padding: "18px 20px 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 8 }}>
                    <span style={{ fontSize: "2rem", lineHeight: 1, flexShrink: 0 }}>{s.icon || "✨"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FONTS.display, fontSize: "1.1rem", fontWeight: 700, color: COLORS.night, letterSpacing: "-0.01em", marginBottom: 4 }}>
                        {s.title}
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontFamily: FONTS.mono, fontSize: "0.8rem", color: COLORS.teal, fontWeight: 500 }}>{s.cost}</span>
                        {s.duration && <><span style={{ color: COLORS.muted }}>·</span><span style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted }}>{s.duration}</span></>}
                        {s.tag && (
                          <span style={{ fontFamily: FONTS.sans, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color: tagColor }}>
                            {s.tag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {s.description && (
                    <p style={{ fontFamily: FONTS.sans, fontSize: "0.88rem", color: COLORS.indigo, lineHeight: 1.55, margin: "0 0 4px 0" }}>
                      {s.description}
                    </p>
                  )}
                  {s.distance && (
                    <div style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted }}>📍 {s.distance}</div>
                  )}
                </div>
                <div
                  style={{
                    borderTop: "1px solid rgba(38,70,83,0.07)",
                    display: "grid",
                    gridTemplateColumns: "1fr 1px 1fr",
                    alignItems: "stretch",
                  }}
                >
                  <button
                    onClick={() => skip(idx)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "12px", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600,
                      color: COLORS.muted, transition: "background 0.15s ease",
                      borderBottomLeftRadius: 16,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(38,70,83,0.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <SkipForward size={14} /> Skip
                  </button>
                  <span aria-hidden style={{ background: "rgba(38,70,83,0.07)" }} />
                  <button
                    onClick={() => add(s, idx)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      padding: "12px", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 700,
                      color: COLORS.teal, transition: "background 0.15s ease",
                      borderBottomRightRadius: 16,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Plus size={14} /> Add to Experiences
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
