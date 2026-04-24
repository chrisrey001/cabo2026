import React, { useEffect, useState } from "react";
import { ChevronDown, Plus, Trash2, X } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import EditField from "../components/EditField";
import { SectionHeader } from "./Cast";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";

const DEFAULT_DAYS = [
  {
    id: "local-1",
    emoji: "✈️",
    title: "Arrival Day",
    day_label: "Sun, Jun 14",
    sort: 0,
    events: [
      { id: 1, time: "9:25 AM", desc: "Alaska 247 departs LAX" },
      { id: 2, time: "2:08 PM", desc: "Land in SJD, clear customs" },
      { id: 3, time: "3:30 PM", desc: "Shuttle to Villa Dos Mares" },
      { id: 4, time: "Evening", desc: "Stock the fridge, sunset drinks on the patio" },
    ],
  },
  {
    id: "local-2",
    emoji: "🏖️",
    title: "Beach & Pool",
    day_label: "Mon, Jun 15",
    sort: 1,
    events: [
      { id: 1, time: "Morning", desc: "Coffee, slow breakfast" },
      { id: 2, time: "Midday", desc: "Palmilla Beach — umbrellas, swim" },
      { id: 3, time: "Evening", desc: "Dinner at Nick-San Palmilla (walkable)" },
    ],
  },
  {
    id: "local-3",
    emoji: "🎣",
    title: "Adventure Day",
    day_label: "Tue, Jun 16",
    sort: 2,
    events: [
      { id: 1, time: "6:30 AM", desc: "Deep-sea fishing from Puerto Los Cabos" },
      { id: 2, time: "1:00 PM", desc: "Back at the villa, pool recovery" },
      { id: 3, time: "Evening", desc: "Grill the catch, tequila tasting" },
    ],
  },
];

export default function Itinerary() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasSupabase) {
        if (!alive) return;
        setDays(DEFAULT_DAYS);
        setOpenId(DEFAULT_DAYS[0].id);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("days")
        .select("id, emoji, title, day_label, sort, events")
        .order("sort", { ascending: true });
      if (!alive) return;
      let rows;
      if (error) {
        rows = DEFAULT_DAYS;
      } else if (!data || !data.length) {
        const seedRows = DEFAULT_DAYS.map(({ id, ...rest }) => rest);
        const { data: seeded, error: seedError } = await supabase
          .from("days")
          .insert(seedRows)
          .select();
        if (!alive) return;
        if (seedError) console.error("[cabo2026] days seed failed:", seedError);
        rows = seedError || !seeded
          ? DEFAULT_DAYS
          : [...seeded].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
      } else {
        rows = data;
      }
      setDays(rows);
      setOpenId(rows[0]?.id ?? null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = async (row) => {
    if (!hasSupabase) return;
    emitSave("saving");
    const { error } = await supabase.from("days").upsert(row);
    if (error) console.error("[cabo2026] days upsert failed:", error, "payload:", row);
    emitSave(error ? "error" : "saved");
  };

  const updateDay = (id, patch) => {
    const next = days.map((d) => (d.id === id ? { ...d, ...patch } : d));
    setDays(next);
    const row = next.find((d) => d.id === id);
    persist(row);
  };

  const addDay = async () => {
    const nextSort = days.length ? Math.max(...days.map((d) => d.sort ?? 0)) + 1 : 0;
    const draft = {
      id: `local-${Date.now()}`,
      emoji: "🌅",
      title: "New Day",
      day_label: "",
      sort: nextSort,
      events: [{ id: 1, time: "", desc: "" }],
    };
    if (!hasSupabase) {
      setDays([...days, draft]);
      setOpenId(draft.id);
      return;
    }
    emitSave("saving");
    const { data, error } = await supabase
      .from("days")
      .insert({
        emoji: draft.emoji,
        title: draft.title,
        day_label: draft.day_label,
        sort: nextSort,
        events: draft.events,
      })
      .select()
      .single();
    if (error) {
      console.error("[cabo2026] days insert failed:", error);
      setDays([...days, draft]);
      setOpenId(draft.id);
      emitSave("error");
      return;
    }
    setDays([...days, data]);
    setOpenId(data.id);
    emitSave("saved");
  };

  const removeDay = async (id) => {
    const next = days.filter((d) => d.id !== id);
    setDays(next);
    if (openId === id) setOpenId(next[0]?.id ?? null);
    if (!hasSupabase || String(id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("days").delete().eq("id", id);
    if (error) console.error("[cabo2026] days delete failed:", error);
    emitSave(error ? "error" : "saved");
  };

  const addEvent = (dayId) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const nextId = day.events.length ? Math.max(...day.events.map((e) => e.id ?? 0)) + 1 : 1;
    const events = [...(day.events || []), { id: nextId, time: "", desc: "" }];
    updateDay(dayId, { events });
  };

  const updateEvent = (dayId, eventId, patch) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const events = (day.events || []).map((e) => (e.id === eventId ? { ...e, ...patch } : e));
    updateDay(dayId, { events });
  };

  const removeEvent = (dayId, eventId) => {
    const day = days.find((d) => d.id === dayId);
    if (!day) return;
    const events = (day.events || []).filter((e) => e.id !== eventId);
    updateDay(dayId, { events });
  };

  return (
    <section
      id="itinerary"
      style={{
        background: COLORS.sand,
        padding: "100px 24px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <SectionHeader eyebrow="Day by Day" title="The Itinerary" />

        {loading ? (
          <div style={{ marginTop: 48, display: "grid", gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 64 }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ marginTop: 48, display: "grid", gap: 12 }}>
              {days.map((d) => (
                <DayCard
                  key={d.id}
                  day={d}
                  open={openId === d.id}
                  canDelete={days.length > 1}
                  onToggle={() => setOpenId(openId === d.id ? null : d.id)}
                  onChange={(patch) => updateDay(d.id, patch)}
                  onRemove={() => removeDay(d.id)}
                  onAddEvent={() => addEvent(d.id)}
                  onUpdateEvent={(eventId, patch) => updateEvent(d.id, eventId, patch)}
                  onRemoveEvent={(eventId) => removeEvent(d.id, eventId)}
                />
              ))}
            </div>

            <div style={{ marginTop: 28, display: "flex", justifyContent: "center" }}>
              <button
                onClick={addDay}
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
                <Plus size={16} /> Add Another Day
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function DayCard({ day, open, canDelete, onToggle, onChange, onRemove, onAddEvent, onUpdateEvent, onRemoveEvent }) {
  const events = day.events || [];

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(38,70,83,0.08)",
        boxShadow: open ? "0 14px 34px rgba(38,70,83,0.1)" : "0 4px 14px rgba(38,70,83,0.04)",
        overflow: "hidden",
        transition: "box-shadow 0.25s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "18px 20px",
        }}
      >
        <button
          onClick={onToggle}
          aria-expanded={open}
          style={{ fontSize: "1.6rem", lineHeight: 1, padding: 0 }}
        >
          {day.emoji || "🌞"}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontSize: "1.15rem",
              fontWeight: 700,
              color: COLORS.night,
              letterSpacing: "-0.01em",
            }}
          >
            <EditField
              value={day.title}
              onChange={(v) => onChange({ title: v })}
              placeholder="Day title"
              ariaLabel="Day title"
            />
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.8rem",
              color: COLORS.muted,
              marginTop: 2,
            }}
          >
            <EditField
              value={day.day_label}
              onChange={(v) => onChange({ day_label: v })}
              placeholder="Day label"
              ariaLabel="Day label"
            />
          </div>
        </div>
        {canDelete && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${day.title || "day"}`}
            style={{
              color: COLORS.muted,
              opacity: 0.55,
              padding: 6,
              borderRadius: 8,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = COLORS.terracotta;
              e.currentTarget.style.opacity = 1;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = COLORS.muted;
              e.currentTarget.style.opacity = 0.55;
            }}
          >
            <Trash2 size={15} />
          </button>
        )}
        <button
          onClick={onToggle}
          aria-label={open ? "Collapse day" : "Expand day"}
          style={{ padding: 6, color: COLORS.indigo }}
        >
          <ChevronDown
            size={20}
            style={{
              transition: "transform 0.25s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>

      {open && (
        <div className="fade-up" style={{ padding: "6px 22px 22px 44px" }}>
          <div
            style={{
              position: "relative",
              borderLeft: `2px solid rgba(42,157,143,0.33)`,
              paddingLeft: 22,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {events.map((ev) => (
              <div key={ev.id} style={{ position: "relative" }}>
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: -28,
                    top: 6,
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: COLORS.teal,
                    boxShadow: "0 0 0 3px #fff, 0 0 0 4px rgba(42,157,143,0.25)",
                  }}
                />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: COLORS.teal,
                        textTransform: "uppercase",
                        letterSpacing: "0.16em",
                        marginBottom: 4,
                      }}
                    >
                      <EditField
                        value={ev.time}
                        onChange={(v) => onUpdateEvent(ev.id, { time: v })}
                        placeholder="Time"
                        ariaLabel="Event time"
                      />
                    </div>
                    <div
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: "0.95rem",
                        color: COLORS.night,
                        lineHeight: 1.5,
                      }}
                    >
                      <EditField
                        value={ev.desc}
                        onChange={(v) => onUpdateEvent(ev.id, { desc: v })}
                        placeholder="What's happening?"
                        ariaLabel="Event description"
                        multiline
                        style={{ display: "block" }}
                      />
                    </div>
                  </div>
                  {events.length > 1 && (
                    <button
                      onClick={() => onRemoveEvent(ev.id)}
                      aria-label="Remove event"
                      style={{
                        color: COLORS.muted,
                        opacity: 0.5,
                        padding: 4,
                        borderRadius: 6,
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = COLORS.terracotta;
                        e.currentTarget.style.opacity = 1;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = COLORS.muted;
                        e.currentTarget.style.opacity = 0.5;
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              onClick={onAddEvent}
              style={{
                alignSelf: "flex-start",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontFamily: FONTS.sans,
                fontSize: "0.8rem",
                fontWeight: 600,
                color: COLORS.teal,
                padding: "6px 12px",
                borderRadius: 999,
                background: "rgba(42,157,143,0.08)",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.16)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
            >
              <Plus size={14} /> Add event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
