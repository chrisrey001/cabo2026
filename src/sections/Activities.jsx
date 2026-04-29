import React, { useEffect, useState, useMemo } from "react";
import { ChevronDown, ExternalLink, Heart, Plus, Trash2 } from "lucide-react";
import { COLORS, FONTS, SPACING } from "../theme";
import { SectionHeader } from "./Cast";
import EditField from "../components/EditField";
import VoterModal from "../components/VoterModal";
import VoterPills from "../components/VoterPills";
import CommentThread from "../components/CommentThread";
import { supabase, hasSupabase } from "../supabase";
import { emitSave } from "../components/SaveBadge";
import { useVoterIdentity } from "../hooks/useVoterIdentity";
import { useTouchDevice } from "../hooks/useBreakpoint";
import { parseCostNum } from "../utils/cost";

const DEFAULT_ACTIVITIES = [
  { title: "Flora Farms Dinner", icon: "🌿", cost: "$80–120/pp", duration: "Evening", distance: "~20 min drive", description: "Michelin-recommended farm-to-table on a 25-acre organic farm in San José del Cabo. Dine under string lights with produce pulled from the ground that morning. One of the hardest reservations in Los Cabos — book 4+ weeks ahead.", tag: "Culinary", sort: 0, link: "https://www.sevenrooms.com/reservations/florafarms" },
  { title: "Cabo Arch Boat Tour", icon: "⛵", cost: "$25–40/pp", duration: "1–2 hrs", distance: "30 min to Cabo Marina", description: "Cruise to Land's End to see El Arco where the Pacific meets the Sea of Cortez. Stop at Lover's Beach, spot sea lions at Pelican Rock, and catch the postcard shot. Morning light is best. Mandatory $5 port fee paid at marina.", tag: "Sightseeing", sort: 1, link: "https://www.viator.com/Los-Cabos-attractions/Arch-of-Cabo-San-Lucas/d627-a979" },
  { title: "San José Art Walk", icon: "🎨", cost: "FREE", duration: "5–9 PM", distance: "10 min to downtown", description: "Thursday evenings through June, 12 certified galleries open their doors in the colonial Art District. Street musicians, artists, blown glass, and textiles — traffic closed, wine flowing. June 18 is the final walk of the season.", tag: "Culture", sort: 2, link: "https://www.artcabo.com/san-jose-del-cabo-art-walk.html" },
  { title: "Deep-Sea Fishing Charter", icon: "🎣", cost: "~$230/pp (8-hr boat)", duration: "Full day", distance: "10 min to Puerto Los Cabos", description: "June is peak season for marlin and dorado in the nutrient-rich waters off Baja. Picante Fleet runs a 100% company-owned fleet from Puerto Los Cabos marina — 30+ years of reputation. Split the full-day charter across the group.", tag: "Adventure", sort: 3, link: "https://picantesportfishing.com/" },
  { title: "ATV + Camel + Tequila", icon: "🐪", cost: "$175+/pp", duration: "Half day", distance: "~30 min drive", description: "Rip through the Baja desert on automatic ATVs, ride a camel along Migriño Beach, then cap it with mezcal and tequila tasting plus a Mexican buffet. Cabo Adventures runs this combo — park entry ($25) and ATV insurance ($35) paid on-site.", tag: "Adventure", sort: 4, link: "https://www.cabo-adventures.com/en/tour/camel-atv-ecofarm" },
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

const BLANK_FORM = { icon: "✨", title: "", tag: "Adventure", cost: "", duration: "", distance: "", description: "", link: "" };

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
  const isTouch = useTouchDevice();
  const [confirmingDelete, setConfirmingDelete] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

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

  const deleteActivity = async (id) => {
    const prev = activities;
    setActivities((a) => a.filter((x) => x.id !== id));
    if (openId === id) setOpenId(null);
    setConfirmingDelete(null);
    if (!hasSupabase || String(id).startsWith("local-")) return;
    const { error } = await supabase.from("activities").delete().match({ id });
    if (error) {
      console.error("[cabo2026] activity delete failed:", error);
      setActivities(prev);
    }
  };

  const addComment = async (activityId, body) => {
    const author = voterName || null;
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
      <section id="activities" style={{ background: COLORS.warmWhite, padding: SPACING.section }}>
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

                const cc = comments.filter((c) => c.activity_id === a.id).length;

                return (
                  <div
                    key={a.id}
                    style={{ background: "#fff", borderRadius: 16, border: "1px solid rgba(38,70,83,0.08)", boxShadow: open ? "0 16px 40px rgba(38,70,83,0.12)" : "0 6px 18px rgba(38,70,83,0.05)", overflow: "hidden", transition: "box-shadow 0.25s ease" }}
                    onMouseEnter={() => setHoveredCard(a.id)}
                    onMouseLeave={() => { setHoveredCard(null); if (confirmingDelete === a.id) setConfirmingDelete(null); }}
                  >
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
                          {!open && cc > 0 && (
                            <>
                              <span aria-hidden>·</span>
                              <span style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", color: COLORS.muted }}>💬 {cc}</span>
                            </>
                          )}
                        </div>
                      </button>
                      {/* Vote button */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <button onClick={() => handleVoteClick(a.id)} aria-label={mv ? "Remove vote" : "Vote"} style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 999, background: mv ? "rgba(231,111,81,0.12)" : "rgba(38,70,83,0.05)", transition: "all 0.15s ease" }}>
                          <Heart size={14} color={mv ? COLORS.terracotta : COLORS.muted} fill={mv ? COLORS.terracotta : "none"} />
                          <span style={{ fontFamily: FONTS.mono, fontSize: "0.75rem", color: mv ? COLORS.terracotta : COLORS.muted, fontWeight: 600 }}>{vc}</span>
                        </button>
                      </div>
                      {/* Delete control */}
                      {confirmingDelete === a.id ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                          <span style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, whiteSpace: "nowrap" }}>Delete?</span>
                          <button
                            onClick={() => deleteActivity(a.id)}
                            style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", fontWeight: 700, color: "#fff", background: COLORS.terracotta, padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap" }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmingDelete(null)}
                            style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, padding: "4px 8px" }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmingDelete(a.id); }}
                          aria-label="Delete activity"
                          style={{ flexShrink: 0, opacity: (isTouch || hoveredCard === a.id) ? 1 : 0, transition: "opacity 0.15s ease", padding: 8, borderRadius: 6, lineHeight: 0, minWidth: 32, minHeight: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
                          onFocus={(e) => (e.currentTarget.style.opacity = "1")}
                          onBlur={(e) => (e.currentTarget.style.opacity = isTouch ? "1" : "0")}
                        >
                          <Trash2 size={15} color={COLORS.muted} />
                        </button>
                      )}
                      <ChevronDown size={20} color={COLORS.muted} onClick={() => setOpenId(open ? null : a.id)} style={{ transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, cursor: "pointer" }} />
                    </div>

                    {open && (
                      <div className="fade-up" style={{ padding: "0 22px 22px 62px", color: COLORS.indigo, fontFamily: FONTS.sans, fontSize: "0.95rem", lineHeight: 1.6 }}>
                        <EditField value={a.description} onChange={(v) => updateOne(a.id, { description: v })} placeholder="Description…" ariaLabel="Description" multiline />
                        <div style={{ fontSize: "0.82rem", color: COLORS.muted, fontWeight: 600, marginTop: 10 }}>
                          📍 <EditField value={a.distance} onChange={(v) => updateOne(a.id, { distance: v })} placeholder="Distance" ariaLabel="Distance" />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
                          <span style={{ fontSize: "0.82rem", color: COLORS.muted, fontWeight: 600, flexShrink: 0 }}>🔗</span>
                          <EditField value={a.link || ""} onChange={(v) => updateOne(a.id, { link: v })} placeholder="Add booking URL…" ariaLabel="Booking link" />
                          {a.link && (
                            <a
                              href={a.link}
                              target="_blank"
                              rel="noreferrer"
                              style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 5, fontFamily: FONTS.sans, fontSize: "0.78rem", fontWeight: 700, color: "#fff", background: COLORS.teal, padding: "5px 12px", borderRadius: 999, whiteSpace: "nowrap" }}
                            >
                              <ExternalLink size={11} /> Book
                            </a>
                          )}
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
              <input type="url" placeholder="Booking URL (optional)" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} style={{ ...formInputStyle, width: "100%", marginTop: 10, boxSizing: "border-box" }} />
              <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
                <button onClick={() => { setShowForm(false); setForm(BLANK_FORM); }} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, padding: "8px 14px" }}>Cancel</button>
                <button onClick={addActivity} disabled={submitting || !form.title.trim()} style={{ fontFamily: FONTS.sans, fontWeight: 700, fontSize: "0.82rem", padding: "8px 18px", borderRadius: 999, background: COLORS.teal, color: "#fff", opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? "Adding…" : "Add"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <button onClick={() => setShowForm(true)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", border: `2px dashed ${COLORS.teal}`, borderRadius: 999, color: COLORS.teal, fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem", background: "transparent", transition: "background 0.2s ease" }} onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <Plus size={16} /> Add Activity
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
