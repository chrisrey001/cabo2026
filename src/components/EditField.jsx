import React, { useEffect, useRef, useState } from "react";
import { COLORS } from "../theme";

export default function EditField({
  value,
  onChange,
  placeholder = "",
  multiline = false,
  style = {},
  inputStyle = {},
  ariaLabel,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const ref = useRef(null);

  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      if (ref.current.select) ref.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next !== (value ?? "").trim()) onChange?.(next);
  };

  const cancel = () => {
    setDraft(value ?? "");
    setEditing(false);
  };

  const baseStyle = {
    display: "inline-block",
    minWidth: 32,
    outline: "none",
    borderRadius: 6,
    padding: "2px 6px",
    margin: "-2px -6px",
    transition: "background 0.15s ease",
    cursor: "text",
    ...style,
  };

  if (editing) {
    const Tag = multiline ? "textarea" : "input";
    return (
      <Tag
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !multiline) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        rows={multiline ? 2 : undefined}
        style={{
          ...baseStyle,
          background: "rgba(42,157,143,0.08)",
          border: `1px solid ${COLORS.teal}`,
          font: "inherit",
          color: "inherit",
          width: multiline ? "100%" : `${Math.max((draft || placeholder || "").length, 4) + 1}ch`,
          resize: multiline ? "vertical" : "none",
          ...inputStyle,
        }}
      />
    );
  }

  const display = value && value.length ? value : placeholder;
  const isPlaceholder = !value || !value.length;

  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={ariaLabel || placeholder}
      onClick={() => setEditing(true)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setEditing(true);
        }
      }}
      style={{
        ...baseStyle,
        color: isPlaceholder ? COLORS.muted : undefined,
        fontStyle: isPlaceholder ? "italic" : style.fontStyle,
        borderBottom: `1px dashed ${isPlaceholder ? "rgba(38,70,83,0.3)" : "transparent"}`,
        whiteSpace: multiline ? "pre-wrap" : undefined,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(233,196,106,0.18)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {display}
    </span>
  );
}
