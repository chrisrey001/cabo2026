import React, { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { COLORS, FONTS } from "../theme";
import { useMobile } from "../hooks/useBreakpoint";

const ENDPOINT = "/.netlify/functions/cabo-bot";

const GREETING = {
  role: "assistant",
  content:
    "¡Hola! I'm Cabo Bot — your local guide for the trip. Ask me about activities, restaurants, beach safety, getting around, or whatever's on your mind. 🌴",
};

export default function CaboBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMobile = useMobile();
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  useEffect(() => {
    if (open && !isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, isMobile]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const apiMessages = next.filter((m) => m !== GREETING).map(({ role, content }) => ({ role, content }));
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.message) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setMessages((m) => [...m, { role: "assistant", content: data.message }]);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const buttonBottom = isMobile
    ? "calc(56px + env(safe-area-inset-bottom) + 16px)"
    : "24px";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Ask Cabo Bot"
        style={{
          position: "fixed",
          bottom: buttonBottom,
          right: 20,
          zIndex: 250,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.terracotta} 100%)`,
          color: COLORS.night,
          boxShadow: "0 10px 28px rgba(231,111,81,0.35), 0 4px 10px rgba(26,31,58,0.18)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.6rem",
          transition: "transform 0.18s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span aria-hidden="true">🌴</span>
      </button>
    );
  }

  const panelStyle = isMobile
    ? {
        position: "fixed",
        inset: 0,
        zIndex: 400,
        background: COLORS.warmWhite,
        display: "flex",
        flexDirection: "column",
      }
    : {
        position: "fixed",
        bottom: 24,
        right: 20,
        zIndex: 400,
        width: 380,
        height: 560,
        maxHeight: "calc(100vh - 100px)",
        borderRadius: 18,
        background: "rgba(255,252,247,0.97)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(38,70,83,0.12)",
        boxShadow: "0 24px 60px rgba(26,31,58,0.28), 0 8px 20px rgba(26,31,58,0.14)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      };

  return (
    <div style={panelStyle} role="dialog" aria-label="Cabo Bot chat">
      <header
        style={{
          padding: "14px 16px",
          background: `linear-gradient(135deg, ${COLORS.indigo} 0%, ${COLORS.teal} 100%)`,
          color: COLORS.foam,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          paddingTop: isMobile ? "calc(14px + env(safe-area-inset-top))" : 14,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: FONTS.display,
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span aria-hidden="true">🌴</span> Cabo Bot
          </div>
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.72rem",
              opacity: 0.85,
              marginTop: 2,
            }}
          >
            Your local Baja expert
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          style={{
            color: COLORS.foam,
            padding: 6,
            borderRadius: 8,
            display: "flex",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <X size={20} />
        </button>
      </header>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role} content={m.content} />
        ))}
        {loading && <TypingBubble />}
        {error && (
          <div
            style={{
              fontFamily: FONTS.sans,
              fontSize: "0.78rem",
              color: COLORS.terracotta,
              background: "rgba(231,111,81,0.08)",
              padding: "8px 12px",
              borderRadius: 10,
              alignSelf: "flex-start",
              maxWidth: "85%",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          borderTop: "1px solid rgba(38,70,83,0.1)",
          padding: "10px 12px",
          paddingBottom: isMobile ? "calc(10px + env(safe-area-inset-bottom))" : 10,
          background: "rgba(245,239,230,0.6)",
          display: "flex",
          gap: 8,
          alignItems: "flex-end",
        }}
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about a beach, a taco joint, anything…"
          rows={1}
          disabled={loading}
          style={{
            flex: 1,
            resize: "none",
            border: "1px solid rgba(38,70,83,0.18)",
            borderRadius: 12,
            padding: "10px 12px",
            fontFamily: FONTS.sans,
            fontSize: "0.92rem",
            color: COLORS.night,
            background: "#fff",
            outline: "none",
            maxHeight: 120,
            lineHeight: 1.4,
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = COLORS.teal)}
          onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(38,70,83,0.18)")}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          aria-label="Send message"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: input.trim() && !loading ? COLORS.teal : "rgba(38,70,83,0.18)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s ease",
            flexShrink: 0,
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

const MD_COMPONENTS = {
  p: ({ children }) => <p style={{ margin: "0 0 8px" }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: "4px 0 8px", paddingLeft: 20 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: "4px 0 8px", paddingLeft: 20 }}>{children}</ol>,
  li: ({ children }) => <li style={{ margin: "2px 0" }}>{children}</li>,
  strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: COLORS.teal, textDecoration: "underline" }}>
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code style={{ fontFamily: FONTS.mono, fontSize: "0.85em", background: "rgba(38,70,83,0.08)", padding: "1px 5px", borderRadius: 4 }}>
      {children}
    </code>
  ),
};

function Bubble({ role, content }) {
  const isUser = role === "user";
  const baseStyle = {
    alignSelf: isUser ? "flex-end" : "flex-start",
    maxWidth: "85%",
    background: isUser ? COLORS.teal : COLORS.sand,
    color: isUser ? COLORS.foam : COLORS.night,
    padding: "9px 13px",
    borderRadius: 14,
    borderBottomRightRadius: isUser ? 4 : 14,
    borderBottomLeftRadius: isUser ? 14 : 4,
    fontFamily: FONTS.sans,
    fontSize: "0.92rem",
    lineHeight: 1.45,
    wordBreak: "break-word",
  };
  if (isUser) {
    return <div style={{ ...baseStyle, whiteSpace: "pre-wrap" }}>{content}</div>;
  }
  return (
    <div style={baseStyle} className="cabo-bot-bubble">
      <ReactMarkdown components={MD_COMPONENTS}>{content}</ReactMarkdown>
    </div>
  );
}

function TypingBubble() {
  return (
    <div
      style={{
        alignSelf: "flex-start",
        background: COLORS.sand,
        padding: "11px 14px",
        borderRadius: 14,
        borderBottomLeftRadius: 4,
        display: "flex",
        gap: 4,
      }}
      aria-label="Cabo Bot is typing"
    >
      <Dot delay={0} />
      <Dot delay={0.18} />
      <Dot delay={0.36} />
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: COLORS.indigo,
        opacity: 0.55,
        animation: `pulse 1.2s ease-in-out ${delay}s infinite`,
      }}
    />
  );
}
