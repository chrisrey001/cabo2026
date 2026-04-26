import React, { useEffect, useState } from "react";
import { Plane, Trash2, Plus } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import EditField from "../components/EditField";
import { SectionHeader } from "./Cast";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";

const BLANK_LEG = (kind) => ({
  airline: "",
  flight_no: "",
  date: "",
  depart_time: "",
  arrive_time: "",
  duration: "",
  depart_code: kind === "outbound" ? "LAX" : "SJD",
  arrive_code: kind === "outbound" ? "SJD" : "LAX",
});

const DEFAULT_FLIGHTS = [
  {
    id: "local-1",
    couple: "Chris & Kate",
    sort: 0,
    outbound: {
      airline: "Alaska",
      flight_no: "247",
      date: "Sun, Jun 14",
      depart_time: "9:25 AM",
      arrive_time: "2:08 PM",
      duration: "3h 43m",
      depart_code: "LAX",
      arrive_code: "SJD",
    },
    return_leg: {
      airline: "Alaska",
      flight_no: "248",
      date: "Sat, Jun 20",
      depart_time: "3:05 PM",
      arrive_time: "5:42 PM",
      duration: "3h 37m",
      depart_code: "SJD",
      arrive_code: "LAX",
    },
  },
];

export default function Flights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasSupabase) {
        setFlights(DEFAULT_FLIGHTS);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("flights")
        .select("id, couple, sort, outbound, return_leg")
        .order("sort", { ascending: true });
      if (!alive) return;
      if (error) {
        setFlights(DEFAULT_FLIGHTS);
      } else if (!data || !data.length) {
        const seedRows = DEFAULT_FLIGHTS.map(({ id, ...rest }) => rest);
        const { data: seeded, error: seedError } = await supabase
          .from("flights")
          .insert(seedRows)
          .select();
        if (!alive) return;
        if (seedError || !seeded) {
          console.error("[cabo2026] flights seed failed:", seedError);
          setFlights(DEFAULT_FLIGHTS);
        } else {
          setFlights([...seeded].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)));
        }
      } else {
        setFlights(data);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = async (row) => {
    if (!hasSupabase) return;
    emitSave("saving");
    const { error } = await supabase.from("flights").upsert(row);
    if (error) console.error("[cabo2026] flights upsert failed:", error, "payload:", row);
    emitSave(error ? "error" : "saved");
  };

  const updateRow = (id, patch) => {
    const next = flights.map((f) => (f.id === id ? { ...f, ...patch } : f));
    setFlights(next);
    const row = next.find((f) => f.id === id);
    persist(row);
  };

  const updateLeg = (id, legKey, patch) => {
    const row = flights.find((f) => f.id === id);
    if (!row) return;
    updateRow(id, { [legKey]: { ...(row[legKey] || {}), ...patch } });
  };

  const addCouple = async () => {
    const nextSort = flights.length ? Math.max(...flights.map((f) => f.sort ?? 0)) + 1 : 0;
    const draft = {
      id: `local-${Date.now()}`,
      couple: "New Couple",
      sort: nextSort,
      outbound: BLANK_LEG("outbound"),
      return_leg: BLANK_LEG("return"),
    };
    if (!hasSupabase) {
      setFlights([...flights, draft]);
      return;
    }
    emitSave("saving");
    const { data, error } = await supabase
      .from("flights")
      .insert({
        couple: draft.couple,
        sort: nextSort,
        outbound: draft.outbound,
        return_leg: draft.return_leg,
      })
      .select()
      .single();
    if (error) {
      console.error("[cabo2026] flights insert failed:", error);
      setFlights([...flights, draft]);
      emitSave("error");
      return;
    }
    setFlights([...flights, data]);
    emitSave("saved");
  };

  const removeRow = async (id) => {
    const next = flights.filter((f) => f.id !== id);
    setFlights(next);
    if (!hasSupabase || String(id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("flights").delete().eq("id", id);
    if (error) console.error("[cabo2026] flights delete failed:", error);
    emitSave(error ? "error" : "saved");
  };

  return (
    <section
      id="flights"
      style={{
        background: COLORS.warmWhite,
        padding: SPACING.section,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="Getting There" title="The Flights" />

        {loading ? (
          <div
            style={{
              marginTop: 48,
              display: "grid",
              gap: 24,
            }}
          >
            {[0, 1].map((i) => (
              <div key={i} className="skeleton" style={{ height: 220 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ marginTop: 48, display: "grid", gap: 28 }}>
              {flights.map((f) => (
                <FlightCard
                  key={f.id}
                  row={f}
                  canDelete={flights.length > 1}
                  onCoupleChange={(v) => updateRow(f.id, { couple: v })}
                  onLegChange={(legKey, patch) => updateLeg(f.id, legKey, patch)}
                  onRemove={() => removeRow(f.id)}
                />
              ))}
            </div>
            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <button
                onClick={addCouple}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "12px 22px",
                  border: `2px dashed ${COLORS.teal}`,
                  borderRadius: 999,
                  color: COLORS.teal,
                  fontFamily: FONTS.sans,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  background: "transparent",
                  transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Plus size={16} /> Add Another Couple's Flights
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function FlightCard({ row, canDelete, onCoupleChange, onLegChange, onRemove }) {
  return (
    <div
      style={{
        borderRadius: 20,
        overflow: "hidden",
        background: "#fff",
        border: "1px solid rgba(38,70,83,0.08)",
        boxShadow: "0 12px 28px rgba(38,70,83,0.08)",
      }}
    >
      <div
        style={{
          background: `linear-gradient(90deg, ${COLORS.indigo} 0%, ${COLORS.teal} 100%)`,
          color: "#fff",
          padding: "16px 22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: "1.2rem",
            fontWeight: 700,
          }}
        >
          <EditField
            value={row.couple}
            onChange={onCoupleChange}
            placeholder="Couple name"
            ariaLabel="Couple name"
            style={{ color: "#fff" }}
          />
        </div>
        {canDelete && (
          <button
            onClick={onRemove}
            aria-label="Remove couple"
            style={{
              color: "#fff",
              opacity: 0.75,
              padding: 6,
              borderRadius: 8,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.75)}
          >
            <Trash2 size={17} />
          </button>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 0,
        }}
      >
        <Leg
          kind="outbound"
          leg={row.outbound || {}}
          onChange={(patch) => onLegChange("outbound", patch)}
        />
        <Leg
          kind="return"
          leg={row.return_leg || {}}
          onChange={(patch) => onLegChange("return_leg", patch)}
        />
      </div>
    </div>
  );
}

function Leg({ kind, leg, onChange }) {
  const accent = kind === "outbound" ? COLORS.coral : COLORS.teal;
  const label = kind === "outbound" ? "🛫 OUTBOUND" : "🛬 RETURN";

  return (
    <div
      style={{
        padding: "22px 24px 24px",
        borderTop: `4px solid ${accent}`,
        borderRight: "1px solid rgba(38,70,83,0.06)",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: "0.72rem",
          fontWeight: 700,
          letterSpacing: "0.2em",
          color: accent,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: "0.95rem",
          fontWeight: 700,
          color: COLORS.indigo,
          marginBottom: 4,
        }}
      >
        <EditField
          value={leg.airline}
          onChange={(v) => onChange({ airline: v })}
          placeholder="Airline"
          ariaLabel="Airline"
        />{" "}
        <EditField
          value={leg.flight_no}
          onChange={(v) => onChange({ flight_no: v })}
          placeholder="Flight #"
          ariaLabel="Flight number"
        />
      </div>

      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: "0.82rem",
          color: COLORS.muted,
          marginBottom: 18,
        }}
      >
        <EditField
          value={leg.date}
          onChange={(v) => onChange({ date: v })}
          placeholder="Date"
          ariaLabel="Flight date"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "1.35rem",
              fontWeight: 500,
              color: COLORS.night,
            }}
          >
            <EditField
              value={leg.depart_time}
              onChange={(v) => onChange({ depart_time: v })}
              placeholder="— : —"
              ariaLabel="Departure time"
            />
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: COLORS.muted,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            <EditField
              value={leg.depart_code}
              onChange={(v) => onChange({ depart_code: (v || "").toUpperCase() })}
              placeholder="AAA"
              ariaLabel="Departure airport"
            />
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              position: "relative",
              height: 1,
              width: "100%",
              minWidth: 60,
              background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
            }}
          />
          <Plane
            size={16}
            color={accent}
            style={{
              marginTop: -9,
              background: "#fff",
              padding: 2,
              borderRadius: "50%",
              transform: kind === "return" ? "scaleX(-1)" : "none",
            }}
          />
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "0.78rem",
              color: COLORS.indigo,
              marginTop: 2,
            }}
          >
            <EditField
              value={leg.duration}
              onChange={(v) => onChange({ duration: v })}
              placeholder="—h —m"
              ariaLabel="Flight duration"
            />
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: "1.35rem",
              fontWeight: 500,
              color: COLORS.night,
            }}
          >
            <EditField
              value={leg.arrive_time}
              onChange={(v) => onChange({ arrive_time: v })}
              placeholder="— : —"
              ariaLabel="Arrival time"
            />
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.7rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: COLORS.muted,
              fontWeight: 700,
              marginTop: 2,
            }}
          >
            <EditField
              value={leg.arrive_code}
              onChange={(v) => onChange({ arrive_code: (v || "").toUpperCase() })}
              placeholder="BBB"
              ariaLabel="Arrival airport"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
