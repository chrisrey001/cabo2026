import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { COLORS, FONTS, SPACING, TRIP_START } from "../theme";

export default function CTA() {
  const [daysOut, setDaysOut] = useState(() => computeDays());

  useEffect(() => {
    const id = setInterval(() => setDaysOut(computeDays()), 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const onImIn = () => {
    const end = Date.now() + 3000;
    const colors = [COLORS.coral, COLORS.gold, COLORS.teal, COLORS.foam, COLORS.terracotta];
    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  return (
    <section
      id="cta"
      style={{
        position: "relative",
        overflow: "hidden",
        padding: SPACING.sectionHero,
        background: `linear-gradient(160deg, ${COLORS.indigo} 0%, ${COLORS.night} 40%, rgba(231,111,81,0.66) 100%)`,
        color: COLORS.foam,
        textAlign: "center",
      }}
    >
      <div className="grain" />
      <div style={{ position: "relative", zIndex: 2, maxWidth: 600, margin: "0 auto" }}>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: "0.8rem",
            fontWeight: 700,
            color: COLORS.gold,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            marginBottom: 18,
          }}
        >
          {daysOut === null ? "We did it." : `T-minus ${daysOut} days`}
        </div>

        <h2
          style={{
            fontFamily: FONTS.display,
            fontSize: "clamp(2.2rem, 8vw, 4rem)",
            fontWeight: 900,
            color: COLORS.foam,
            margin: "0 0 22px",
            letterSpacing: "-0.02em",
          }}
        >
          Let's Go.
        </h2>

        <p
          style={{
            fontFamily: FONTS.display,
            fontStyle: "italic",
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            lineHeight: 1.6,
            opacity: 0.92,
            margin: "0 0 36px",
          }}
        >
          Six nights. Sea of Cortez. No alarm clocks, no kids' menu negotiations, no bedtime math. Just us — tan, fed, and finally rested.
        </p>

        <button
          onClick={onImIn}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: COLORS.coral,
            color: "#fff",
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize: "1rem",
            padding: "15px 34px",
            borderRadius: 999,
            boxShadow: "0 8px 30px rgba(244,132,95,0.44)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(244,132,95,0.55)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(244,132,95,0.44)";
          }}
        >
          🌅 I'm In
        </button>

        <div
          style={{
            marginTop: 56,
            fontFamily: FONTS.sans,
            fontSize: "0.8rem",
            opacity: 0.55,
          }}
        >
          Built with love by Chris · Villa booked via Inspirato · See you in Cabo
        </div>
        <div
          style={{
            marginTop: 10,
            fontFamily: FONTS.sans,
            fontSize: "0.7rem",
            opacity: 0.2,
            fontStyle: "italic",
          }}
        >
          (Psst — try clicking the title 5 times)
        </div>
      </div>
    </section>
  );
}

function computeDays() {
  const target = new Date(TRIP_START).getTime();
  const ms = target - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / 86_400_000);
}
