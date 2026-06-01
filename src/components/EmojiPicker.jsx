import React, { useEffect } from "react";
import { COLORS } from "../theme";

// Curated, travel/vacation-flavored emoji set for itinerary days.
export const DAY_EMOJIS = [
  "🌞", "🌅", "🌴", "🏖️", "🏝️", "🌊", "🏄", "⛵", "🚤", "🐠",
  "🐚", "🦩", "🐬", "🐳", "🍹", "🍸", "🍾", "🥂", "🍽️", "🌮",
  "🌯", "🍤", "🐟", "🎣", "✈️", "🛬", "🛫", "🚗", "🗺️", "🧭",
  "⛰️", "🏜️", "🌵", "🥾", "🚵", "🏌️", "💆", "💅", "🧖", "🛁",
  "🎉", "🎊", "🥳", "🎂", "🔥", "🎆", "🌙", "⭐", "💃", "🕺",
];

// Trigger button that shows the current emoji and toggles the inline grid.
export function EmojiTrigger({ value, open, onToggle, ariaLabel = "Change emoji" }) {
  return (
    <button
      type="button"
      onClick={onToggle}
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
  );
}

// In-flow grid panel. Rendered inside the card so it grows the card instead of
// being clipped by the card's `overflow: hidden`.
export function EmojiGrid({ value, onSelect, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="menu"
      className="fade-up"
      style={{
        padding: 10,
        background: "rgba(244,241,222,0.5)",
        borderRadius: 12,
        border: "1px solid rgba(38,70,83,0.1)",
        display: "grid",
        gridTemplateColumns: "repeat(10, 1fr)",
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
            onClick={() => onSelect?.(emoji)}
            aria-label={`Use ${emoji}`}
            aria-pressed={selected}
            style={{
              fontSize: "1.3rem",
              lineHeight: 1,
              padding: 6,
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
  );
}
