import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { COLORS, FONTS } from "../theme";

function relativeTime(ts) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function authorHue(name) {
  let h = 0;
  for (let i = 0; i < (name || "?").length; i++) h = ((name.charCodeAt(i) + h) * 31) % 360;
  return h;
}

export default function CommentThread({ comments, onAdd }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const submit = async () => {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    await onAdd(text);
    setBody("");
    setSending(false);
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  return (
    <div style={{ marginTop: 20, borderTop: "1px solid rgba(38,70,83,0.07)", paddingTop: 16 }}>
      {comments.length > 0 && (
        <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
          {comments.map((c) => {
            const name = c.author || "Anonymous";
            const hue = authorHue(name);
            return (
              <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div
                  aria-hidden
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                    background: `hsl(${hue},55%,62%)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: FONTS.sans, fontSize: "0.7rem", fontWeight: 700, color: "#fff",
                  }}
                >
                  {name[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: FONTS.sans, fontSize: "0.78rem", fontWeight: 700, color: COLORS.night }}>
                      {name}
                    </span>
                    <span style={{ fontFamily: FONTS.sans, fontSize: "0.72rem", color: COLORS.muted }}>
                      {relativeTime(c.created_at)}
                    </span>
                  </div>
                  <p style={{ fontFamily: FONTS.sans, fontSize: "0.86rem", color: COLORS.indigo, margin: "2px 0 0", lineHeight: 1.5 }}>
                    {c.body}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onKey}
          style={{
            flex: 1,
            fontFamily: FONTS.sans,
            fontSize: "0.84rem",
            padding: "8px 12px",
            borderRadius: 999,
            border: "1.5px solid rgba(38,70,83,0.14)",
            outline: "none",
            color: COLORS.night,
            background: "rgba(38,70,83,0.03)",
          }}
        />
        <button
          onClick={submit}
          disabled={!body.trim() || sending}
          aria-label="Send comment"
          style={{
            width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
            background: body.trim() ? COLORS.teal : "rgba(38,70,83,0.08)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.15s ease",
          }}
        >
          <Send size={14} color={body.trim() ? "#fff" : COLORS.muted} />
        </button>
      </div>
    </div>
  );
}
