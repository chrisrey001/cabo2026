import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";

const ACTIVITIES = [
  {
    title: "Flora Farms Dinner",
    icon: "🌿",
    cost: "$80–100/pp",
    duration: "Evening",
    distance: "~20 min drive",
    description:
      "A Michelin-recommended farm-to-table experience on a 25-acre organic farm. Dine under string lights with handcrafted cocktails and produce pulled from the ground that morning. This is the farewell dinner — book 4+ weeks ahead on OpenTable.",
    tag: "Culinary",
  },
  {
    title: "Cabo Arch Boat Tour",
    icon: "⛵",
    cost: "$25–40/pp",
    duration: "2–3 hrs",
    distance: "30 min to Cabo Marina",
    description:
      "Cruise to Land's End to see El Arco — the iconic rock formation where the Pacific meets the Sea of Cortez. Stop at Lover's Beach, spot sea lions, and snap the postcard shot. Morning light is best.",
    tag: "Sightseeing",
  },
  {
    title: "San José Art Walk",
    icon: "🎨",
    cost: "FREE",
    duration: "5–9 PM",
    distance: "10 min to downtown",
    description:
      "Thursday June 18 is the final Art Walk of the season. Local galleries open their doors, street musicians play, and the colonial downtown comes alive. Pair with dinner at Jazamín's afterward.",
    tag: "Culture",
  },
  {
    title: "Deep-Sea Fishing Charter",
    icon: "🎣",
    cost: "$335–520/boat",
    duration: "Half day",
    distance: "10 min to Puerto Los Cabos",
    description:
      "June is peak season for marlin and dorado. Charter a boat from Puerto Los Cabos marina and chase big game in the nutrient-rich waters where the Pacific meets the Cortez. Split the boat 4 ways.",
    tag: "Adventure",
  },
  {
    title: "ATV + Camel + Tequila",
    icon: "🐪",
    cost: "$130–165/pp",
    duration: "3–4 hrs",
    distance: "~30 min drive",
    description:
      "Rip through the Baja desert on ATVs, ride a camel along the dunes, then cap it off with a proper tequila tasting. This is the day you come home with the best stories.",
    tag: "Adventure",
  },
];

const TAG_COLORS = {
  Culinary: COLORS.coral,
  Sightseeing: COLORS.teal,
  Culture: COLORS.terracotta,
  Adventure: COLORS.indigo,
};

export default function Activities() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section
      id="activities"
      style={{
        background: COLORS.warmWhite,
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <SectionHeader eyebrow="Top 5 Experiences" title="Things We'll Actually Do" />

        <div style={{ marginTop: 48, display: "grid", gap: 14 }}>
          {ACTIVITIES.map((a, i) => {
            const open = openIdx === i;
            const tagColor = TAG_COLORS[a.tag] || COLORS.teal;
            return (
              <div
                key={a.title}
                style={{
                  background: "#fff",
                  borderRadius: 16,
                  border: "1px solid rgba(38,70,83,0.08)",
                  boxShadow: open
                    ? "0 16px 40px rgba(38,70,83,0.12)"
                    : "0 6px 18px rgba(38,70,83,0.05)",
                  overflow: "hidden",
                  transition: "box-shadow 0.25s ease",
                }}
              >
                <button
                  onClick={() => setOpenIdx(open ? null : i)}
                  aria-expanded={open}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    padding: "20px 22px",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: FONTS.display,
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: COLORS.night,
                        letterSpacing: "-0.01em",
                        marginBottom: 4,
                      }}
                    >
                      {a.title}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                        fontFamily: FONTS.sans,
                        fontSize: "0.78rem",
                        color: COLORS.muted,
                      }}
                    >
                      <span style={{ fontFamily: FONTS.mono, color: COLORS.teal, fontWeight: 500 }}>
                        {a.cost}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{a.duration}</span>
                      <span aria-hidden>·</span>
                      <span
                        style={{
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.16em",
                          fontSize: "0.68rem",
                          color: tagColor,
                        }}
                      >
                        {a.tag}
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    color={COLORS.muted}
                    style={{
                      transition: "transform 0.25s ease",
                      transform: open ? "rotate(180deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  />
                </button>

                {open && (
                  <div
                    className="fade-up"
                    style={{
                      padding: "0 22px 22px 62px",
                      color: COLORS.indigo,
                      fontFamily: FONTS.sans,
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                    }}
                  >
                    <p style={{ margin: "0 0 12px" }}>{a.description}</p>
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: COLORS.muted,
                        fontWeight: 600,
                      }}
                    >
                      📍 {a.distance}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
