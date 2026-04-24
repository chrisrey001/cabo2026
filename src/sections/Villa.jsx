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

const VILLA_DESCRIPTION = `Villa Dos Mares sits within the gated Palmilla Enclave, one of Los Cabos' most prestigious private residential communities. The villa's name — "Two Seas" — nods to its perch between the Pacific Ocean and the Sea of Cortez, where the waters famously converge at Land's End.

The 3,059 sq ft floor plan is designed for living outside. Multiple terraces spill from the interior living spaces, and the private pool becomes the natural gathering place for afternoons in the Baja sun. Inside, three king suites and a twin-double bedroom offer generous space for a group, each finished with high ceilings and natural materials that keep things cool even in June.

As Palmilla Enclave residents, we have direct access to Palmilla Beach — one of the few calm, swimmable beaches in the area — as well as two complimentary golf carts for getting around the grounds. The One&Only Palmilla resort's spa, pools, and restaurants are a short cart ride away, as is the Dunes Club.

Palmilla itself is ideally positioned: San José del Cabo is 10 minutes east, the marina is 10 minutes the other direction, and Cabo San Lucas (and El Arco) is about 30 minutes west along the coastal corridor.`;

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
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: 40,
            alignItems: "start",
          }}
        >
          {/* Amenity grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {AMENITIES.map((a) => (
              <div
                key={a.label}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "16px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  boxShadow: "0 6px 16px rgba(38,70,83,0.06)",
                  border: "1px solid rgba(38,70,83,0.06)",
                }}
              >
                <span style={{ fontSize: "1.5rem", lineHeight: 1 }}>{a.icon}</span>
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: "0.88rem",
                    fontWeight: 600,
                    color: COLORS.indigo,
                    lineHeight: 1.3,
                  }}
                >
                  {a.label}
                </span>
              </div>
            ))}
          </div>

          {/* Description */}
          <div>
            {VILLA_DESCRIPTION.split("\n\n").map((para, i) => (
              <p
                key={i}
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.98rem",
                  lineHeight: 1.75,
                  color: COLORS.indigo,
                  margin: "0 0 1em",
                }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
