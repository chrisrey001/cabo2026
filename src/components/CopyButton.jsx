import React, { useEffect, useRef, useState } from "react";
import { Copy, Check } from "lucide-react";
import { COLORS, FONTS } from "../theme";

export default function CopyButton({ value, label = "Copy", copiedLabel = "Copied" }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
      } catch {}
      document.body.removeChild(ta);
    }
    setCopied(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={onClick}
      aria-label={copied ? copiedLabel : `${label} ${value}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: FONTS.sans,
        fontSize: "0.72rem",
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        color: copied ? "#fff" : COLORS.teal,
        background: copied ? COLORS.teal : "rgba(42,157,143,0.12)",
        transition: "all 0.2s ease",
      }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? copiedLabel : label}
    </button>
  );
}
