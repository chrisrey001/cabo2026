import React from "react";
import { COLORS, FONTS, SPACING } from "../theme";
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
  const { days, isLive, liveCount, total, current, loading } = useForecast();

  const allLive = liveCount === total;
  const statusNote = !isLive
    ? "⊘ Showing seasonal averages · live data available ~16 days out"
    : allLive
    ? "● Live forecast · updated hourly via Open-Meteo"
    : `● Live forecast · ${liveCount} of ${total} days in range · later days show seasonal averages for now`;

  return (
    <section
      id="weather"
      style={{
        background: `linear-gradient(135deg, ${COLORS.night} 0%, ${COLORS.indigo} 100%)`,
        padding: SPACING.section,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="grain" />
      <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="June in Cabo" title="The Forecast" light />

        {!loading && (
          <p
            style={{
              textAlign: "center",
              fontFamily: FONTS.mono,
              fontSize: "0.72rem",
              color: isLive ? "rgba(42,157,143,0.85)" : "rgba(244,241,222,0.45)",
              margin: "16px 0 0",
              letterSpacing: "0.04em",
            }}
          >
            {statusNote}
          </p>
        )}

        {!loading && current && (
          <div
            style={{
              maxWidth: 540,
              margin: "26px auto 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 18,
              padding: "18px 24px",
              borderRadius: 18,
              background: "rgba(255,252,247,0.08)",
              border: "1px solid rgba(255,252,247,0.16)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              color: COLORS.foam,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: "2.6rem", lineHeight: 1 }}>{current.emoji}</span>
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontFamily: FONTS.sans,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: COLORS.gold,
                  }}
                >
                  <span className="live-dot" aria-hidden />
                  Right now in Cabo
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: "2.1rem",
                    fontWeight: 500,
                    letterSpacing: "-0.01em",
                    marginTop: 4,
                    lineHeight: 1,
                  }}
                >
                  {current.temp}°
                </div>
              </div>
            </div>
            <div
              style={{
                fontFamily: FONTS.sans,
                fontSize: "0.8rem",
                color: "rgba(244,241,222,0.7)",
                textAlign: "right",
                lineHeight: 1.7,
              }}
            >
              Feels {current.feelsLike}°
              <br />
              Humidity {current.humidity}%
              <br />
              Wind {current.wind} mph
            </div>
          </div>
        )}

        <CenteredGrid minWidth={116} gap={14} maxCols={7} style={{ marginTop: 32 }}>
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
                    fontSize: "0.75rem",
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
