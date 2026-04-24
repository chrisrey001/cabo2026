import React from "react";
import { ExternalLink } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";

const PLACES = [
  {
    id: "villa",
    name: "Villa Dos Mares",
    cat: "Home Base",
    color: COLORS.terracotta,
    desc: "4BR, 3,059 sq ft — Palmilla Enclave",
    query: "Palmilla Enclave Los Cabos Mexico",
  },
  {
    id: "oneonly",
    name: "One&Only Palmilla",
    cat: "Resort",
    color: COLORS.teal,
    desc: "Spa, SUVICHE, pools — 2 min from villa",
    query: "One And Only Palmilla",
  },
  {
    id: "nicksan",
    name: "Nick-San Palmilla",
    cat: "Dining",
    color: COLORS.gold,
    desc: "Japanese-Mexican fusion — walkable",
    query: "Nick-San Palmilla",
  },
  {
    id: "flora",
    name: "Flora Farms",
    cat: "Dining",
    color: COLORS.coral,
    desc: "25-acre organic farm — 20 min drive",
    query: "Flora Farms Los Cabos",
  },
  {
    id: "artwalk",
    name: "San José Art District",
    cat: "Culture",
    color: COLORS.coral,
    desc: "Thu Art Walk 5–9 PM — galleries, music",
    query: "San Jose del Cabo Art District",
  },
  {
    id: "arch",
    name: "El Arco / Land's End",
    cat: "Sightseeing",
    color: COLORS.teal,
    desc: "Iconic rock arch — boat tours from marina",
    query: "El Arco Cabo San Lucas",
  },
  {
    id: "marina",
    name: "Puerto Los Cabos Marina",
    cat: "Adventure",
    color: COLORS.indigo,
    desc: "Fishing charters — 10 min from villa",
    query: "Puerto Los Cabos Marina",
  },
  {
    id: "farallon",
    name: "El Farallón",
    cat: "Dining",
    color: COLORS.gold,
    desc: "Cliffside prix fixe at Waldorf Astoria",
    query: "El Farallon Waldorf Astoria Los Cabos",
  },
  {
    id: "monalisa",
    name: "Sunset Monalisa",
    cat: "Dining",
    color: COLORS.gold,
    desc: "Mediterranean — epic sunset views",
    query: "Sunset Monalisa Cabo San Lucas",
  },
  {
    id: "beach",
    name: "Palmilla Beach",
    cat: "Beach",
    color: COLORS.teal,
    desc: "Calm, swimmable Sea of Cortez beach",
    query: "Palmilla Beach Los Cabos",
  },
];

export default function MapSection() {
  return (
    <section
      id="map"
      style={{
        background: COLORS.sand,
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="The Territory" title="Where We'll Roam" />

        <div
          style={{
            marginTop: 48,
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 20px 48px rgba(38,70,83,0.15)",
            border: "1px solid rgba(38,70,83,0.08)",
            background: "#fff",
          }}
        >
          <iframe
            title="Los Cabos map"
            src="https://www.google.com/maps?q=23.0080,-109.7170&z=11&output=embed"
            width="100%"
            height="440"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {PLACES.map((p) => (
            <a
              key={p.id}
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: "18px 20px 20px 24px",
                background: "#fff",
                borderRadius: 14,
                border: "1px solid rgba(38,70,83,0.08)",
                boxShadow: "0 6px 18px rgba(38,70,83,0.06)",
                overflow: "hidden",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 14px 28px rgba(38,70,83,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 6px 18px rgba(38,70,83,0.06)";
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 4,
                  background: p.color,
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    color: p.color,
                  }}
                >
                  {p.cat}
                </span>
                <ExternalLink size={14} color={COLORS.muted} />
              </div>
              <div
                style={{
                  fontFamily: FONTS.display,
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  color: COLORS.night,
                  lineHeight: 1.2,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.82rem",
                  color: COLORS.muted,
                  lineHeight: 1.45,
                }}
              >
                {p.desc}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
