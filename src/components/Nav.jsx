import React, { useEffect, useState } from "react";
import { Menu, X, Home, Building2, Compass, CalendarDays, LayoutGrid } from "lucide-react";
import { COLORS, FONTS, SECTIONS } from "../theme";
import SaveBadge from "./SaveBadge";
import TripCountdownPill from "./TripCountdownPill";
import { useMobile, useDesktop } from "../hooks/useBreakpoint";

const BOTTOM_TABS = [
  { id: "hero",       label: "Home",    Icon: Home },
  { id: "villa",      label: "Villa",   Icon: Building2 },
  { id: "activities", label: "Explore", Icon: Compass },
  { id: "itinerary",  label: "Plan",    Icon: CalendarDays },
];

export default function Nav() {
  const [active, setActive] = useState("hero");
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const isMobile = useMobile();
  const isDesktop = useDesktop();

  // Close More sheet if user scrolls manually
  useEffect(() => {
    if (!moreOpen) return;
    const close = () => setMoreOpen(false);
    window.addEventListener("scroll", close, { passive: true, once: true });
    return () => window.removeEventListener("scroll", close);
  }, [moreOpen]);

  useEffect(() => {
    const targets = SECTIONS.map((s) => document.getElementById(s.id)).filter(Boolean);
    if (!targets.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: [0, 0.1, 0.25, 0.5, 1] }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 68;
    window.scrollTo({ top, behavior: "smooth" });
    setOpen(false);
    setMoreOpen(false);
  };

  const isTabActive = BOTTOM_TABS.some((t) => t.id === active);

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(255,252,247,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(38,70,83,0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <button
              onClick={() => scrollTo("hero")}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: 0 }}
            >
              <span
                style={{
                  fontFamily: FONTS.display,
                  fontWeight: 900,
                  fontSize: "1.35rem",
                  color: COLORS.indigo,
                  letterSpacing: "-0.01em",
                }}
              >
                Cabo <span style={{ color: COLORS.terracotta }}>'26</span>
              </span>
              <SaveBadge />
            </button>
            <TripCountdownPill />
          </div>

          {isDesktop ? (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "0.82rem",
                      fontWeight: isActive ? 700 : 500,
                      padding: "7px 13px",
                      borderRadius: 999,
                      color: isActive ? "#fff" : COLORS.indigo,
                      background: isActive ? COLORS.teal : "transparent",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = "rgba(42,157,143,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          ) : !isMobile ? (
            // Tablet (768–900px): hamburger dropdown
            <button
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
              style={{
                padding: 8,
                borderRadius: 10,
                color: COLORS.indigo,
                background: open ? "rgba(42,157,143,0.12)" : "transparent",
              }}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          ) : null}
        </div>

        {/* Tablet dropdown */}
        {!isMobile && !isDesktop && open && (
          <div
            style={{
              padding: "8px 16px 18px",
              borderTop: "1px solid rgba(38,70,83,0.08)",
              background: "rgba(255,252,247,0.98)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    style={{
                      fontFamily: FONTS.sans,
                      fontSize: "0.92rem",
                      fontWeight: isActive ? 700 : 500,
                      padding: "11px 14px",
                      borderRadius: 12,
                      textAlign: "left",
                      color: isActive ? "#fff" : COLORS.indigo,
                      background: isActive ? COLORS.teal : "rgba(38,70,83,0.05)",
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Mobile bottom tab bar */}
      {isMobile && (
        <>
          <nav
            aria-label="Main navigation"
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 200,
              background: "rgba(255,252,247,0.96)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderTop: "1px solid rgba(38,70,83,0.08)",
              display: "flex",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {BOTTOM_TABS.map(({ id, label, Icon }) => {
              const isActive = active === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  aria-label={label}
                  style={{
                    flex: 1,
                    height: 56,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    color: isActive ? COLORS.teal : COLORS.muted,
                    transition: "color 0.15s ease",
                  }}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span style={{ fontFamily: FONTS.sans, fontSize: "0.65rem", fontWeight: isActive ? 700 : 500 }}>
                    {label}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              aria-label="All sections"
              style={{
                flex: 1,
                height: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                color: !isTabActive ? COLORS.teal : COLORS.muted,
                transition: "color 0.15s ease",
              }}
            >
              <LayoutGrid size={20} strokeWidth={!isTabActive ? 2.5 : 1.8} />
              <span style={{ fontFamily: FONTS.sans, fontSize: "0.65rem", fontWeight: !isTabActive ? 700 : 500 }}>
                More
              </span>
            </button>
          </nav>

          {/* More bottom sheet */}
          {moreOpen && (
            <>
              <div
                onClick={() => setMoreOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 300,
                  background: "rgba(26,31,58,0.4)",
                  backdropFilter: "blur(4px)",
                  WebkitBackdropFilter: "blur(4px)",
                }}
              />
              <div
                style={{
                  position: "fixed",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  zIndex: 301,
                  background: "#fff",
                  borderRadius: "20px 20px 0 0",
                  padding: "12px 16px",
                  paddingBottom: "calc(env(safe-area-inset-bottom) + 72px)",
                  boxShadow: "0 -12px 40px rgba(38,70,83,0.18)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    background: "rgba(38,70,83,0.15)",
                    margin: "0 auto 16px",
                  }}
                />
                <p style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 700, color: COLORS.night, margin: "0 0 12px 4px" }}>
                  All Sections
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {SECTIONS.map((s) => {
                    const isActive = active === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => scrollTo(s.id)}
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: "0.85rem",
                          fontWeight: isActive ? 700 : 500,
                          padding: "12px 8px",
                          borderRadius: 12,
                          textAlign: "center",
                          color: isActive ? "#fff" : COLORS.indigo,
                          background: isActive ? COLORS.teal : "rgba(38,70,83,0.05)",
                        }}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
