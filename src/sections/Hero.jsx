import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import confetti from "canvas-confetti";
import { COLORS, FONTS, SPACING, TRIP_START } from "../theme";
import CountdownUnit from "../components/CountdownUnit";

function diff(target) {
  const now = Date.now();
  const ms = target - now;
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

export default function Hero() {
  const targetRef = useRef(new Date(TRIP_START).getTime());
  const [time, setTime] = useState(() => diff(targetRef.current));
  const [clicks, setClicks] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTime(diff(targetRef.current)), 1000);
    return () => clearInterval(id);
  }, []);

  const onTitleClick = () => {
    const next = clicks + 1;
    setClicks(next);
    if (next >= 5) {
      confetti({
        particleCount: 160,
        spread: 90,
        origin: { y: 0.4 },
        colors: [COLORS.coral, COLORS.gold, COLORS.teal, COLORS.foam, COLORS.terracotta],
      });
      setClicks(0);
    }
  };

  const scrollToCast = () => {
    const el = document.getElementById("cast");
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 68;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const Colon = () => (
    <span
      aria-hidden
      style={{
        fontFamily: FONTS.mono,
        fontSize: "clamp(1.6rem, 5vw, 2.6rem)",
        color: COLORS.gold,
        opacity: 0.9,
        fontWeight: 500,
        lineHeight: 1,
        paddingBottom: 18,
      }}
    >
      :
    </span>
  );

  return (
    <section
      id="hero"
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: SPACING.sectionHero,
        color: COLORS.foam,
        overflow: "hidden",
        background: `linear-gradient(160deg, ${COLORS.night} 0%, ${COLORS.indigo} 30%, rgba(231,111,81,0.88) 70%, ${COLORS.coral} 100%)`,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "12%",
          left: "-8%",
          width: "clamp(200px, 55vw, 420px)",
          height: "clamp(200px, 55vw, 420px)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.gold}55 0%, transparent 70%)`,
          filter: "blur(20px)",
          animation: "float 14s ease-in-out infinite",
          zIndex: 1,
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "8%",
          right: "-6%",
          width: "clamp(220px, 65vw, 520px)",
          height: "clamp(220px, 65vw, 520px)",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${COLORS.teal}55 0%, transparent 70%)`,
          filter: "blur(20px)",
          animation: "floatSlow 18s ease-in-out infinite",
          zIndex: 1,
        }}
      />
      <div className="grain" style={{ zIndex: 1 }} />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          textAlign: "center",
          maxWidth: 900,
          margin: "0 auto",
        }}
      >
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: "0.85rem",
            color: COLORS.gold,
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontWeight: 600,
            marginBottom: 24,
          }}
        >
          June 14 – 20, 2026 · Los Cabos, Mexico
        </div>

        <h1
          onClick={onTitleClick}
          style={{
            fontFamily: FONTS.display,
            fontWeight: 900,
            fontSize: "clamp(2.8rem, 9vw, 6rem)",
            lineHeight: 1.02,
            margin: "0 0 28px",
            color: COLORS.foam,
            letterSpacing: "-0.02em",
            cursor: "pointer",
            userSelect: "none",
          }}
          title={clicks > 0 ? `${5 - clicks} more…` : undefined}
        >
          Parents' Getaway
        </h1>

        <p
          style={{
            fontFamily: FONTS.display,
            fontStyle: "italic",
            fontSize: "clamp(1.05rem, 2.2vw, 1.35rem)",
            maxWidth: 640,
            margin: "0 auto 48px",
            opacity: 0.9,
            lineHeight: 1.55,
          }}
        >
          Six nights on the Sea of Cortez. No bedtimes. No schedules. Just salt air, good food, and even better company.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-end",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 44,
          }}
        >
          {time ? (
            <>
              <CountdownUnit value={time.days} label="Days" />
              <Colon />
              <CountdownUnit value={time.hours} label="Hours" />
              <Colon />
              <CountdownUnit value={time.mins} label="Min" />
              <Colon />
              <CountdownUnit value={time.secs} label="Sec" />
            </>
          ) : (
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
                color: COLORS.foam,
              }}
            >
              We made it! 🌅
            </div>
          )}
        </div>

        <button
          onClick={scrollToCast}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: COLORS.coral,
            color: "#fff",
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize: "0.95rem",
            padding: "14px 28px",
            borderRadius: 999,
            boxShadow: "0 10px 30px rgba(231,111,81,0.35)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 14px 36px rgba(231,111,81,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 10px 30px rgba(231,111,81,0.35)";
          }}
        >
          Explore the Trip
          <ChevronDown size={18} />
        </button>
      </div>

      <svg
        aria-hidden
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          bottom: -1,
          left: 0,
          width: "100%",
          height: 110,
          zIndex: 2,
          display: "block",
        }}
      >
        <path
          d="M0,64 C240,120 480,0 720,48 C960,96 1200,24 1440,64 L1440,120 L0,120 Z"
          fill={COLORS.warmWhite}
        />
      </svg>
    </section>
  );
}
