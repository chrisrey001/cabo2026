import React, { useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { ExternalLink } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";

const PLACES = [
  { id: "villa",    name: "Villa Dos Mares",       cat: "Home Base",   color: COLORS.terracotta, desc: "4BR, 3,059 sq ft — Palmilla Enclave",        query: "Palmilla Enclave Los Cabos Mexico",          lat: 23.0080, lng: -109.7170 },
  { id: "oneonly",  name: "One&Only Palmilla",      cat: "Resort",      color: COLORS.teal,       desc: "Spa, SUVICHE, pools — 2 min from villa",      query: "One And Only Palmilla",                      lat: 23.0092, lng: -109.7185 },
  { id: "nicksan",  name: "Nick-San Palmilla",      cat: "Dining",      color: COLORS.gold,       desc: "Japanese-Mexican fusion — walkable",           query: "Nick-San Palmilla",                          lat: 23.0082, lng: -109.7178 },
  { id: "flora",    name: "Flora Farms",             cat: "Dining",      color: COLORS.coral,      desc: "25-acre organic farm — 20 min drive",          query: "Flora Farms Los Cabos",                      lat: 23.0412, lng: -109.6988 },
  { id: "artwalk",  name: "San José Art District",  cat: "Culture",     color: COLORS.coral,      desc: "Thu Art Walk 5–9 PM — galleries, music",      query: "San Jose del Cabo Art District",             lat: 23.0583, lng: -109.6921 },
  { id: "arch",     name: "El Arco / Land's End",   cat: "Sightseeing", color: COLORS.teal,       desc: "Iconic rock arch — boat tours from marina",    query: "El Arco Cabo San Lucas",                     lat: 22.8765, lng: -109.9176 },
  { id: "marina",   name: "Puerto Los Cabos Marina", cat: "Adventure",   color: COLORS.indigo,     desc: "Fishing charters — 10 min from villa",         query: "Puerto Los Cabos Marina",                    lat: 23.0583, lng: -109.7041 },
  { id: "farallon", name: "El Farallón",             cat: "Dining",      color: COLORS.gold,       desc: "Cliffside prix fixe at Waldorf Astoria",       query: "El Farallon Waldorf Astoria Los Cabos",      lat: 22.8895, lng: -109.8918 },
  { id: "monalisa", name: "Sunset Monalisa",         cat: "Dining",      color: COLORS.gold,       desc: "Mediterranean — epic sunset views",            query: "Sunset Monalisa Cabo San Lucas",             lat: 22.9093, lng: -109.8556 },
  { id: "beach",    name: "Palmilla Beach",           cat: "Beach",       color: COLORS.teal,       desc: "Calm, swimmable Sea of Cortez beach",          query: "Palmilla Beach Los Cabos",                   lat: 23.0055, lng: -109.7162 },
];

function makeIcon(color, active) {
  const size = active ? 20 : 14;
  const border = active ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border}px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      transition:width 0.2s,height 0.2s;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToMarker({ activeId }) {
  const map = useMap();
  React.useEffect(() => {
    if (!activeId) return;
    const place = PLACES.find((p) => p.id === activeId);
    if (place) map.flyTo([place.lat, place.lng], 14, { duration: 0.9 });
  }, [activeId, map]);
  return null;
}

export default function MapSection() {
  const [activeId, setActiveId] = useState(null);

  return (
    <section id="map" style={{ background: COLORS.sand, padding: "100px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="The Territory" title="Where We'll Roam" />

        <div
          style={{
            marginTop: 48,
            borderRadius: 22,
            overflow: "hidden",
            boxShadow: "0 20px 48px rgba(38,70,83,0.15)",
            border: "1px solid rgba(38,70,83,0.08)",
            height: 440,
          }}
        >
          <MapContainer
            center={[23.0080, -109.7170]}
            zoom={11}
            scrollWheelZoom={false}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <FlyToMarker activeId={activeId} />
            {PLACES.map((p) => (
              <Marker
                key={p.id}
                position={[p.lat, p.lng]}
                icon={makeIcon(p.color, activeId === p.id)}
                eventHandlers={{ click: () => setActiveId((prev) => (prev === p.id ? null : p.id)) }}
              />
            ))}
          </MapContainer>
        </div>

        <div
          style={{
            marginTop: 32,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {PLACES.map((p) => {
            const active = activeId === p.id;
            return (
              <a
                key={p.id}
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={() => setActiveId(p.id)}
                onMouseLeave={() => setActiveId(null)}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  padding: "18px 20px 20px 24px",
                  background: "#fff",
                  borderRadius: 14,
                  border: `1px solid ${active ? p.color : "rgba(38,70,83,0.08)"}`,
                  boxShadow: active
                    ? `0 14px 28px rgba(38,70,83,0.12), 0 0 0 2px ${p.color}22`
                    : "0 6px 18px rgba(38,70,83,0.06)",
                  overflow: "hidden",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                  transform: active ? "translateY(-3px)" : "translateY(0)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0, top: 0, bottom: 0,
                    width: 4,
                    background: p.color,
                  }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: FONTS.sans, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: p.color }}>
                    {p.cat}
                  </span>
                  <ExternalLink size={14} color={COLORS.muted} />
                </div>
                <div style={{ fontFamily: FONTS.display, fontSize: "1.15rem", fontWeight: 700, color: COLORS.night, lineHeight: 1.2 }}>
                  {p.name}
                </div>
                <div style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, lineHeight: 1.45 }}>
                  {p.desc}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
