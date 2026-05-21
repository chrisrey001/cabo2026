import React, { useRef, useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ExternalLink, Maximize2, X } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import { useMobile } from "../hooks/useBreakpoint";

const GOLF_COLOR = "#4A8B57";

const PLACES = [
  // ── Home Base ─────────────────────────────────────────────────────────────
  { id: "villa",       name: "Villa Dos Mares",          cat: "Home Base", color: COLORS.terracotta, desc: "4BR, 3,059 sq ft — Palmilla Enclave",               query: "Palmilla Enclave Los Cabos Mexico",              lat: 23.0080, lng: -109.7170 },

  // ── Dining ────────────────────────────────────────────────────────────────
  { id: "oneonly",     name: "One&Only Palmilla",         cat: "Dining",    color: COLORS.gold,       desc: "Spa, SUVICHE, pools — 2 min from villa",            query: "One And Only Palmilla",                          lat: 23.0092, lng: -109.7185 },
  { id: "nicksan",     name: "Nick-San Palmilla",         cat: "Dining",    color: COLORS.gold,       desc: "Japanese-Mexican fusion — walkable from villa",     query: "Nick-San Palmilla",                              lat: 23.0082, lng: -109.7178 },
  { id: "flora",       name: "Flora Farms",               cat: "Dining",    color: COLORS.gold,       desc: "25-acre organic farm — 20 min drive",               query: "Flora Farms Los Cabos",                          lat: 23.0412, lng: -109.6988 },
  { id: "farallon",    name: "El Farallón",               cat: "Dining",    color: COLORS.gold,       desc: "Cliffside prix fixe — Waldorf Astoria",             query: "El Farallon Waldorf Astoria Los Cabos",          lat: 22.8895, lng: -109.8918 },
  { id: "monalisa",    name: "Sunset Monalisa",           cat: "Dining",    color: COLORS.gold,       desc: "Mediterranean — cliffside sunset views",            query: "Sunset Monalisa Cabo San Lucas",                 lat: 22.9093, lng: -109.8556 },
  { id: "acrebaja",    name: "ACRE Baja",                 cat: "Dining",    color: COLORS.gold,       desc: "Treehouse farm-to-table — stunning setting",        query: "ACRE Baja San Jose del Cabo",                    lat: 23.0483, lng: -109.6965 },
  { id: "donsanchez",  name: "Don Sanchez",               cat: "Dining",    color: COLORS.gold,       desc: "Modern Mexican — Art Walk Thursday favorite",       query: "Don Sanchez Restaurant San Jose del Cabo",       lat: 23.0598, lng: -109.6936 },
  { id: "rosanegra",   name: "Rosa Negra",                cat: "Dining",    color: COLORS.gold,       desc: "Latin-Japanese fusion — Corridor hot spot",         query: "Rosa Negra Los Cabos",                           lat: 22.9358, lng: -109.8638 },
  { id: "thecape",     name: "The Cape Hotel",            cat: "Dining",    color: COLORS.gold,       desc: "Manta, The Ledge & Rooftop — bay views",            query: "The Cape Thompson Hotel Cabo San Lucas",         lat: 22.9264, lng: -109.9015 },

  // ── Beaches ───────────────────────────────────────────────────────────────
  { id: "palmillabeach", name: "Palmilla Beach",          cat: "Beach",     color: COLORS.teal,       desc: "Calm, swimmable Sea of Cortez — steps from villa",  query: "Palmilla Beach Los Cabos",                       lat: 23.0055, lng: -109.7162 },
  { id: "chileno",     name: "Chileno Bay Beach",         cat: "Beach",     color: COLORS.teal,       desc: "Blue Flag certified — top snorkeling spot",         query: "Chileno Bay Beach Los Cabos",                    lat: 22.9452, lng: -109.8308 },
  { id: "santamaria",  name: "Santa Maria Bay",           cat: "Beach",     color: COLORS.teal,       desc: "Protected marine sanctuary — pristine snorkeling",  query: "Santa Maria Bay Los Cabos",                      lat: 22.9538, lng: -109.8175 },
  { id: "medano",      name: "Medano Beach",              cat: "Beach",     color: COLORS.teal,       desc: "Bagatelle, SUR Beach House, Taboo — beach clubs",   query: "Medano Beach Cabo San Lucas",                    lat: 22.8880, lng: -109.9022 },
  { id: "elganzo",     name: "El Ganzo Beach Club",       cat: "Beach",     color: COLORS.teal,       desc: "Boutique beach club — San Jose del Cabo",           query: "El Ganzo Hotel San Jose del Cabo",               lat: 23.0588, lng: -109.7058 },
  { id: "cerritos",    name: "Cerritos Beach",            cat: "Beach",     color: COLORS.teal,       desc: "World-class surf break — near Todos Santos",        query: "Cerritos Beach Todos Santos",                    lat: 23.4502, lng: -110.2291 },

  // ── Golf ──────────────────────────────────────────────────────────────────
  { id: "cabodelsol",  name: "Cabo del Sol Desert",       cat: "Golf",      color: GOLF_COLOR,        desc: "Tom Weiskopf design — ocean views every hole",      query: "Cabo del Sol Desert Course",                     lat: 22.9673, lng: -109.8430 },
  { id: "questrojc",   name: "Puerto Los Cabos Golf",     cat: "Golf",      color: GOLF_COLOR,        desc: "27-hole Norman + Nicklaus design",                  query: "Puerto Los Cabos Golf Course",                   lat: 23.0625, lng: -109.7045 },
  { id: "campestre",   name: "Club Campestre",            cat: "Golf",      color: GOLF_COLOR,        desc: "Nicklaus Design — mountain foothills",              query: "Club Campestre Golf Course San Jose Cabo",       lat: 23.0693, lng: -109.7356 },
  { id: "caboreal",    name: "Cabo Real Golf Club",       cat: "Golf",      color: GOLF_COLOR,        desc: "Robert Trent Jones Jr. — 3.2mi beachfront",        query: "Cabo Real Golf Club Los Cabos",                  lat: 22.9826, lng: -109.8724 },
  { id: "solmar",      name: "Solmar @ Rancho San Lucas", cat: "Golf",      color: GOLF_COLOR,        desc: "Greg Norman design — Pacific Ocean frontage",       query: "Rancho San Lucas Golf Course",                   lat: 22.8562, lng: -110.0108 },

  // ── Activities ────────────────────────────────────────────────────────────
  { id: "arch",        name: "El Arco / Land's End",      cat: "Activity",  color: COLORS.coral,      desc: "Iconic rock arch — boat tours from the marina",     query: "El Arco Cabo San Lucas",                         lat: 22.8765, lng: -109.9176 },
  { id: "marina",      name: "Puerto Los Cabos Marina",   cat: "Activity",  color: COLORS.coral,      desc: "Fishing charters & boat tours — 10 min",           query: "Puerto Los Cabos Marina",                        lat: 23.0583, lng: -109.7041 },
  { id: "artwalk",     name: "San José Art District",     cat: "Activity",  color: COLORS.coral,      desc: "Thu Art Walk 5–9 PM (Nov–Jun) — galleries, music", query: "San Jose del Cabo Art District",                 lat: 23.0583, lng: -109.6921 },
  { id: "wildcanyon",  name: "Wild Canyon",               cat: "Activity",  color: COLORS.coral,      desc: "ATV, bungee, zipline, camels, animal sanctuary",    query: "Wild Canyon Adventures Los Cabos",               lat: 22.9208, lng: -109.9888 },
  { id: "caboadv",     name: "Cabo Adventures Park",      cat: "Activity",  color: COLORS.coral,      desc: "ATV, camels, e-bike, UTV, zipline — 22 acres",     query: "Cabo Adventures Eco Park",                       lat: 22.8793, lng: -109.9048 },
  { id: "costazul",    name: "Costa Azul Surf",           cat: "Activity",  color: COLORS.coral,      desc: "Top surf beach — Cabo Surf Hotel & lessons",        query: "Costa Azul Surf San Jose del Cabo",              lat: 23.0424, lng: -109.7044 },
];

function makeIcon(color, active) {
  const size = active ? 22 : 16;
  const border = active ? 3 : 2;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border}px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);transition:width 0.15s,height 0.15s;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FlyToMarker({ activeId }) {
  const map = useMap();
  useEffect(() => {
    if (!activeId) return;
    const place = PLACES.find((p) => p.id === activeId);
    if (place) map.flyTo([place.lat, place.lng], 14, { duration: 0.9 });
  }, [activeId, map]);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isMobile = useMobile();
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e) => { if (e.key === "Escape") setIsFullscreen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isFullscreen]);

  const onCardClick = (id) => {
    setActiveId(id);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const mapMarkers = PLACES.map((p) => (
    <Marker
      key={p.id}
      position={[p.lat, p.lng]}
      icon={makeIcon(p.color, activeId === p.id)}
      eventHandlers={{ click: () => setActiveId((prev) => (prev === p.id ? null : p.id)) }}
    >
      <Tooltip className="cabo-tooltip" direction="top" offset={[0, -10]} opacity={1}>
        <span style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.night }}>
          {p.name}
        </span>
      </Tooltip>
      <Popup className="cabo-popup" offset={[0, -10]}>
        <div>
          <span style={{ display: "block", color: p.color, fontFamily: FONTS.sans, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", marginBottom: 4 }}>
            {p.cat}
          </span>
          <div style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 700, color: COLORS.night, lineHeight: 1.2, marginBottom: 6 }}>
            {p.name}
          </div>
          <div style={{ fontFamily: FONTS.sans, fontSize: "0.77rem", color: COLORS.muted, lineHeight: 1.5, maxWidth: 210, marginBottom: 10 }}>
            {p.desc}
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`}
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, color: p.color, fontFamily: FONTS.sans, fontSize: "0.73rem", fontWeight: 600, textDecoration: "none" }}
          >
            Open in Maps <ExternalLink size={10} />
          </a>
        </div>
      </Popup>
    </Marker>
  ));

  const placeCard = (p) => {
    const active = activeId === p.id;
    return (
      <div
        key={p.id}
        onClick={() => onCardClick(p.id)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onCardClick(p.id)}
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 5,
          padding: "14px 16px 16px 20px",
          background: "#fff",
          borderRadius: 14,
          border: `1px solid ${active ? p.color : "rgba(38,70,83,0.08)"}`,
          boxShadow: active
            ? `0 10px 24px rgba(38,70,83,0.12), 0 0 0 2px ${p.color}33`
            : "0 3px 12px rgba(38,70,83,0.06)",
          overflow: "hidden",
          transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
          transform: active ? "translateY(-2px)" : "translateY(0)",
          cursor: "pointer",
        }}
      >
        <span aria-hidden style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: p.color, borderRadius: "4px 0 0 4px" }} />
        <span style={{ fontFamily: FONTS.sans, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: p.color }}>
          {p.cat}
        </span>
        <div style={{ fontFamily: FONTS.display, fontSize: "1rem", fontWeight: 700, color: COLORS.night, lineHeight: 1.2 }}>
          {p.name}
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: "0.76rem", color: COLORS.muted, lineHeight: 1.45 }}>
          {p.desc}
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.query)}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4, color: p.color, fontFamily: FONTS.sans, fontSize: "0.72rem", fontWeight: 600 }}
        >
          Directions <ExternalLink size={10} />
        </a>
      </div>
    );
  };

  const mapCore = (fullscreen = false) => (
    <MapContainer
      center={MAP_CENTER}
      zoom={11}
      scrollWheelZoom={fullscreen}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer attribution={TILE_ATTR} url={TILE_URL} />
      <FlyToMarker activeId={activeId} />
      <InvalidateSize trigger={String(fullscreen)} />
      {mapMarkers}
    </MapContainer>
  );

  if (isFullscreen) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", flexDirection: "column", background: "#000" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", background: "#fff", borderBottom: "1px solid rgba(38,70,83,0.1)", flexShrink: 0 }}>
          <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "1rem", color: COLORS.night }}>
            Where We'll Roam
          </span>
          <button
            onClick={() => setIsFullscreen(false)}
            aria-label="Close fullscreen map"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 999, background: "rgba(38,70,83,0.08)", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.indigo, cursor: "pointer" }}
          >
            <X size={14} /> Close
          </button>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {mapCore(true)}
        </div>
      </div>
    );
  }

  return (
    <section id="map" ref={sectionRef} style={{ background: COLORS.sand, padding: SPACING.section }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="The Territory" title="Where We'll Roam" />

        {/* Full-width map */}
        <div style={{
          marginTop: 32,
          position: "relative",
          borderRadius: 22,
          overflow: "hidden",
          height: isMobile ? 400 : 560,
          boxShadow: "0 20px 48px rgba(38,70,83,0.15)",
          border: "1px solid rgba(38,70,83,0.08)",
        }}>
          {mapCore(false)}
          <button
            onClick={() => setIsFullscreen(true)}
            aria-label="Open fullscreen map"
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 1000,
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 12px", borderRadius: 8,
              background: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(38,70,83,0.12)",
              fontFamily: FONTS.sans, fontSize: "0.78rem", fontWeight: 600,
              color: COLORS.indigo, cursor: "pointer",
              backdropFilter: "blur(4px)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          >
            <Maximize2 size={13} /> Fullscreen
          </button>
        </div>

        {/* Cards grid below the map */}
        <div style={{
          marginTop: 28,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: 14,
        }}>
          {PLACES.map((p) => placeCard(p))}
        </div>

        <p style={{ marginTop: 16, textAlign: "center", fontFamily: FONTS.sans, fontSize: "0.77rem", color: COLORS.muted }}>
          {PLACES.length} locations · Click a card to fly there · Click a pin for details
        </p>
      </div>
    </section>
  );
}
