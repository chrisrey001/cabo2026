import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";
import CopyButton from "../components/CopyButton";

const LOGISTICS = [
  {
    title: "💵 Money",
    content:
      "Mexican Peso (MXN). USD widely accepted in tourist areas. ATMs at SJD airport give good rates. Credit cards accepted almost everywhere — Visa/Mastercard preferred. Notify your bank before travel.",
  },
  {
    title: "💰 Tipping",
    content:
      "10–20% at restaurants (check if included). Hotel staff: 50–100 MXN/day. Tour guides: 15–20% of tour cost. Golf cart / valet: 50–100 MXN. In USD, $1–5 tips work well.",
  },
  {
    title: "🕐 Time Zone",
    content:
      "Mountain Standard Time (MST) year-round — NO daylight saving. Same as Denver in winter, 1 hour behind Denver in summer. When we arrive June 14, Cabo will be 1 hour behind Denver.",
  },
  {
    title: "✈️ Airport Tips",
    content:
      "SJD has two terminals — Southwest uses Terminal 1. Immigration line can be 20–45 min. Have your customs form ready. Skip the timeshare gauntlet outside arrivals. Pre-arrange transport or use the Palmilla shuttle.",
  },
  {
    title: "🏥 Health & Safety",
    content:
      "Tap water: drink bottled only. Ice at restaurants is purified (safe). Bring Imodium just in case. Palmilla area is very safe — gated community. Stay hydrated — dry heat sneaks up on you.",
  },
  {
    title: "📞 Emergency Contacts",
    content:
      "Emergency: 911 (works in Mexico)\nUS Consulate Cabo: +52 624 143 3566\nPalmilla Concierge: +52 624 146 7000\nVilla Manager (via Inspirato): check booking confirmation",
  },
];

const PHONE_RE = /\+?\d[\d\s()-]{6,}/g;

export default function Logistics() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section
      id="logistics"
      style={{
        background: COLORS.sand,
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <SectionHeader eyebrow="Need to Know" title="The Logistics" />

        <div style={{ marginTop: 48, display: "grid", gap: 12 }}>
          {LOGISTICS.map((item, i) => {
            const open = openIdx === i;
            return (
              <div
                key={item.title}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  border: "1px solid rgba(38,70,83,0.08)",
                  boxShadow: open
                    ? "0 12px 28px rgba(38,70,83,0.09)"
                    : "0 3px 10px rgba(38,70,83,0.04)",
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
                    justifyContent: "space-between",
                    gap: 14,
                    padding: "16px 20px",
                    textAlign: "left",
                    fontFamily: FONTS.display,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: COLORS.night,
                  }}
                >
                  {item.title}
                  <ChevronDown
                    size={18}
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
                      padding: "0 20px 20px",
                      fontFamily: FONTS.sans,
                      fontSize: "0.92rem",
                      lineHeight: 1.6,
                      color: COLORS.indigo,
                    }}
                  >
                    {item.content.split("\n").map((line, j) => (
                      <LineWithCopy key={j} line={line} />
                    ))}
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

function LineWithCopy({ line }) {
  const phones = line.match(PHONE_RE) || [];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        padding: "4px 0",
      }}
    >
      <span style={{ flex: "1 1 220px", minWidth: 0 }}>{line}</span>
      {phones.map((p, i) => (
        <CopyButton key={`${p}-${i}`} value={p.trim()} />
      ))}
    </div>
  );
}
