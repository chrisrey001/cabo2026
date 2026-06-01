import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../theme";

// Curated, travel/vacation-flavored emoji set for itinerary days.
export const DAY_EMOJIS = [
  "🌞", "🌅", "🌴", "🏖️", "🏝️", "🌊", "🏄", "⛵", "🚤", "🐠",
  "🐚", "🦩", "🐬", "🐳", "🍹", "🍸", "🍾", "🥂", "🍽️", "🌮",
  "🌯", "🍤", "🐟", "🎣", "✈️", "🛬", "🛫", "🚗", "🗺️", "🧭",
  "⛰️", "🏜️", "🌵", "🥾", "🚵", "🏌️", "💆", "💅", "🧖", "🛁",
  "🎉", "🎊", "🥳", "🎂", "🔥", "🎆", "🌙", "⭐", "💃", "🕺",
];

export default function EmojiPicker({ value, onChange, ariaLabel = "Choose emoji" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (emoji) => {
    setOpen(false);
    if (emoji !== value) onChange?.(emoji);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", lineHeight: 1 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={open}
        title="Change emoji"
        style={{
          fontSize: "1.6rem",
          lineHeight: 1,
          padding: 4,
          borderRadius: 10,
          cursor: "pointer",
          transition: "background 0.15s ease",
          background: open ? "rgba(42,157,143,0.12)" : "transparent",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(233,196,106,0.18)")}
        onMouseLeave={(e) =>
          (e.currentTarget.style.background = open ? "rgba(42,157,143,0.12)" : "transparent")
        }
      >
        {value || "🌞"}
      </button>

      {open && (
        <div
          role="menu"
          className="fade-up"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            zIndex: 50,
            width: 268,
            maxHeight: 230,
            overflowY: "auto",
            padding: 10,
            background: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(38,70,83,0.1)",
            boxShadow: "0 18px 40px rgba(38,70,83,0.18)",
            display: "grid",
            gridTemplateColumns: "repeat(8, 1fr)",
            gap: 2,
          }}
        >
          {DAY_EMOJIS.map((emoji) => {
            const selected = emoji === value;
            return (
              <button
                key={emoji}
                type="button"
                role="menuitem"
                onClick={() => pick(emoji)}
                aria-label={`Use ${emoji}`}
                aria-pressed={selected}
                style={{
                  fontSize: "1.25rem",
                  lineHeight: 1,
                  padding: 5,
                  borderRadius: 8,
                  cursor: "pointer",
                  background: selected ? "rgba(42,157,143,0.16)" : "transparent",
                  outline: selected ? `1px solid ${COLORS.teal}` : "none",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(233,196,106,0.22)")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = selected ? "rgba(42,157,143,0.16)" : "transparent")
                }
              >
                {emoji}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
