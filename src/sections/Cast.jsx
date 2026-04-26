import React, { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import EditField from "../components/EditField";
import CenteredGrid from "../components/CenteredGrid";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";

const DEFAULT_CAST = [
  { id: "local-1", emoji: "🌊", name: "Chris & Kate", role: "The Hosts", confirmed: true, sort: 0 },
  { id: "local-2", emoji: "🌴", name: "", role: "Couple #2", confirmed: false, sort: 1 },
  { id: "local-3", emoji: "🌅", name: "", role: "Couple #3", confirmed: false, sort: 2 },
  { id: "local-4", emoji: "🏄", name: "", role: "Open Slot", confirmed: false, sort: 3 },
];

const EMOJIS = ["🌊", "🌴", "🌅", "🏄", "🍹", "⛵", "🐚", "🌞", "🦩", "🐠"];

export default function Cast() {
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!hasSupabase) {
        setCast(DEFAULT_CAST);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("guests")
        .select("id, emoji, name, role, confirmed, sort")
        .order("sort", { ascending: true });
      if (!alive) return;
      if (error) {
        setCast(DEFAULT_CAST);
      } else if (!data || !data.length) {
        const seedRows = DEFAULT_CAST.map(({ id, ...rest }) => rest);
        const { data: seeded, error: seedError } = await supabase
          .from("guests")
          .insert(seedRows)
          .select();
        if (!alive) return;
        if (seedError || !seeded) {
          console.error("[cabo2026] guests seed failed:", seedError);
          setCast(DEFAULT_CAST);
        } else {
          setCast([...seeded].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)));
        }
      } else {
        setCast(data);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const persist = async (next, changed) => {
    setCast(next);
    if (!hasSupabase || !changed) return;
    emitSave("saving");
    try {
      const { error } = await supabase.from("guests").upsert(changed);
      if (error) throw error;
      emitSave("saved");
    } catch (err) {
      console.error("[cabo2026] guests upsert failed:", err, "payload:", changed);
      emitSave("error");
    }
  };

  const updateOne = (id, patch) => {
    const next = cast.map((c) => (c.id === id ? { ...c, ...patch } : c));
    const row = next.find((c) => c.id === id);
    persist(next, row);
  };

  const addCouple = async () => {
    const nextSort = cast.length ? Math.max(...cast.map((c) => c.sort ?? 0)) + 1 : 0;
    const emoji = EMOJIS[cast.length % EMOJIS.length];
    const draft = {
      id: `local-${Date.now()}`,
      emoji,
      name: "",
      role: "New Guest",
      confirmed: false,
      sort: nextSort,
    };
    if (!hasSupabase) {
      setCast([...cast, draft]);
      return;
    }
    emitSave("saving");
    const { data, error } = await supabase
      .from("guests")
      .insert({ emoji: draft.emoji, name: draft.name, role: draft.role, confirmed: false, sort: nextSort })
      .select()
      .single();
    if (error) {
      console.error("[cabo2026] guests insert failed:", error);
      setCast([...cast, draft]);
      emitSave("error");
      return;
    }
    setCast([...cast, data]);
    emitSave("saved");
  };

  const removeOne = async (id) => {
    const next = cast.filter((c) => c.id !== id);
    setCast(next);
    if (!hasSupabase || String(id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("guests").delete().eq("id", id);
    if (error) console.error("[cabo2026] guests delete failed:", error);
    emitSave(error ? "error" : "saved");
  };

  return (
    <section
      id="cast"
      style={{
        background: COLORS.warmWhite,
        padding: SPACING.section,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader eyebrow="The Cast" title="Who's Coming" />

        {loading ? (
          <CenteredGrid minWidth={220} gap={20} style={{ marginTop: 48 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton" style={{ height: 200 }} />
            ))}
          </CenteredGrid>
        ) : (
          <>
            <CenteredGrid minWidth={220} gap={20} style={{ marginTop: 48 }}>
              {cast.map((c) => (
                <CastCard
                  key={c.id}
                  person={c}
                  canDelete={cast.length > 1}
                  onUpdate={(patch) => updateOne(c.id, patch)}
                  onRemove={() => removeOne(c.id)}
                />
              ))}
            </CenteredGrid>
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
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Plus size={16} /> Add Person / Couple
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function CastCard({ person, canDelete, onUpdate, onRemove }) {
  const filled = (person.name ?? "").trim().length > 0;
  const confirmed = !!person.confirmed;

  const cardStyle = confirmed
    ? {
        border: `2px solid ${COLORS.teal}`,
        background: `linear-gradient(160deg, ${COLORS.foam} 0%, #fff 80%)`,
        boxShadow: "0 10px 24px rgba(42,157,143,0.12)",
      }
    : {
        border: "2px dashed rgba(38,70,83,0.15)",
        background: "#fff",
      };

  let pillText = "Open Slot";
  let pillBg = "rgba(38,70,83,0.07)";
  let pillFg = COLORS.muted;
  if (confirmed) {
    pillText = "✓ Confirmed";
    pillBg = "rgba(42,157,143,0.15)";
    pillFg = COLORS.teal;
  } else if (filled) {
    pillText = "Tap to Confirm";
    pillBg = "rgba(38,70,83,0.07)";
    pillFg = COLORS.muted;
  }

  return (
    <div
      style={{
        position: "relative",
        padding: "26px 22px 22px",
        borderRadius: 18,
        transition: "all 0.25s ease",
        ...cardStyle,
      }}
    >
      {canDelete && (
        <button
          onClick={onRemove}
          aria-label={`Remove ${person.name || "guest"}`}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            padding: 6,
            borderRadius: 8,
            color: COLORS.muted,
            opacity: 0.6,
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = COLORS.terracotta;
            e.currentTarget.style.opacity = 1;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = COLORS.muted;
            e.currentTarget.style.opacity = 0.6;
          }}
        >
          <Trash2 size={15} />
        </button>
      )}

      <div style={{ fontSize: "2.5rem", marginBottom: 10, lineHeight: 1 }}>{person.emoji || "✨"}</div>

      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: "1.1rem",
          fontWeight: 700,
          color: COLORS.night,
          marginBottom: 4,
        }}
      >
        <EditField
          value={person.name}
          onChange={(v) => onUpdate({ name: v })}
          placeholder="Add name…"
          ariaLabel="Guest name"
        />
      </div>

      <div
        style={{
          fontSize: "0.8rem",
          fontStyle: "italic",
          color: COLORS.muted,
          marginBottom: 16,
        }}
      >
        <EditField
          value={person.role}
          onChange={(v) => onUpdate({ role: v })}
          placeholder="Add role…"
          ariaLabel="Guest role"
          style={{ fontStyle: "italic" }}
        />
      </div>

      <button
        onClick={() => onUpdate({ confirmed: !confirmed })}
        style={{
          fontFamily: FONTS.sans,
          fontSize: "0.72rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          padding: "8px 14px",
          borderRadius: 999,
          background: pillBg,
          color: pillFg,
          transition: "all 0.2s ease",
          minHeight: 36,
        }}
      >
        {pillText}
      </button>
    </div>
  );
}

export function SectionHeader({ eyebrow, title, light = false }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: FONTS.sans,
          fontSize: "0.78rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          color: light ? COLORS.gold : COLORS.terracotta,
          marginBottom: 12,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: FONTS.display,
          fontSize: "clamp(2rem, 5vw, 3.2rem)",
          fontWeight: 800,
          margin: 0,
          color: light ? COLORS.foam : COLORS.indigo,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h2>
    </div>
  );
}
