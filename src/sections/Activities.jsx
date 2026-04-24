import React, { useCallback, useEffect, useState, useMemo } from "react";
import { ChevronDown, Heart, Plus, Sparkles } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";
import EditField from "../components/EditField";
import VoterModal from "../components/VoterModal";
import VoterPills from "../components/VoterPills";
import SuggestionsModal from "../components/SuggestionsModal";
import CommentThread from "../components/CommentThread";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";
import { useVoterIdentity } from "../hooks/useVoterIdentity";

const DEFAULT_ACTIVITIES = [
  { title: "Flora Farms Dinner", icon: "🌿", cost: "$80–100/pp", duration: "Evening", distance: "~20 min drive", description: "A Michelin-recommended farm-to-table experience on a 25-acre organic farm. Dine under string lights with handcrafted cocktails and produce pulled from the ground that morning. This is the farewell dinner — book 4+ weeks ahead on OpenTable.", tag: "Culinary", sort: 0 },
  { title: "Cabo Arch Boat Tour", icon: "⛵", cost: "$25–40/pp", duration: "2–3 hrs", distance: "30 min to Cabo Marina", description: "Cruise to Land's End to see El Arco — the iconic rock formation where the Pacific meets the Sea of Cortez. Stop at Lover's Beach, spot sea lions, and snap the postcard shot. Morning light is best.", tag: "Sightseeing", sort: 1 },
  { title: "San José Art Walk", icon: "🎨", cost: "FREE", duration: "5–9 PM", distance: "10 min to downtown", description: "Thursday June 18 is the final Art Walk of the season. Local galleries open their doors, street musicians play, and the colonial downtown comes alive. Pair with dinner at Jazamín's afterward.", tag: "Culture", sort: 2 },
  { title: "Deep-Sea Fishing Charter", icon: "🎣", cost: "$335–520/boat", duration: "Half day", distance: "10 min to Puerto Los Cabos", description: "June is peak season for marlin and dorado. Charter a boat from Puerto Los Cabos marina and chase big game in the nutrient-rich waters where the Pacific meets the Cortez. Split the boat 4 ways.", tag: "Adventure", sort: 3 },
  { title: "ATV + Camel + Tequila", icon: "🐪", cost: "$130–165/pp", duration: "3–4 hrs", distance: "~30 min drive", description: "Rip through the Baja desert on ATVs, ride a camel along the dunes, then cap it off with a proper tequila tasting. This is the day you come home with the best stories.", tag: "Adventure", sort: 4 },
];

const TAG_COLORS = {
  Culinary: COLORS.coral,
  Sightseeing: COLORS.teal,
  Culture: COLORS.terracotta,
  Adventure: COLORS.indigo,
};

const TAGS = ["Culinary", "Sightseeing", "Culture", "Adventure", "Other"];

const SORTS = [
  { id: "votes", label: "Votes" },
  { id: "tag", label: "Tag" },
  { id: "cost", label: "Cost" },
];

function parseCostNum(cost) {
  if (!cost) return 0;
  if (cost.toUpperCase().includes("FREE")) return 0;
  const m = cost.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

const BLANK_FORM = { icon: "✨", title: "", tag: "Adventure", cost: "", duration: "", distance: "", description: "" };

export default function Activities() {
  const { voterId, voterName, setVoterName, hasName } = useVoterIdentity();
  const [activities, setActivities] = useState([]);
  const [avotes, setAvotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [sortKey, setSortKey] = useState("votes");
  const [showModal, setShowModal] = useState(false);
  const [pendingVote, setPendingVote] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestModal, setShowSuggestModal] = useState(false);

  useEffect(() => {
    if (!hasSupabase) {
      setActivities(DEFAULT_ACTIVITIES.map((a, i) => ({ ...a, id: `local-${i}`, added_by: null })));
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: aData, error: aErr }, { data: vData, error: vErr }, { data: cData, error: cErr }] = await Promise.all([
        supabase.from("activities").select("*").order("sort", { ascending: true }),
        supabase.from("activity_votes").select("*"),
        supabase.from("activity_comments").select("*").order("created_at", { ascending: true }),
      ]);
      if (aErr) console.error("[cabo2026] activities load failed:", aErr);
      if (vErr) console.error("[cabo2026] activity_votes load failed:", vErr);
      if (cErr) console.error("[cabo2026] activity_comments load failed:", cErr);

      let rows = aData || [];
      if (!rows.length) {
        const { data: seeded, error: seedErr } = await supabase.from("activities").insert(DEFAULT_ACTIVITIES).select();
        if (seedErr) console.error("[cabo2026] activities seed failed:", seedErr);
        rows = seeded || DEFAULT_ACTIVITIES.map((a, i) => ({ ...a, id: `local-${i}` }));
      }
      setActivities(rows);
      setAvotes(vData || []);
      setComments(cData || []);
      setLoading(false);
    })();
  }, []);

  const persist = async (row) => {
    if (!hasSupabase || String(row.id).startsWith("local-")) return;
    emitSave("saving");
    const { error } = await supabase.from("activities").upsert(row);
    if (error) { console.error("[cabo2026] activities upsert failed:", error); emitSave("error"); }
    else emitSave("saved");
  };

  const updateOne = (id, patch) => {
    setActivities((prev) => {
      const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
      persist(next.find((a) => a.id === id));
      return next;
    });
  };

  const voteCount = (id) => avotes.filter((v) => v.activity_id === id).length;
  const myVoted = (id) => avotes.some((v) => v.activity_id === id && v.voter_id === voterId);

  const castVote = async (activityId, name) => {
    const already = myVoted(activityId);
    if (already) {
      setAvotes((prev) => prev.filter((v) => !(v.activity_id === activityId && v.voter_id === voterId)));
      if (!hasSupabase) return;
      await supabase.from("activity_votes").delete().match({ activity_id: activityId, voter_id: voterId });
    } else {
      const row = { activity_id: activityId, voter_id: voterId, voter_name: name || null };
      setAvotes((prev) => [...prev, { ...row, id: `local-${Date.now()}` }]);
      if (!hasSupabase) return;
      const { error } = await supabase.from("activity_votes").insert(row);
      if (error) {
        console.error("[cabo2026] activity_votes insert failed:", error);
        setAvotes((prev) => prev.filter((v) => !(v.activity_id === activityId && v.voter_id === voterId)));
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

  const addActivity = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    const nextSort = activities.length ? Math.max(...activities.map((a) => a.sort ?? 0)) + 1 : 0;
    const draft = { ...form, sort: nextSort, added_by: voterName || null };

    if (!hasSupabase) {
      setActivities((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    } else {
      emitSave("saving");
      const { data, error } = await supabase.from("activities").insert(draft).select().single();
      if (error) { console.error("[cabo2026] activity insert failed:", error); emitSave("error"); }
      else { setActivities((prev) => [...prev, data]); emitSave("saved"); }
    }
    setForm(BLANK_FORM); setShowForm(false); setSubmitting(false);
  };

  const addComment = async (activityId, body) => {
    const author = localStorage.getItem("cabo26:voter_name") || null;
    const draft = { activity_id: activityId, author, body, created_at: new Date().toISOString() };
    const optimisticId = `local-${Date.now()}`;
    setComments((prev) => [...prev, { ...draft, id: optimisticId }]);
    if (!hasSupabase) return;
    const { data, error } = await supabase.from("activity_comments").insert({ activity_id: activityId, author, body }).select().single();
    if (error) {
      console.error("[cabo2026] activity_comments insert failed:", error);
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
    } else {
      setComments((prev) => prev.map((c) => (c.id === optimisticId ? data : c)));
    }
  };

  const addActivityFromSuggestion = useCallback(async (s) => {
    const nextSort = activities.length ? Math.max(...activities.map((a) => a.sort ?? 0)) + 1 : 0;
    const draft = { title: s.title || "", icon: s.icon || "✨", cost: s.cost || "", duration: s.duration || "", distance: s.distance || "", description: s.description || "", tag: s.tag || "Adventure", sort: nextSort, added_by: "Claude ✨" };
    if (!hasSupabase) {
      setActivities((prev) => [...prev, { ...draft, id: `local-${Date.now()}` }]);
    } else {
      emitSave("saving");
      const { data, error } = await supabase.from("activities").insert(draft).select().single();
      if (error) { console.error("[cabo2026] activity insert (AI) failed:", error); emitSave("error"); }
      else { setActivities((prev) => [...prev, data]); emitSave("saved"); }
    }
  }, [activities, hasSupabase]);

  const handleSuggest = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/.netlify/functions/suggest-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activities }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setSuggestions(json.suggestions || []);
      setShowSuggestModal(true);
    } catch (err) {
      console.error("[cabo2026] suggest-activities error:", err);
      alert("Couldn't reach the suggestion service. Check that ANTHROPIC_API_KEY is set in Netlify.");
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const sorted = useMemo(() => {
    const arr = [...activities];
    if (sortKey === "votes") arr.sort((a, b) => voteCount(b.id) - voteCount(a.id));
    else if (sortKey === "tag") arr.sort((a, b) => (a.tag || "").localeCompare(b.tag || ""));
    else if (sortKey === "cost") arr.sort((a, b) => parseCostNum(a.cost) - parseCostNum(b.cost));
    return arr;
  }, [activities, avotes, sortKey]);

  return (
    <>
      {showModal && (
        <VoterModal onConfirm={handleModalConfirm} onDismiss={() => { setShowModal(false); setPendingVote(null); }} />
      )}
      {showSuggestModal && suggestions.length > 0 && (
        <SuggestionsModal
          suggestions={suggestions}
          onAdd={addActivityFromSuggestion}
          onClose={() => { setShowSuggestModal(false); setSuggestions([]); }}
        />
      )}
      <section id="activities" style={{ background: COLORS.warmWhite, padding: "100px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <SectionHeader eyebrow="Experiences & Adventures" title="Experiences & Adventures" />

          <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
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
            <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 80 }} />)}
            </div>
          ) : (
            <div style={{ marginTop: 32, display: "grid", gap: 14 }}>
              {sorted.map((a) => {
                const open = openId === a.id;
                const tagColor = TAG_COLORS[a.tag] || COLORS.teal;
                const vc = voteCount(a.id);
                const mv = myVoted(a.id);
                const voters = avotes.filter((v) => v.activity_id === a.id);

                return (
                  <div key={a.id} style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.08)", boxShadow: open ? "0 16px 40px rgba(38,70,83,0.12)" : "0 6px 18px rgba(38,70,83,0.05)", overflow: "hidden", transition: "box-shadow 0.25s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "20px 22px" }}>
                      <span style={{ fontSize: "1.8rem", lineHeight: 1, flexShrink: 0 }}>
                        <EditField value={a.icon} onChange={(v) => updateOne(a.id, { icon: v })} placeholder="✨" ariaLabel="Icon" style={{ fontSize: "1.8rem" }} />
                      </span>
                      <button onClick={() => setOpenId(open ? null : a.id)} aria-expanded={open} style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                        <div style={{ fontFamily: FONTS.display, fontSize: "1.2rem", fontWeight: 700, color: COLORS.night, letterSpacing: "-0.01em", marginBottom: 4 }}>
                          <EditField value={a.title} onChange={(v) => updateOne(a.id, { title: v })} placeholder="Experience title" ariaLabel="Title" />
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", fontFamily: FONTS.sans, fontSize: "0.78rem", color: COLORS.muted }}>
                          <span style={{ fontFamily: FONTS.mono, color: COLORS.teal, fontWeight: 500 }}>
                            <EditField value={a.cost} onChange={(v) => updateOne(a.id, { cost: v })} placeholder="Cost" ariaLabel="Cost" />
                          </span>
                          <span aria-hidden>·</span>
                          <EditField value={a.duration} onChange={(v) => updateOne(a.id, { duration: v })} placeholder="Duration" ariaLabel="Duration" />
                          <span aria-hidden>·</span>
                          <span style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: "0.68rem", color: tagColor }}>
                            <EditField value={a.tag} onChange={(v) => updateOne(a.id, { tag: v })} placeholder="Tag" ariaLabel="Tag" />
                          </span>
                        </div>
                      </button>
                      {/* Vote button */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <button onClick={() => handleVoteClick(a.id)} aria-label={mv ? "Remove vote" : "Vote"} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 999, background: mv ? "rgba(231,111,81,0.12)" : "rgba(38,70,83,0.05)", transition: "all 0.15s ease" }}>
                          <Heart size={14} color={mv ? COLORS.terracotta : COLORS.muted} fill={mv ? COLORS.terracotta : "none"} />
                          <span style={{ fontFamily: FONTS.mono, fontSize: "0.75rem", color: mv ? COLORS.terracotta : COLORS.muted, fontWeight: 600 }}>{vc}</span>
                        </button>
                      </div>
                      <ChevronDown size={20} color={COLORS.muted} onClick={() => setOpenId(open ? null : a.id)} style={{ transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, cursor: "pointer" }} />
                    </div>

                    {open && (
                      <div className="fade-up" style={{ padding: "0 22px 22px 62px", color: COLORS.indigo, fontFamily: FONTS.sans, fontSize: "0.95rem", lineHeight: 1.6 }}>
                        <EditField value={a.description} onChange={(v) => updateOne(a.id, { description: v })} placeholder="Description…" ariaLabel="Description" multiline />
                        <div style={{ fontSize: "0.82rem", color: COLORS.muted, fontWeight: 600, marginTop: 10 }}>
                          📍 <EditField value={a.distance} onChange={(v) => updateOne(a.id, { distance: v })} placeholder="Distance" ariaLabel="Distance" />
                        </div>
                        {voters.length > 0 && (
                          <div style={{ marginTop: 12 }}>
                            <VoterPills voters={voters} />
                          </div>
                        )}
                        <CommentThread
                          comments={comments.filter((c) => c.activity_id === a.id)}
                          onAdd={(body) => addComment(a.id, body)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showForm ? (
            <div style={{ marginTop: 20, background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.1)", padding: "22px 24px" }}>
              <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "1rem", color: COLORS.night, margin: "0 0 14px" }}>Add an experience</p>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, marginBottom: 10 }}>
                <input type="text" placeholder="Icon" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} style={{ ...formInputStyle, textAlign: "center", fontSize: "1.4rem" }} />
                <input type="text" placeholder="Title *" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} style={formInputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))} style={formInputStyle}>
                  {TAGS.map((t) => <option key={t}>{t}</option>)}
                </select>
                <input type="text" placeholder="Cost (e.g. $50/pp or FREE)" value={form.cost} onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))} style={formInputStyle} />
                <input type="text" placeholder="Duration" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} style={formInputStyle} />
                <input type="text" placeholder="Distance / location" value={form.distance} onChange={(e) => setForm((f) => ({ ...f, distance: e.target.value }))} style={formInputStyle} />
              </div>
              <textarea placeholder="Description…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} style={{ ...formInputStyle, width: "100%", marginTop: 10, resize: "vertical", boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowForm(false); setForm(BLANK_FORM); }} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, padding: "8px 14px" }}>Cancel</button>
                <button onClick={addActivity} disabled={submitting || !form.title.trim()} style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: "0.82rem", padding: "8px 18px", borderRadius: 999, background: COLORS.teal, color: "#fff", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", border: `2px dashed ${COLORS.teal}`, borderRadius: 999, color: COLORS.teal, fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem", background: "transparent", transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Plus size={16} /> Add an Experience
              </button>
              <button
                onClick={handleSuggest}
                disabled={loadingSuggestions}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", border: `2px dashed ${COLORS.gold}`, borderRadius: 999, color: COLORS.indigo, fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem", background: "transparent", transition: "background 0.2s ease", opacity: loadingSuggestions ? 0.65 : 1 }}
                onMouseEnter={(e) => { if (!loadingSuggestions) e.currentTarget.style.background = "rgba(233,196,106,0.12)"; }}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Sparkles size={16} color={COLORS.gold} />
                {loadingSuggestions ? "Thinking…" : "Suggest ideas"}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

const formInputStyle = {
  fontFamily: FONTS.sans,
  fontSize: "0.88rem",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid rgba(38,70,83,0.15)",
  outline: "none",
  color: "#1A1F3A",
};
