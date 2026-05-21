import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { ExternalLink, Maximize2, X } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import { useMobile } from "../hooks/useBreakpoint";

const GOLF_COLOR = "#4A8B57";

const PLACES = [
  // ── Home Base (always shown) ──────────────────────────────────────────────
  { id: "villa",      name: "Villa Dos Mares",                     cat: "Home Base", color: COLORS.terracotta, desc: "4BR, 3,059 sq ft — Palmilla Enclave",               query: "Palmilla Enclave Los Cabos Mexico",               lat: 23.0080, lng: -109.7170 },

  // ── Dining ────────────────────────────────────────────────────────────────
  { id: "oneonly",    name: "One&Only Palmilla",                    cat: "Dining",    color: COLORS.gold,       desc: "Spa, SUVICHE, pools — 2 min from villa",            query: "One And Only Palmilla",                           lat: 23.0092, lng: -109.7185 },
  { id: "nicksan",    name: "Nick-San Palmilla",                    cat: "Dining",    color: COLORS.gold,       desc: "Japanese-Mexican fusion — walkable from villa",     query: "Nick-San Palmilla",                               lat: 23.0082, lng: -109.7178 },
  { id: "flora",      name: "Flora Farms",                          cat: "Dining",    color: COLORS.gold,       desc: "25-acre organic farm — 20 min drive",               query: "Flora Farms Los Cabos",                           lat: 23.0412, lng: -109.6988 },
  { id: "farallon",   name: "El Farallón",                          cat: "Dining",    color: COLORS.gold,       desc: "Cliffside prix fixe — Waldorf Astoria",             query: "El Farallon Waldorf Astoria Los Cabos",           lat: 22.8895, lng: -109.8918 },
  { id: "monalisa",   name: "Sunset Monalisa",                      cat: "Dining",    color: COLORS.gold,       desc: "Mediterranean — cliffside sunset views",            query: "Sunset Monalisa Cabo San Lucas",                  lat: 22.9093, lng: -109.8556 },
  { id: "acrebaja",   name: "ACRE Baja",                            cat: "Dining",    color: COLORS.gold,       desc: "Treehouse farm-to-table — stunning setting",        query: "ACRE Baja San Jose del Cabo",                     lat: 23.0483, lng: -109.6965 },
  { id: "donsanchez", name: "Don Sanchez",                          cat: "Dining",    color: COLORS.gold,       desc: "Modern Mexican — Art Walk Thursday favorite",       query: "Don Sanchez Restaurant San Jose del Cabo",        lat: 23.0598, lng: -109.6936 },
  { id: "rosanegra",  name: "Rosa Negra",                           cat: "Dining",    color: COLORS.gold,       desc: "Latin-Japanese fusion — Corridor hot spot",         query: "Rosa Negra Los Cabos",                            lat: 22.9358, lng: -109.8638 },
  { id: "thecape",    name: "The Cape Hotel",                       cat: "Dining",    color: COLORS.gold,       desc: "Manta, The Ledge & Rooftop — bay views",            query: "The Cape Thompson Hotel Cabo San Lucas",          lat: 22.9264, lng: -109.9015 },

  // ── Beaches ───────────────────────────────────────────────────────────────
  { id: "palmillabeach", name: "Palmilla Beach",                    cat: "Beach",     color: COLORS.teal,       desc: "Calm, swimmable Sea of Cortez — steps from villa",  query: "Palmilla Beach Los Cabos",                        lat: 23.0055, lng: -109.7162 },
  { id: "chileno",    name: "Chileno Bay Beach",                    cat: "Beach",     color: COLORS.teal,       desc: "Blue Flag certified — top snorkeling spot",         query: "Chileno Bay Beach Los Cabos",                     lat: 22.9452, lng: -109.8308 },
  { id: "santamaria", name: "Santa Maria Bay",                      cat: "Beach",     color: COLORS.teal,       desc: "Protected marine sanctuary — pristine snorkeling",  query: "Santa Maria Bay Los Cabos",                       lat: 22.9538, lng: -109.8175 },
  { id: "medano",     name: "Medano Beach",                         cat: "Beach",     color: COLORS.teal,       desc: "Bagatelle, SUR Beach House, Taboo — beach clubs",   query: "Medano Beach Cabo San Lucas",                     lat: 22.8880, lng: -109.9022 },
  { id: "elganzo",    name: "El Ganzo Beach Club",                  cat: "Beach",     color: COLORS.teal,       desc: "Boutique beach club — San Jose del Cabo",           query: "El Ganzo Hotel San Jose del Cabo",                lat: 23.0588, lng: -109.7058 },
  { id: "cerritos",   name: "Cerritos Beach",                       cat: "Beach",     color: COLORS.teal,       desc: "World-class surf break — near Todos Santos",        query: "Cerritos Beach Todos Santos",                     lat: 23.4502, lng: -110.2291 },

  // ── Golf ──────────────────────────────────────────────────────────────────
  { id: "cabodelsol", name: "Cabo del Sol Desert Course",           cat: "Golf",      color: GOLF_COLOR,        desc: "Tom Weiskopf design — ocean views every hole",      query: "Cabo del Sol Desert Course",                      lat: 22.9673, lng: -109.8430 },
  { id: "questrojc",  name: "Puerto Los Cabos Golf",                cat: "Golf",      color: GOLF_COLOR,        desc: "27-hole Norman + Nicklaus design",                  query: "Puerto Los Cabos Golf Course",                    lat: 23.0625, lng: -109.7045 },
  { id: "campestre",  name: "Club Campestre",                       cat: "Golf",      color: GOLF_COLOR,        desc: "Nicklaus Design — mountain foothills",              query: "Club Campestre Golf Course San Jose Cabo",        lat: 23.0693, lng: -109.7356 },
  { id: "caboreal",   name: "Cabo Real Golf Club",                  cat: "Golf",      color: GOLF_COLOR,        desc: "Robert Trent Jones Jr. — 3.2mi beachfront",        query: "Cabo Real Golf Club Los Cabos",                   lat: 22.9826, lng: -109.8724 },
  { id: "solmar",     name: "Solmar Golf at Rancho San Lucas",      cat: "Golf",      color: GOLF_COLOR,        desc: "Greg Norman design — Pacific Ocean frontage",       query: "Rancho San Lucas Golf Course",                    lat: 22.8562, lng: -110.0108 },

  // ── Activities ────────────────────────────────────────────────────────────
  { id: "arch",       name: "El Arco / Land's End",                 cat: "Activity",  color: COLORS.coral,      desc: "Iconic rock arch — boat tours from the marina",     query: "El Arco Cabo San Lucas",                          lat: 22.8765, lng: -109.9176 },
  { id: "marina",     name: "Puerto Los Cabos Marina",              cat: "Activity",  color: COLORS.coral,      desc: "Fishing charters & boat tours — 10 min",           query: "Puerto Los Cabos Marina",                         lat: 23.0583, lng: -109.7041 },
  { id: "artwalk",    name: "San José Art District",                cat: "Activity",  color: COLORS.coral,      desc: "Thu Art Walk 5–9 PM (Nov–Jun) — galleries, music", query: "San Jose del Cabo Art District",                  lat: 23.0583, lng: -109.6921 },
  { id: "wildcanyon", name: "Wild Canyon",                          cat: "Activity",  color: COLORS.coral,      desc: "ATV, bungee, zipline, camels, animal sanctuary",    query: "Wild Canyon Adventures Los Cabos",                lat: 22.9208, lng: -109.9888 },
  { id: "caboadv",    name: "Cabo Adventures Park",                 cat: "Activity",  color: COLORS.coral,      desc: "ATV, camels, e-bike, UTV, zipline — 22 acres",     query: "Cabo Adventures Eco Park",                        lat: 22.8793, lng: -109.9048 },
  { id: "costazul",   name: "Costa Azul Surf",                      cat: "Activity",  color: COLORS.coral,      desc: "Top surf beach — Cabo Surf Hotel & lessons",        query: "Costa Azul Surf San Jose del Cabo",               lat: 23.0424, lng: -109.7044 },
];

const MAP_FILTERS = [
  { id: null,       label: "All",        activeColor: COLORS.indigo },
  { id: "Dining",   label: "Dining",     activeColor: COLORS.gold },
  { id: "Beach",    label: "Beaches",    activeColor: COLORS.teal },
  { id: "Golf",     label: "Golf",       activeColor: GOLF_COLOR },
  { id: "Activity", label: "Activities", activeColor: COLORS.coral },
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

function FlyToMarker({ activeId, places }) {
  const map = useMap();
  useEffect(() => {
    if (!activeId) return;
    const place = places.find((p) => p.id === activeId);
    if (place) map.flyTo([place.lat, place.lng], 14, { duration: 0.9 });
  }, [activeId, map, places]);
  return null;
}

function InvalidateSize({ trigger }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [trigger, map]);
  return null;
}

const TILE_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const MAP_CENTER = [23.0080, -109.7170];

export default function MapSection() {
  const [activeId, setActiveId] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useMobile();
  const cardRefs = useRef({});

  const filteredPlaces = catFilter
    ? PLACES.filter((p) => p.cat === catFilter || p.cat === "Home Base")
    : PLACES;

  useEffect(() => {
    if (!activeId) return;
    cardRefs.current[activeId]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeId]);

  // Escape key closes fullscreen
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => { if (e.key === "Escape") setIsFullscreen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  // Lock body scroll when fullscreen
  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  const toggle = (id) => setActiveId((prev) => (prev === id ? null : id));

  const mapMarkers = filteredPlaces.map((p) => (
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

  const filterChips = (compact = false) => (
    <div style={{ display: "flex", gap: compact ? 6 : 8, flexWrap: "wrap", alignItems: "center" }}>
      {MAP_FILTERS.map((f) => {
        const active = catFilter === f.id;
        return (
          <button
            key={String(f.id)}
            onClick={() => setCatFilter(active ? null : f.id)}
            style={{
              fontFamily: FONTS.sans,
              fontSize: compact ? "0.78rem" : "0.82rem",
              fontWeight: active ? 700 : 500,
              padding: compact ? "5px 12px" : "7px 16px",
              borderRadius: 999,
              color: active ? "#fff" : (compact ? COLORS.night : COLORS.indigo),
              background: active ? f.activeColor : (compact ? "rgba(255,255,255,0.85)" : "rgba(38,70,83,0.06)"),
              transition: "all 0.2s ease",
              cursor: "pointer",
              border: compact ? "1px solid rgba(255,255,255,0.4)" : "none",
            }}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );

  const placeCard = (p, variant = "sidebar") => {
    const active = activeId === p.id;
    const isMobileStrip = variant === "strip";
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
          gap: isMobileStrip ? 5 : 6,
          padding: isMobileStrip ? "14px 16px 16px 20px" : "16px 18px 18px 22px",
          background: "#fff",
          borderRadius: 14,
          border: `1px solid ${active ? p.color : "rgba(38,70,83,0.08)"}`,
          boxShadow: active
            ? `0 14px 28px rgba(38,70,83,0.12), 0 0 0 2px ${p.color}22`
            : "0 4px 14px rgba(38,70,83,0.06)",
          overflow: "hidden",
          transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
          transform: active ? "translateY(-2px)" : "translateY(0)",
          flexShrink: isMobileStrip ? 0 : undefined,
          width: isMobileStrip ? 220 : undefined,
        }}
      >
        <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: p.color }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: p.color }}>
            {p.cat}
          </span>
          <ExternalLink size={12} color={COLORS.muted} />
        </div>
        <div style={{ fontFamily: FONTS.display, fontSize: isMobileStrip ? "0.95rem" : "1.05rem", fontWeight: 700, color: COLORS.night, lineHeight: 1.2 }}>
          {p.name}
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted, lineHeight: 1.45 }}>
          {p.desc}
        </div>
      </a>
    );
  };

  // ── Fullscreen overlay ────────────────────────────────────────────────────
  const mapCore = (fullscreen = false) => (
    <MapContainer
      center={MAP_CENTER}
      zoom={11}
      scrollWheelZoom={fullscreen}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer attribution={TILE_ATTR} url={TILE_URL} />
      <FlyToMarker activeId={activeId} places={filteredPlaces} />
      <InvalidateSize trigger={`${fullscreen}-${catFilter}`} />
      {mapMarkers}
    </MapContainer>
  );

  if (isFullscreen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: COLORS.sand }}>
        {/* Header bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 16px", background: "#fff", borderBottom: "1px solid rgba(38,70,83,0.1)", flexShrink: 0, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "0.95rem", color: COLORS.night, whiteSpace: "nowrap" }}>Where We'll Roam</span>
            {filterChips(true)}
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            aria-label="Close fullscreen map"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: "rgba(38,70,83,0.08)", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.indigo, flexShrink: 0, cursor: "pointer" }}
          >
            <X size={14} /> Close
          </button>
        </div>

        {/* Map fills remaining space */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {mapCore(true)}
        </div>

        {/* Count badge */}
        {catFilter && (
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "rgba(26,31,58,0.85)", color: "#fff", fontFamily: FONTS.sans, fontSize: "0.78rem", fontWeight: 600, padding: "6px 14px", borderRadius: 999, pointerEvents: "none", backdropFilter: "blur(4px)" }}>
            {filteredPlaces.filter(p => p.cat !== "Home Base").length} {catFilter} locations
          </div>
        )}
      </div>
    );
  }

  // ── Normal view ───────────────────────────────────────────────────────────
  return (
    <section id="map" style={{ background: COLORS.sand, padding: SPACING.section }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="The Territory" title="Where We'll Roam" />

        {/* Filter chips */}
        <div style={{ marginTop: 28, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
          {filterChips()}
        </div>

        {!isMobile ? (
          <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
            {/* Map */}
            <div style={{ position: "relative", borderRadius: 22, overflow: "hidden", height: 640, boxShadow: "0 20px 48px rgba(38,70,83,0.15)", border: "1px solid rgba(38,70,83,0.08)" }}>
              {mapCore(false)}
              <button
                onClick={() => setIsFullscreen(true)}
                aria-label="Open fullscreen map"
                title="Fullscreen"
                style={{ position: "absolute", top: 12, right: 12, zIndex: 1000, display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(38,70,83,0.12)", fontFamily: FONTS.sans, fontSize: "0.78rem", fontWeight: 600, color: COLORS.indigo, cursor: "pointer", backdropFilter: "blur(4px)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
              >
                <Maximize2 size={13} /> Fullscreen
              </button>
            </div>

            {/* Scrollable sidebar */}
            <div style={{ maxHeight: 640, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 }}>
              {filteredPlaces.map((p) => placeCard(p, "sidebar"))}
              {filteredPlaces.length === 0 && (
                <p style={{ fontFamily: FONTS.sans, fontSize: "0.85rem", color: COLORS.muted, textAlign: "center", marginTop: 40 }}>No locations match this filter.</p>
              )}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24 }}>
            {/* Map */}
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", height: 420, boxShadow: "0 12px 32px rgba(38,70,83,0.12)", border: "1px solid rgba(38,70,83,0.08)" }}>
              {mapCore(false)}
              <button
                onClick={() => setIsFullscreen(true)}
                aria-label="Open fullscreen map"
                style={{ position: "absolute", top: 10, right: 10, zIndex: 1000, display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.92)", border: "1px solid rgba(38,70,83,0.12)", fontFamily: FONTS.sans, fontSize: "0.75rem", fontWeight: 600, color: COLORS.indigo, cursor: "pointer" }}
              >
                <Maximize2 size={12} /> Fullscreen
              </button>
            </div>

            {/* Horizontal scroll strip */}
            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12, paddingLeft: 2, marginTop: 16, WebkitOverflowScrolling: "touch", scrollbarWidth: "none" }}>
              {filteredPlaces.map((p) => placeCard(p, "strip"))}
            </div>
          </div>
        )}

        <p style={{ marginTop: 12, textAlign: "center", fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted }}>
          {filteredPlaces.length} location{filteredPlaces.length !== 1 ? "s" : ""} · Click any pin or card to zoom in
        </p>
      </div>
    </section>
  );
}
