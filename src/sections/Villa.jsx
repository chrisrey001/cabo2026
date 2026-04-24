import React from "react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";
import VillaCarousel from "../components/VillaCarousel";

const VILLA_PHOTOS = [
  { src: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80", alt: "Villa pool and outdoor living" },
  { src: "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80", alt: "Luxury infinity pool overlooking the sea" },
  { src: "https://images.unsplash.com/photo-1615529328331-f8917597711f?w=1200&q=80", alt: "Master bedroom with ocean view" },
  { src: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80", alt: "Open-air living room" },
  { src: "https://images.unsplash.com/photo-1505693314120-0d443867891c?w=1200&q=80", alt: "Terrace at sunset" },
];

const AMENITIES = [
  { icon: "🛏️", label: "3 Kings + 1 Twin-Double" },
  { icon: "⛳", label: "Palmilla Golf Course" },
  { icon: "🏖️", label: "Palmilla Beach" },
  { icon: "🚗", label: "Two Golf Carts" },
  { icon: "💆", label: "One&Only Spa" },
  { icon: "🏊", label: "Dunes Club Access" },
];

export default function Villa() {
  return (
    <section
      id="villa"
      style={{
        background: COLORS.sand,
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="Home Base" title="The Villa" />

        <div style={{ marginTop: 48 }}>
          <VillaCarousel photos={VILLA_PHOTOS} />
        </div>

        <div
          style={{
            position: "relative",
            left: 0,
            right: 0,
            bottom: 0,
            padding: "24px 32px 28px",
            color: COLORS.foam,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 12,
            marginTop: -80,
            zIndex: 1,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: "clamp(1.3rem, 3vw, 2rem)",
              fontWeight: 800,
              letterSpacing: "-0.01em",
            }}
          >
            Villa Dos Mares
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.9rem",
              fontWeight: 500,
              opacity: 0.92,
            }}
          >
            4 Bedrooms · 3,059 sq ft · Palmilla Enclave
          </div>
        </div>

        <div
          style={{
            marginTop: 36,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {AMENITIES.map((a) => (
            <div
              key={a.label}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: "0 6px 16px rgba(38,70,83,0.06)",
                border: "1px solid rgba(38,70,83,0.06)",
              }}
            >
              <span style={{ fontSize: "1.7rem", lineHeight: 1 }}>{a.icon}</span>
              <span
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.92rem",
                  fontWeight: 600,
                  color: COLORS.indigo,
                }}
              >
                {a.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
