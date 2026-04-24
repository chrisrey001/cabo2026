import React, { useEffect, useState } from "react";
import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { COLORS, FONTS } from "../theme";
import { SectionHeader } from "./Cast";
import { supabase, hasSupabase } from "../supabase";
import { useVoterIdentity } from "../hooks/useVoterIdentity";
import VoterModal from "../components/VoterModal";
import VoterPills from "../components/VoterPills";

const SEED_POLL = {
  question: "Thursday night plan — what are we doing?",
  options: [
    { id: "a", label: "Flora Farms dinner 🌿" },
    { id: "b", label: "San José Art Walk 🎨" },
    { id: "c", label: "Both — dinner then Art Walk" },
  ],
  closed: false,
};

// ─── local-only fallback when Supabase isn't configured ──────────────────────
const LOCAL_POLLS = [
  { id: "local-1", ...SEED_POLL, created_at: new Date().toISOString() },
];

export default function Polls() {
  const { voterId, voterName, setVoterName, hasName } = useVoterIdentity();
  const [polls, setPolls] = useState([]);
  const [votes, setVotes] = useState([]);   // all votes rows
  const [loading, setLoading] = useState(true);
  const [pendingVote, setPendingVote] = useState(null); // {pollId, optionId}
  const [showModal, setShowModal] = useState(false);

  // add-poll form state
  const [showForm, setShowForm] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newOpts, setNewOpts] = useState(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasSupabase) {
      setPolls(LOCAL_POLLS);
      setLoading(false);
      return;
    }
    (async () => {
      const [{ data: pData, error: pErr }, { data: vData, error: vErr }] = await Promise.all([
        supabase.from("polls").select("*").order("created_at", { ascending: false }),
        supabase.from("votes").select("*"),
      ]);
      if (pErr) console.error("[cabo2026] polls load failed:", pErr);
      if (vErr) console.error("[cabo2026] votes load failed:", vErr);

      let pollRows = pData || [];
      if (!pollRows.length) {
        const { data: seeded } = await supabase
          .from("polls")
          .insert({ question: SEED_POLL.question, options: SEED_POLL.options })
          .select()
          .single();
        if (seeded) pollRows = [seeded];
      }
      setPolls(pollRows);
      setVotes(vData || []);
      setLoading(false);
    })();
  }, []);

  const castVote = async (pollId, optionId, name) => {
    const row = { poll_id: pollId, option_id: optionId, voter_id: voterId, voter_name: name || null };
    // optimistic
    setVotes((prev) => {
      const without = prev.filter((v) => !(v.poll_id === pollId && v.voter_id === voterId));
      return [...without, { ...row, id: `local-${Date.now()}` }];
    });
    if (!hasSupabase) return;
    const { error } = await supabase.from("votes").upsert(row, { onConflict: "poll_id,voter_id" });
    if (error) {
      console.error("[cabo2026] vote failed:", error);
      // rollback
      setVotes((prev) => prev.filter((v) => v.id !== `local-${Date.now()}`));
    }
  };

  const handleVoteClick = (pollId, optionId) => {
    if (!hasName) {
      setPendingVote({ pollId, optionId });
      setShowModal(true);
    } else {
      castVote(pollId, optionId, voterName);
    }
  };

  const handleModalConfirm = (name) => {
    setShowModal(false);
    if (name) setVoterName(name);
    if (pendingVote) {
      castVote(pendingVote.pollId, pendingVote.optionId, name || voterName || null);
      setPendingVote(null);
    }
  };

  const addOptField = () => { if (newOpts.length < 4) setNewOpts([...newOpts, ""]); };
  const removeOptField = (i) => { setNewOpts(newOpts.filter((_, j) => j !== i)); };
  const updateOpt = (i, v) => setNewOpts(newOpts.map((o, j) => (j === i ? v : o)));

  const submitPoll = async () => {
    const q = newQ.trim();
    const opts = newOpts.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    setSubmitting(true);
    const options = opts.map((label) => ({ id: crypto.randomUUID(), label }));
    const draft = { id: `local-${Date.now()}`, question: q, options, closed: false, created_at: new Date().toISOString() };

    if (!hasSupabase) {
      setPolls((prev) => [draft, ...prev]);
    } else {
      const { data, error } = await supabase.from("polls").insert({ question: q, options }).select().single();
      if (error) { console.error("[cabo2026] poll insert failed:", error); }
      else setPolls((prev) => [data, ...prev]);
    }
    setNewQ(""); setNewOpts(["", ""]); setShowForm(false); setSubmitting(false);
  };

  const toggleClose = async (poll) => {
    const next = !poll.closed;
    setPolls((prev) => prev.map((p) => (p.id === poll.id ? { ...p, closed: next } : p)));
    if (!hasSupabase || String(poll.id).startsWith("local-")) return;
    await supabase.from("polls").update({ closed: next }).eq("id", poll.id);
  };

  return (
    <>
      {showModal && (
        <VoterModal onConfirm={handleModalConfirm} onDismiss={() => { setShowModal(false); setPendingVote(null); }} />
      )}

      <section id="polls" style={{ background: COLORS.sand, padding: "100px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <SectionHeader eyebrow="Group Decisions" title="Polls" />

          {loading ? (
            <div style={{ marginTop: 48, display: "grid", gap: 16 }}>
              {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 140 }} />)}
            </div>
          ) : (
            <div style={{ marginTop: 48, display: "grid", gap: 16 }}>
              {polls.map((poll) => (
                <PollCard
                  key={poll.id}
                  poll={poll}
                  votes={votes.filter((v) => v.poll_id === poll.id)}
                  voterId={voterId}
                  onVote={(optionId) => handleVoteClick(poll.id, optionId)}
                  onToggleClose={() => toggleClose(poll)}
                />
              ))}
            </div>
          )}

          {/* Add poll form */}
          {showForm ? (
            <div
              style={{
                marginTop: 20,
                background: "#fff",
                borderRadius: 16,
                border: "1px solid rgba(38,70,83,0.1)",
                padding: "22px 24px",
              }}
            >
              <p style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: "1rem", color: COLORS.night, margin: "0 0 14px" }}>
                New poll
              </p>
              <input
                type="text"
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder="What's the question?"
                style={inputStyle}
              />
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {newOpts.map((o, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      value={o}
                      onChange={(e) => updateOpt(i, e.target.value)}
                      placeholder={i < 2 ? `Option ${i + 1} (required)` : `Option ${i + 1} (optional)`}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    {i >= 2 && (
                      <button onClick={() => removeOptField(i)} style={{ color: COLORS.muted, padding: 4 }}>
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center", flexWrap: "wrap" }}>
                {newOpts.length < 4 && (
                  <button onClick={addOptField} style={{ fontFamily: FONTS.sans, fontSize: "0.8rem", color: COLORS.teal, fontWeight: 600 }}>
                    + Add option
                  </button>
                )}
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button onClick={() => setShowForm(false)} style={{ fontFamily: FONTS.sans, fontSize: "0.82rem", color: COLORS.muted, padding: "8px 14px" }}>
                    Cancel
                  </button>
                  <button
                    onClick={submitPoll}
                    disabled={submitting || !newQ.trim() || newOpts.filter(Boolean).length < 2}
                    style={{
                      fontFamily: FONTS.sans, fontWeight: 700, fontSize: "0.82rem",
                      padding: "8px 18px", borderRadius: 999,
                      background: COLORS.teal, color: "#fff",
                      opacity: submitting ? 0.6 : 1,
                    }}
                  >
                    {submitting ? "Adding…" : "Add Poll"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 22px", border: `2px dashed ${COLORS.teal}`,
                  borderRadius: 999, color: COLORS.teal,
                  fontFamily: FONTS.sans, fontWeight: 600, fontSize: "0.9rem",
                  background: "transparent", transition: "background 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(42,157,143,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <Plus size={16} /> Add a Poll
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

const inputStyle = {
  width: "100%",
  fontFamily: FONTS.sans,
  fontSize: "0.92rem",
  padding: "9px 12px",
  borderRadius: 8,
  border: "1.5px solid rgba(38,70,83,0.15)",
  outline: "none",
  color: "#1A1F3A",
  boxSizing: "border-box",
};

function PollCard({ poll, votes, voterId, onVote, onToggleClose }) {
  const [showVoters, setShowVoters] = useState(false);
  const myVote = votes.find((v) => v.voter_id === voterId);
  const total = votes.length;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(38,70,83,0.08)",
        boxShadow: "0 8px 24px rgba(38,70,83,0.07)",
        padding: "22px 24px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 18 }}>
        <h3 style={{ fontFamily: FONTS.display, fontSize: "1.15rem", fontWeight: 700, color: COLORS.night, margin: 0, letterSpacing: "-0.01em", lineHeight: 1.3 }}>
          {poll.question}
        </h3>
        <button
          onClick={onToggleClose}
          style={{ fontFamily: FONTS.mono, fontSize: "0.65rem", color: poll.closed ? COLORS.terracotta : COLORS.muted, whiteSpace: "nowrap", flexShrink: 0, padding: "3px 8px", borderRadius: 999, background: poll.closed ? "rgba(231,111,81,0.1)" : "rgba(38,70,83,0.06)" }}
        >
          {poll.closed ? "Closed" : "Close poll"}
        </button>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {poll.options.map((opt) => {
          const optVotes = votes.filter((v) => v.option_id === opt.id);
          const pct = total ? Math.round((optVotes.length / total) * 100) : 0;
          const mine = myVote?.option_id === opt.id;
          return (
            <div key={opt.id}>
              <button
                onClick={() => !poll.closed && onVote(opt.id)}
                disabled={poll.closed}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: mine ? `2px solid ${COLORS.teal}` : "2px solid rgba(38,70,83,0.1)",
                  background: mine ? "rgba(42,157,143,0.08)" : "#fff",
                  fontFamily: FONTS.sans,
                  fontSize: "0.9rem",
                  fontWeight: mine ? 700 : 500,
                  color: mine ? COLORS.teal : COLORS.night,
                  cursor: poll.closed ? "default" : "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>{opt.label}</span>
                <span style={{ fontFamily: FONTS.mono, fontSize: "0.82rem", color: mine ? COLORS.teal : COLORS.muted, flexShrink: 0 }}>
                  {optVotes.length} {optVotes.length === 1 ? "vote" : "votes"}
                </span>
              </button>
              {/* progress bar */}
              <div style={{ height: 4, borderRadius: 2, background: "rgba(38,70,83,0.08)", margin: "4px 0 2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: mine ? COLORS.teal : COLORS.gold, borderRadius: 2, transition: "width 0.4s ease" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Who voted footer */}
      {total > 0 && (
        <div style={{ marginTop: 14, borderTop: "1px solid rgba(38,70,83,0.06)", paddingTop: 12 }}>
          <button
            onClick={() => setShowVoters((v) => !v)}
            style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, fontWeight: 600 }}
          >
            {showVoters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {total} {total === 1 ? "vote" : "votes"} cast
          </button>
          {showVoters && (
            <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
              {poll.options.map((opt) => {
                const optVoters = votes.filter((v) => v.option_id === opt.id);
                if (!optVoters.length) return null;
                return (
                  <div key={opt.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FONTS.sans, fontSize: "0.75rem", color: COLORS.muted, minWidth: 100 }}>{opt.label}:</span>
                    <VoterPills voters={optVoters} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
