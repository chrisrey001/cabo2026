import React, { useMemo, useState } from "react";
import { UtensilsCrossed, Clock, MapPin, Phone, Navigation } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";

const DINING = [
  {
    name: "Flora Farms",
    cost: "$80–100/pp",
    cuisine: "Farm-to-Table",
    distance: "20 min drive",
    hours: "5:30 – 10 PM",
    phone: "+52 624 355 4564",
    vibe: "Magical outdoor farm",
    book: "OpenTable, 4+ weeks ahead",
    costNum: 90,
  },
  {
    name: "Nick-San Palmilla",
    cost: "$70–95/pp",
    cuisine: "Japanese-Mexican Fusion",
    distance: "2 min walk",
    hours: "12 – 10:30 PM",
    phone: "+52 624 144 6262",
    vibe: "Elevated sushi, walkable",
    book: "Call ahead",
    costNum: 82,
  },
  {
    name: "El Farallón",
    cost: "$135–315/pp",
    cuisine: "Cliffside Seafood",
    distance: "25 min drive",
    hours: "5:30 – 10 PM",
    phone: "+52 624 163 0000",
    vibe: "Prix fixe, Waldorf Astoria",
    book: "Hotel concierge",
    costNum: 225,
  },
  {
    name: "Sunset Monalisa",
    cost: "$135–200/pp",
    cuisine: "Mediterranean",
    distance: "20 min drive",
    hours: "4 – 11 PM",
    phone: "+52 624 145 8160",
    vibe: "Fine dining, cliffside sunset",
    book: "Reserve online",
    costNum: 167,
  },
  {
    name: "Jazamín's",
    cost: "$55–70/pp",
    cuisine: "Traditional Mexican",
    distance: "10 min drive",
    hours: "5 – 11 PM",
    phone: "+52 624 105 2279",
    vibe: "Lively, Art Walk night pick",
    book: "Walk-in OK",
    costNum: 62,
  },
  {
    name: "One&Only Restaurants",
    cost: "$80–130/pp",
    cuisine: "SUVICHE / Seared / Agua",
    distance: "Walkable",
    hours: "Varies by venue",
    phone: "+52 624 146 7000",
    vibe: "Resort dining, multiple options",
    book: "Resort reservation",
    costNum: 105,
  },
];

const SORTS = [
  { id: "name", label: "Name" },
  { id: "cost", label: "Cost" },
  { id: "distance", label: "Distance" },
];

export default function Dining() {
  const [sortKey, setSortKey] = useState("name");

  const sorted = useMemo(() => {
    const arr = [...DINING];
    if (sortKey === "cost") {
      arr.sort((a, b) => a.costNum - b.costNum);
    } else if (sortKey === "distance") {
      arr.sort((a, b) => a.distance.localeCompare(b.distance));
    } else {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    }
    return arr;
  }, [sortKey]);

  return (
    <section
      id="dining"
      style={{
        background: COLORS.warmWhite,
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="Where We'll Eat" title="The Dining Guide" />

        <div
          style={{
            marginTop: 32,
            display: "flex",
            justifyContent: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.78rem",
              color: COLORS.muted,
              alignSelf: "center",
              marginRight: 4,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
            }}
          >
            Sort by
          </span>
          {SORTS.map((s) => {
            const active = sortKey === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSortKey(s.id)}
                style={{
                  fontFamily: FONTS.sans,
                  fontSize: "0.82rem",
                  fontWeight: active ? 700 : 500,
                  padding: "7px 16px",
                  borderRadius: 999,
                  color: active ? "#fff" : COLORS.indigo,
                  background: active ? COLORS.indigo : "rgba(38,70,83,0.06)",
                  transition: "all 0.2s ease",
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {sorted.map((r) => (
            <DiningCard key={r.name} r={r} />
          ))}
        </div>

        <p
          style={{
            marginTop: 20,
            textAlign: "center",
            fontFamily: FONTS.sans,
            fontStyle: "italic",
            fontSize: "0.82rem",
            color: COLORS.muted,
          }}
        >
          Verify phone numbers before booking — they change.
        </p>
      </div>
    </section>
  );
}

function DiningCard({ r }) {
  const telHref = `tel:${r.phone.replace(/[^+\d]/g, "")}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${r.name} Los Cabos`
  )}`;

  return (
    <article
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(38,70,83,0.08)",
        boxShadow: "0 8px 22px rgba(38,70,83,0.07)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 22px 16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
            }}
          >
            <UtensilsCrossed size={18} color={COLORS.coral} style={{ flexShrink: 0 }} />
            <h3
              style={{
                fontFamily: FONTS.display,
                fontSize: "1.2rem",
                fontWeight: 700,
                color: COLORS.night,
                margin: 0,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
              }}
            >
              {r.name}
            </h3>
          </div>
          <span
            style={{
              fontFamily: FONTS.mono,
              fontSize: "0.85rem",
              color: COLORS.teal,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {r.cost}
          </span>
        </div>
        <div
          style={{
            fontFamily: FONTS.sans,
            fontSize: "0.82rem",
            color: COLORS.muted,
            marginLeft: 28,
          }}
        >
          {r.cuisine}
        </div>
      </div>

      <div
        style={{
          padding: "14px 22px 18px",
          borderTop: "1px solid rgba(38,70,83,0.06)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px 14px",
          fontFamily: FONTS.sans,
          fontSize: "0.85rem",
          color: COLORS.indigo,
          flex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={14} color={COLORS.teal} style={{ flexShrink: 0 }} />
          <span>{r.hours}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={COLORS.teal} style={{ flexShrink: 0 }} />
          <span>{r.distance}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ fontSize: "0.9rem" }}>
            ✨
          </span>
          <span>{r.vibe}</span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontStyle: "italic",
            color: COLORS.muted,
          }}
        >
          <span aria-hidden style={{ fontSize: "0.9rem" }}>
            📋
          </span>
          <span>{r.book}</span>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(38,70,83,0.08)",
          display: "grid",
          gridTemplateColumns: "1fr 1px 1fr",
          alignItems: "stretch",
        }}
      >
        <a
          href={telHref}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 12px",
            fontFamily: FONTS.sans,
            fontSize: "0.82rem",
            fontWeight: 600,
            color: COLORS.teal,
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Phone size={14} />
          {r.phone}
        </a>
        <span aria-hidden style={{ background: "rgba(38,70,83,0.08)" }} />
        <a
          href={mapHref}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 12px",
            fontFamily: FONTS.sans,
            fontSize: "0.82rem",
            fontWeight: 600,
            color: COLORS.coral,
            transition: "background 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,132,95,0.09)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Navigation size={14} />
          Directions
        </a>
      </div>
    </article>
  );
}
