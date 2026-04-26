import React, { useEffect, useMemo, useState } from "react";
import { UtensilsCrossed, Clock, MapPin, Phone, Navigation, Heart, Plus } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import EditField from "../components/EditField";
import CenteredGrid from "../components/CenteredGrid";
import VoterModal from "../components/VoterModal";
import VoterPills from "../components/VoterPills";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";
import { useVoterIdentity } from "../hooks/useVoterIdentity";

const DEFAULT_DINING = [
  { name: "Flora Farms", cost: "$80–100/pp", cuisine: "Farm-to-Table", distance: "20 min drive", hours: "5:30 – 10 PM", phone: "+52 624 355 4564", vibe: "Magical outdoor farm", book: "OpenTable, 4+ weeks ahead", cost_num: 90, sort: 0 },
  { name: "Nick-San Palmilla", cost: "$70–95/pp", cuisine: "Japanese-Mexican Fusion", distance: "2 min walk", hours: "12 – 10:30 PM", phone: "+52 624 144 6262", vibe: "Elevated sushi, walkable", book: "Call ahead", cost_num: 82, sort: 1 },
  { name: "El Farallón", cost: "$135–315/pp", cuisine: "Cliffside Seafood", distance: "25 min drive", hours: "5:30 – 10 PM", phone: "+52 624 163 0000", vibe: "Prix fixe, Waldorf Astoria", book: "Hotel concierge", cost_num: 225, sort: 2 },
  { name: "Sunset Monalisa", cost: "$135–200/pp", cuisine: "Mediterranean", distance: "20 min drive", hours: "4 – 11 PM", phone: "+52 624 145 8160", vibe: "Fine dining, cliffside sunset", book: "Reserve online", cost_num: 167, sort: 3 },
  { name: "Jazamín's", cost: "$55–70/pp", cuisine: "Traditional Mexican", distance: "10 min drive", hours: "5 – 11 PM", phone: "+52 624 105 2279", vibe: "Lively, Art Walk night pick", book: "Walk-in OK", cost_num: 62, sort: 4 },
  { name: "One&Only Restaurants", cost: "$80–130/pp", cuisine: "SUVICHE / Seared / Agua", distance: "Walkable", hours: "Varies by venue", phone: "+52 624 146 7000", vibe: "Resort dining, multiple options", book: "Resort reservation", cost_num: 105, sort: 5 },
];

const SORTS = [
  { id: "name", label: "Name" },
  { id: "cost", label: "Cost" },
  { id: "distance", label: "Distance" },
  { id: "votes", label: "Votes" },
];

const BLANK_FORM = { name: "", cost: "", cuisine: "", distance: "", hours: "", phone: "", vibe: "", book: "" };

export default function Dining() {
  const { voterId, voterName, setVoterName, hasName } = useVoterIdentity();
  const [restaurants, setRestaurants] = useState([]);
  const [rvotes, setRvotes] = useState([]);   // restaurant_votes rows
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState("name");
  const [showModal, setShowModal] = useState(false);
  const [pendingVote, setPendingVote] = useState(null); // restaurantId
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabase) {
      setRestaurants(DEFAULT_DINING.map((r, i) => ({ ...r, id: `local-${i}`, added_by: null })));
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: rData, error: rErr }, { data: vData, error: vErr }] = await Promise.all([
        supabase.from("restaurants").select("*").order("sort", { ascending: true }),
        supabase.from("restaurant_votes").select("*"),
      ]);
      if (rErr) console.error("[cabo2026] restaurants load failed:", rErr);
      if (vErr) console.error("[cabo2026] restaurant_votes load failed:", vErr);

      let rows = rData || [];
      if (!rows.length) {
        const { data: seeded, error: seedErr } = await supabase
          .from("restaurants").insert(DEFAULT_DINING).select();
        if (seedErr) console.error("[cabo2026] restaurants seed failed:", seedErr);
        rows = seeded || DEFAULT_DINING.map((r, i) => ({ ...r, id: `local-${i}` }));
      }
      setRestaurants(rows);
      setRvotes(vData || []);
      setLoading(false);
    })();
  }, []);

  const persist = async (row) => {
    if (!hasSupabase || String(row.id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("restaurants").upsert(row);
    if (error) { console.error("[cabo2026] restaurants upsert failed:", error); emitSave("error"); }
    else emitSave("saved");
  };

  const updateOne = (id, patch) => {
    setRestaurants((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, ...patch } : r));
      const row = next.find((r) => r.id === id);
      persist(row);
      return next;
    });
  };

  const voteCount = (id) => rvotes.filter((v) => v.restaurant_id === id).length;
  const myVoted = (id) => rvotes.some((v) => v.restaurant_id === id && v.voter_id === voterId);

  const castVote = async (restaurantId, name) => {
    const already = myVoted(restaurantId);
    if (already) {
      // toggle off
      setRvotes((prev) => prev.filter((v) => !(v.restaurant_id === restaurantId && v.voter_id === voterId)));
      if (!hasSupabase) return;
      await supabase.from("restaurant_votes").delete().match({ restaurant_id: restaurantId, voter_id: voterId });
    } else {
      const row = { restaurant_id: restaurantId, voter_id: voterId, voter_name: name || null };
      setRvotes((prev) => [...prev, { ...row, id: `local-${Date.now()}` }]);
      if (!hasSupabase) return;
      const { error } = await supabase.from("restaurant_votes").insert(row);
      if (error) {
        console.error("[cabo2026] restaurant_votes insert failed:", error);
        setRvotes((prev) => prev.filter((v) => !(v.restaurant_id === restaurantId && v.voter_id === voterId)));
      }
    }
  };

  const handleVoteClick = (id) => {
    if (!hasName && !myVoted(id)) {
      setPendingVote(id);
      setShowModal(true);
    } else {
      castVote(id, voterName);
    }
  };

  const handleModalConfirm = (name) => {
    setShowModal(false);
    if (name) setVoterName(name);
    if (pendingVote) { castVote(pendingVote, name || voterName || null); setPendingVote(null); }
  };

  const addRestaurant = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    const nextSort = restaurants.length ? Math.max(...restaurants.map((r) => r.sort ?? 0)) + 1 : 0;
    const draft = { ...form, cost_num: 0, sort: nextSort, added_by: voterName || null };

    if (!hasSupabase) {
      setRestaurants((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    } else {
      emitSave("saving");
      const { data, error } = await supabase.from("restaurants").insert(draft).select().single();
      if (error) { console.error("[cabo2026] restaurant insert failed:", error); emitSave("error"); }
      else { setRestaurants((prev) => [...prev, data]); emitSave("saved"); }
    }
    setForm(BLANK_FORM); setShowForm(false); setSubmitting(false);
  };

  const sorted = useMemo(() => {
    const arr = [...restaurants];
    if (sortKey === "cost") arr.sort((a, b) => (a.cost_num || 0) - (b.cost_num || 0));
    else if (sortKey === "distance") arr.sort((a, b) => a.distance.localeCompare(b.distance));
    else if (sortKey === "votes") arr.sort((a, b) => voteCount(b.id) - voteCount(a.id));
    else arr.sort((a, b) => a.name.localeCompare(b.name));
    return arr;
  }, [restaurants, rvotes, sortKey]);

  return (
    <>
      {showModal && (
        <VoterModal onConfirm={handleModalConfirm} onDismiss={() => { setShowModal(false); setPendingVote(null); }} />
      )}
      <section id="dining" style={{ background: COLORS.warmWhite, padding: SPACING.section }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <SectionHeader eyebrow="Where We'll Eat" title="The Dining Guide" />

          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted, alignSelf: "center", marginRight: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.14em" }}>Sort by</span>
            {SORTS.map((s) => {
              const active = sortKey === s.id;
              return (
                <button key={s.id} onClick={() => setSortKey(s.id)} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: active ? 700 : 500, padding: "7px 16px", borderRadius: 999, color: active ? "#fff" : COLORS.indigo, background: active ? COLORS.indigo : "rgba(38,70,83,0.06)", transition: "all 0.2s ease" }}>
                  {s.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <CenteredGrid minWidth={320} gap={16} style={{ marginTop: 32 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
            </CenteredGrid>
          ) : (
            <CenteredGrid minWidth={320} gap={16} style={{ marginTop: 32 }}>
              {sorted.map((r) => (
                <DiningCard
                  key={r.id}
                  r={r}
                  voteCount={voteCount(r.id)}
                  myVoted={myVoted(r.id)}
                  voters={rvotes.filter((v) => v.restaurant_id === r.id)}
                  onUpdate={(patch) => updateOne(r.id, patch)}
                  onVote={() => handleVoteClick(r.id)}
                />
              ))}
            </CenteredGrid>
          )}

          {showForm ? (
            <div style={{ marginTop: 24, background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.1)", padding: "22px 24px", maxWidth: 600, margin: "24px auto 0" }}>
              <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "1rem", color: COLORS.night, margin: "0 0 14px" }}>Add a restaurant</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[["name", "Name *"], ["cuisine", "Cuisine"], ["cost", "Cost (e.g. $60–80/pp)"], ["hours", "Hours"], ["distance", "Distance"], ["phone", "Phone"], ["vibe", "Vibe"], ["book", "How to Book"]].map(([k, label]) => (
                  <input key={k} type="text" placeholder={label} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} style={{ fontFamily: FONTS.sans, fontSize: "0.88rem", padding: "9px 12px", borderRadius: 8, border: "1.5px solid rgba(38,70,83,0.15)", outline: "none", color: COLORS.night, gridColumn: k === "name" ? "span 2" : undefined }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowForm(false); setForm(BLANK_FORM); }} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, padding: "8px 14px" }}>Cancel</button>
                <button onClick={addRestaurant} disabled={submitting || !form.name.trim()} style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: "0.82rem", padding: "8px 18px", borderRadius: 999, background: COLORS.teal, color: "#fff", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", border: `2px dashed ${COLORS.coral}`, borderRadius: 999, color: COLORS.coral, fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem", background: "transparent", transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,132,95,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Plus size={16} /> Add a Restaurant
              </button>
            </div>
          )}

          <p style={{ marginTop: 20, textAlign: "center", fontFamily: FONTS.sans, fontStyle: "italic", fontSize: "0.82rem", color: COLORS.muted }}>
            Verify phone numbers before booking — they change.
          </p>
        </div>
      </section>
    </>
  );
}

function DiningCard({ r, voteCount, myVoted, voters, onUpdate, onVote }) {
  const [showVoters, setShowVoters] = useState(false);
  const telHref = `tel:${(r.phone || "").replace(/[^+\d]/g, "")}`;
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${r.name} Los Cabos`)}`;

  return (
    <article style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.08)", boxShadow: "0 8px 22px rgba(38,70,83,0.07)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <UtensilsCrossed size={18} color={COLORS.coral} style={{ flexShrink: 0 }} />
            <h3 style={{ fontFamily: FONTS.display, fontSize: "1.2rem", fontWeight: 700, color: COLORS.night, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.2 }}>
              <EditField value={r.name} onChange={(v) => onUpdate({ name: v })} placeholder="Restaurant name" ariaLabel="Restaurant name" />
            </h3>
          </div>
          {/* Vote button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
            <button onClick={onVote} aria-label={myVoted ? "Remove vote" : "Vote for this restaurant"} style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 12px", borderRadius: 999, background: myVoted ? "rgba(231,111,81,0.12)" : "rgba(38,70,83,0.05)", transition: "all 0.15s ease" }}>
              <Heart size={14} color={myVoted ? COLORS.terracotta : COLORS.muted} fill={myVoted ? COLORS.terracotta : "none"} />
              <span style={{ fontFamily: FONTS.mono, fontSize: "0.75rem", color: myVoted ? COLORS.terracotta : COLORS.muted, fontWeight: 600 }}>{voteCount}</span>
            </button>
            {voters.length > 0 && (
              <button onClick={() => setShowVoters((v) => !v)} style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, textDecoration: "underline", textUnderlineOffset: 2 }}>
                {showVoters ? "hide" : "who?"}
              </button>
            )}
          </div>
        </div>
        <div style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, marginLeft: 28 }}>
          <EditField value={r.cuisine} onChange={(v) => onUpdate({ cuisine: v })} placeholder="Cuisine type" ariaLabel="Cuisine" />
        </div>
        <span style={{ display: "block", fontFamily: FONTS.mono, fontSize: "0.85rem", color: COLORS.teal, fontWeight: 500, marginLeft: 28, marginTop: 4 }}>
          <EditField value={r.cost} onChange={(v) => onUpdate({ cost: v })} placeholder="$00–00/pp" ariaLabel="Cost" />
        </span>
        {showVoters && voters.length > 0 && (
          <div style={{ marginLeft: 28, marginTop: 8 }}>
            <VoterPills voters={voters} />
          </div>
        )}
      </div>

      <div style={{ padding: "14px 22px 18px", borderTop: "1px solid rgba(38,70,83,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 14px", fontFamily: FONTS.sans, fontSize: "0.85rem", color: COLORS.indigo, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={14} color={COLORS.teal} style={{ flexShrink: 0 }} />
          <EditField value={r.hours} onChange={(v) => onUpdate({ hours: v })} placeholder="Hours" ariaLabel="Hours" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={14} color={COLORS.teal} style={{ flexShrink: 0 }} />
          <EditField value={r.distance} onChange={(v) => onUpdate({ distance: v })} placeholder="Distance" ariaLabel="Distance" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ fontSize: "0.9rem" }}>✨</span>
          <EditField value={r.vibe} onChange={(v) => onUpdate({ vibe: v })} placeholder="Vibe" ariaLabel="Vibe" />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontStyle: "italic", color: COLORS.muted }}>
          <span aria-hidden style={{ fontSize: "0.9rem" }}>📋</span>
          <EditField value={r.book} onChange={(v) => onUpdate({ book: v })} placeholder="How to book" ariaLabel="How to book" />
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(38,70,83,0.08)", display: "grid", gridTemplateColumns: "1fr 1px 1fr", alignItems: "stretch" }}>
        <a href={telHref} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 12px", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.teal, transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <Phone size={14} />
          <EditField value={r.phone} onChange={(v) => onUpdate({ phone: v })} placeholder="+52 …" ariaLabel="Phone number" />
        </a>
        <span aria-hidden style={{ background: "rgba(38,70,83,0.08)" }} />
        <a href={mapHref} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 12px", fontFamily: FONTS.sans, fontSize: "0.82rem", fontWeight: 600, color: COLORS.coral, transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(244,132,95,0.09)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
          <Navigation size={14} />
          Directions
        </a>
      </div>
    </article>
  );
}
