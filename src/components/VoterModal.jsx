import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { COLORS, FONTS } from "../theme";

export default function VoterModal({ onConfirm, onDismiss }) {
  const [name, setName] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") onDismiss(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const submit = () => {
    const trimmed = name.trim();
    onConfirm(trimmed || null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voter-modal-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        background: "rgba(26,31,58,0.55)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          padding: "32px 28px 28px",
          maxWidth: 360,
          width: "100%",
          boxShadow: "0 24px 60px rgba(26,31,58,0.18)",
          position: "relative",
        }}
      >
        <button
          onClick={onDismiss}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            padding: 6,
            borderRadius: 8,
            color: COLORS.muted,
          }}
        >
          <X size={16} />
        </button>

        <div style={{ fontSize: "2rem", marginBottom: 12, lineHeight: 1 }}>🗳️</div>

        <h2
          id="voter-modal-title"
          style={{
            fontFamily: FONTS.display,
            fontSize: "1.4rem",
            fontWeight: 800,
            color: COLORS.night,
            margin: "0 0 6px",
            letterSpacing: "-0.01em",
          }}
        >
          What should we call you?
        </h2>
        <p
          style={{
            fontFamily: FONTS.sans,
            fontSize: "0.85rem",
            color: COLORS.muted,
            margin: "0 0 20px",
            lineHeight: 1.5,
          }}
        >
          So we know who voted for what. Saved in your browser only.
        </p>

        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="e.g. Chris & Kate"
          maxLength={30}
          style={{
            width: "100%",
            fontFamily: FONTS.sans,
            fontSize: "1rem",
            padding: "10px 14px",
            borderRadius: 10,
            border: `2px solid ${COLORS.teal}`,
            outline: "none",
            color: COLORS.night,
            boxSizing: "border-box",
            marginBottom: 14,
          }}
        />

        <button
          onClick={submit}
          style={{
            width: "100%",
            fontFamily: FONTS.sans,
            fontWeight: 700,
            fontSize: "0.9rem",
            padding: "12px",
            borderRadius: 10,
            background: COLORS.teal,
            color: "#fff",
            marginBottom: 10,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Save &amp; Vote
        </button>

        <button
          onClick={() => onConfirm(null)}
          style={{
            width: "100%",
            fontFamily: FONTS.sans,
            fontSize: "0.82rem",
            color: COLORS.muted,
            padding: "6px",
            textDecoration: "underline",
            textUnderlineOffset: 2,
          }}
        >
          Skip — vote anonymously
        </button>
      </div>
    </div>
  );
}
