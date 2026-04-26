import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { ExternalLink } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import { useMobile } from "../hooks/useBreakpoint";

const PLACES = [
  { id: "villa",    name: "Villa Dos Mares",        cat: "Home Base",   color: COLORS.terracotta, desc: "4BR, 3,059 sq ft — Palmilla Enclave",        query: "Palmilla Enclave Los Cabos Mexico",          lat: 23.0080, lng: -109.7170 },
  { id: "oneonly",  name: "One&Only Palmilla",       cat: "Resort",      color: COLORS.teal,       desc: "Spa, SUVICHE, pools — 2 min from villa",      query: "One And Only Palmilla",                      lat: 23.0092, lng: -109.7185 },
  { id: "nicksan",  name: "Nick-San Palmilla",       cat: "Dining",      color: COLORS.gold,       desc: "Japanese-Mexican fusion — walkable",           query: "Nick-San Palmilla",                          lat: 23.0082, lng: -109.7178 },
  { id: "flora",    name: "Flora Farms",              cat: "Dining",      color: COLORS.coral,      desc: "25-acre organic farm — 20 min drive",          query: "Flora Farms Los Cabos",                      lat: 23.0412, lng: -109.6988 },
  { id: "artwalk",  name: "San José Art District",   cat: "Culture",     color: COLORS.coral,      desc: "Thu Art Walk 5–9 PM — galleries, music",      query: "San Jose del Cabo Art District",             lat: 23.0583, lng: -109.6921 },
  { id: "arch",     name: "El Arco / Land's End",    cat: "Sightseeing", color: COLORS.teal,       desc: "Iconic rock arch — boat tours from marina",    query: "El Arco Cabo San Lucas",                     lat: 22.8765, lng: -109.9176 },
  { id: "marina",   name: "Puerto Los Cabos Marina",  cat: "Adventure",   color: COLORS.indigo,     desc: "Fishing charters — 10 min from villa",         query: "Puerto Los Cabos Marina",                    lat: 23.0583, lng: -109.7041 },
  { id: "farallon", name: "El Farallón",              cat: "Dining",      color: COLORS.gold,       desc: "Cliffside prix fixe at Waldorf Astoria",       query: "El Farallon Waldorf Astoria Los Cabos",      lat: 22.8895, lng: -109.8918 },
  { id: "monalisa", name: "Sunset Monalisa",          cat: "Dining",      color: COLORS.gold,       desc: "Mediterranean — epic sunset views",            query: "Sunset Monalisa Cabo San Lucas",             lat: 22.9093, lng: -109.8556 },
  { id: "beach",    name: "Palmilla Beach",            cat: "Beach",       color: COLORS.teal,       desc: "Calm, swimmable Sea of Cortez beach",          query: "Palmilla Beach Los Cabos",                   lat: 23.0055, lng: -109.7162 },
];

function makeIcon(color, active) {
  const size = active ? 22 : 16;
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

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const MAP_CENTER = [23.0080, -109.7170];

export default function MapSection() {
  const [activeId, setActiveId] = useState(null);
  const isMobile = useMobile();
  const isDesktop = !isMobile;
  const cardRefs = useRef({});

  useEffect(() => {
    if (!activeId) return;
    cardRefs.current[activeId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  const toggle = (id) => setActiveId((prev) => (prev === id ? null : id));

  const mapMarkers = PLACES.map((p) => (
    <Marker
      key={p.id}
      position={[p.lat, p.lng]}
      icon={makeIcon(p.color, activeId === p.id)}
      eventHandlers={{ click: () => toggle(p.id) }}
    >
      <Tooltip
        key={`tt-${p.id}-${activeId === p.id}`}
        className="cabo-tooltip"
        direction="top"
        offset={[0, -10]}
        permanent={activeId === p.id}
        opacity={1}
      >
        <span style={{ display: "block", color: p.color, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", fontFamily: FONTS.sans }}>
          {p.cat}
        </span>
        <div style={{ fontFamily: FONTS.display, fontSize: "0.9rem", fontWeight: 700, color: COLORS.night, marginTop: 1 }}>
          {p.name}
        </div>
      </Tooltip>
    </Marker>
  ));

  return (
    <section id="map" style={{ background: COLORS.sand, padding: SPACING.section }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="The Territory" title="Where We'll Roam" />

        {isDesktop ? (
          <div style={{ marginTop: 48, display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
            {/* Map */}
            <div style={{ borderRadius: 22, overflow: "hidden", height: 540, boxShadow: "0 20px 48px rgba(38,70,83,0.15)", border: "1px solid rgba(38,70,83,0.08)" }}>
              <MapContainer center={MAP_CENTER} zoom={11} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution={TILE_ATTR} url={TILE_URL} />
                <FlyToMarker activeId={activeId} />
                {mapMarkers}
              </MapContainer>
            </div>

            {/* Scrollable card sidebar */}
            <div style={{ maxHeight: 540, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
              {PLACES.map((p) => {
                const active = activeId === p.id;
                return (
                  <a
                    key={p.id}
                    ref={(el) => { cardRefs.current[p.id] = el; }}
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
                      padding: "16px 18px 18px 22px",
                      background: "#fff",
                      borderRadius: 14,
                      border: `1px solid ${active ? p.color : "rgba(38,70,83,0.08)"}`,
                      boxShadow: active
                        ? `0 14px 28px rgba(38,70,83,0.12), 0 0 0 2px ${p.color}22`
                        : "0 4px 14px rgba(38,70,83,0.06)",
                      overflow: "hidden",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
                      transform: active ? "translateY(-2px)" : "translateY(0)",
                      flexShrink: 0,
                    }}
                  >
                    <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: p.color }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <span style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: p.color }}>
                        {p.cat}
                      </span>
                      <ExternalLink size={13} color={COLORS.muted} />
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: "1.05rem", fontWeight: 700, color: COLORS.night, lineHeight: 1.2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: FONTS.sans, fontSize: "0.8rem", color: COLORS.muted, lineHeight: 1.45 }}>
                      {p.desc}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 32 }}>
            {/* Map */}
            <div style={{ borderRadius: 16, overflow: "hidden", height: 320, boxShadow: "0 12px 32px rgba(38,70,83,0.12)", border: "1px solid rgba(38,70,83,0.08)" }}>
              <MapContainer center={MAP_CENTER} zoom={11} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
                <TileLayer attribution={TILE_ATTR} url={TILE_URL} />
                <FlyToMarker activeId={activeId} />
                {mapMarkers}
              </MapContainer>
            </div>

            {/* Horizontal scroll strip */}
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, paddingLeft: 2, marginTop: 16, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              {PLACES.map((p) => {
                const active = activeId === p.id;
                return (
                  <a
                    key={p.id}
                    ref={(el) => { cardRefs.current[p.id] = el; }}
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flexShrink: 0,
                      width: 230,
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      gap: 5,
                      padding: "14px 16px 16px 20px",
                      background: "#fff",
                      borderRadius: 14,
                      border: `1px solid ${active ? p.color : "rgba(38,70,83,0.08)"}`,
                      boxShadow: active
                        ? `0 8px 20px rgba(38,70,83,0.12), 0 0 0 2px ${p.color}22`
                        : "0 4px 12px rgba(38,70,83,0.06)",
                      overflow: "hidden",
                      transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                    }}
                  >
                    <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: p.color }} />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: p.color }}>
                        {p.cat}
                      </span>
                      <ExternalLink size={12} color={COLORS.muted} />
                    </div>
                    <div style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 700, color: COLORS.night, lineHeight: 1.2 }}>
                      {p.name}
                    </div>
                    <div style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted, lineHeight: 1.4 }}>
                      {p.desc}
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
