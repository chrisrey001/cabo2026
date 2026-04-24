import React from "react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";
import CenteredGrid from "../components/CenteredGrid";
import { useForecast } from "../hooks/useForecast";

const STATS = [
  { label: "Humidity", value: "63 – 66%" },
  { label: "Ocean Temp", value: "81°F" },
  { label: "Rain", value: "~0 in." },
];

function formatTime(iso) {
  if (!iso) return "";
  const parts = iso.split("T");
  if (parts.length < 2) return iso;
  return parts[1].slice(0, 5);
}

export default function Weather() {
  const { days, isLive, loading } = useForecast();

  return (
    <section
      id="weather"
      style={{
        background: `linear-gradient(135deg, ${COLORS.night} 0%, ${COLORS.indigo} 100%)`,
        padding: "100px 24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="grain" />
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="June in Cabo" title="The Forecast" light />

        {!loading && !isLive && (
          <p
            style={{
              textAlign: "center",
              fontFamily: FONTS.mono,
              fontSize: "0.72rem",
              color: "rgba(244,241,222,0.45)",
              margin: "16px 0 0",
              letterSpacing: "0.04em",
            }}
          >
            ⊘ Showing seasonal averages · live data available ~30 days out
          </p>
        )}

        <CenteredGrid minWidth={110} gap={14} style={{ marginTop: 32 }}>
          {days.map((d) => (
            <div
              key={d.day + d.date}
              style={{
                padding: "20px 14px",
                borderRadius: 16,
                background: "rgba(255,252,247,0.06)",
                border: "1px solid rgba(255,252,247,0.12)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                textAlign: "center",
                color: COLORS.foam,
              }}
            >
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: COLORS.gold,
                  textTransform: "uppercase",
                }}
              >
                {d.day}
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "0.78rem",
                  color: "rgba(244,241,222,0.6)",
                  marginTop: 2,
                }}
              >
                Jun {d.date}
              </div>
              <div style={{ fontSize: "1.9rem", margin: "10px 0 6px", lineHeight: 1 }}>{d.emoji}</div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "1.5rem",
                  fontWeight: 500,
                  color: COLORS.foam,
                  letterSpacing: "-0.01em",
                }}
              >
                {d.hi}°
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.72rem",
                  color: "rgba(244,241,222,0.55)",
                  marginTop: 2,
                }}
              >
                {d.lo}° low
              </div>
              {d.sunrise && (
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "0.62rem",
                    color: COLORS.gold,
                    marginTop: 8,
                    lineHeight: 1.5,
                  }}
                >
                  🌅 {formatTime(d.sunrise)}
                  <br />
                  🌇 {formatTime(d.sunset)}
                </div>
              )}
            </div>
          ))}
        </CenteredGrid>

        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                padding: "18px 20px",
                borderRadius: 14,
                background: "rgba(255,252,247,0.05)",
                border: "1px solid rgba(255,252,247,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: COLORS.foam,
              }}
            >
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: COLORS.gold,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                }}
              >
                {s.label}
              </span>
              <span
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: "1.05rem",
                  color: COLORS.foam,
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
