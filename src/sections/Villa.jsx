import React from "react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";
import VillaCarousel from "../components/VillaCarousel";

const VILLA_PHOTOS = [
  { src: "/villa/villadosmares-pool-04.jpeg", alt: "Private heated infinity-edge pool" },
  { src: "/villa/villadosmares-front-exterior-05.jpeg", alt: "Villa Dos Mares exterior" },
  { src: "/villa/villadosmares-outdoor-dining-02.jpeg", alt: "Covered outdoor dining terrace" },
  { src: "/villa/villadosmares-living-area-02.jpeg", alt: "Living area" },
  { src: "/villa/villadosmares-primary-bedroom-04.jpeg", alt: "Primary bedroom" },
  { src: "/villa/villadosmares-kitchen.jpeg", alt: "Fully equipped kitchen" },
  { src: "/villa/villadosmares-firepit-02.jpeg", alt: "Fire pit" },
  { src: "/villa/villadosmares-dining-area-02.jpeg", alt: "Formal dining area" },
  { src: "/villa/villadosmares-pool-06.jpeg", alt: "Pool and terrace" },
  { src: "/villa/villadosmares-living-area-05.jpeg", alt: "Living area" },
  { src: "/villa/villadosmares-foyer.jpeg", alt: "Foyer" },
  { src: "/villa/villadosmares-grill.jpeg", alt: "Outdoor grill" },
  { src: "/villa/villadosmares-front-exterior-08.jpeg", alt: "Villa exterior" },
  { src: "/villa/villadosmares-bedroom3.jpeg", alt: "Bedroom 3 — King" },
  { src: "/villa/villadosmares-bedroom4.jpeg", alt: "Bedroom 4 — Two Twins" },
  { src: "/villa/villadosmares-bedroom2-02.jpeg", alt: "Bedroom 2 — Junior Primary King" },
  { src: "/villa/villadosmares-primary-bathroom-03.jpeg", alt: "Primary bathroom" },
  { src: "/villa/villadosmares-primary-bathroom-04.jpeg", alt: "Primary bathroom" },
  { src: "/villa/villadosmares-primary-bathroom-05.jpeg", alt: "Primary bathroom" },
  { src: "/villa/villadosmares-bedroom2-bathroom-03.jpeg", alt: "Bedroom 2 bathroom" },
  { src: "/villa/villadosmares-bedroom3-bathroom.jpeg", alt: "Bedroom 3 bathroom" },
  { src: "/villa/villadosmares-bedroom4-bathroom.jpeg", alt: "Bedroom 4 bathroom" },
];

const VILLA_DESCRIPTION = `A standalone home within Palmilla — one of Los Cabos' most exclusive gated enclaves. Golf course views with partial ocean views, and a short golf cart ride to swimmable Palmilla Beach. Two four-seat golf carts come with the property, giving the whole group easy access to on-site dining, the spa, and resort pools.

Outside: a private heated infinity-edge pool, private hot tub, covered outdoor dining terrace, expansive outdoor living space, an outdoor grill, and a fire pit. Built for long Baja afternoons that turn into late nights under the stars.

Inside: a fully equipped kitchen with breakfast bar, formal dining for eight, a Sonos sound system, wine fridge, satellite TV, and air conditioning throughout. In-residence breakfast and lunch service is available for an additional charge. Sleeps eight across four bedrooms — three kings and a twin room.

Partial access to One&Only Palmilla: four restaurants and two bars (reservations required), and the spa with private villas, yoga garden, and relaxation pools. Full access to Palmilla Dunes Club: multiple pools including two semi-Olympic lap lanes, hot tub, cabanas, steam room, sauna, fitness center, two tennis courts, two paddle tennis courts, and four pickleball courts. Palmilla Golf Club's 9-hole ocean course is also available to non-members.`;

const AMENITIES = [
  { icon: "🛏️", label: "3 Kings + 1 Twin Room" },
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
