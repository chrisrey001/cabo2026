import React, { useEffect, useState } from "react";
import { COLORS, FONTS } from "../theme";

const CACHE_KEY = "cabo26:fx";
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const API_URL = "https://api.frankfurter.dev/v1/latest?base=USD&symbols=MXN";

export default function CurrencyConverter() {
  const [rate, setRate] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [usd, setUsd] = useState("100");
  const [mxn, setMxn] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts, rate: r, date } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setRate(r);
            setMxn((100 * r).toFixed(0));
            setUpdatedAt(date);
            return;
          }
        }
      } catch (_) {}

      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const r = data.rates.MXN;
        const date = data.date;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), rate: r, date }));
        } catch (_) {}
        setRate(r);
        setMxn((100 * r).toFixed(0));
        setUpdatedAt(date);
      } catch (_) {
        setError(true);
      }
    })();
  }, []);

  const handleUsd = (v) => {
    setUsd(v);
    if (rate && v !== "" && !isNaN(v)) {
      setMxn((parseFloat(v) * rate).toFixed(0));
    } else {
      setMxn("");
    }
  };

  const handleMxn = (v) => {
    setMxn(v);
    if (rate && v !== "" && !isNaN(v)) {
      setUsd((parseFloat(v) / rate).toFixed(2));
    } else {
      setUsd("");
    }
  };

  const inputStyle = {
    fontFamily: FONTS.mono,
    fontSize: "1.4rem",
    fontWeight: 500,
    color: COLORS.night,
    border: "none",
    borderBottom: `2px solid ${COLORS.teal}`,
    background: "transparent",
    outline: "none",
    width: "100%",
    padding: "4px 0",
  };

  const labelStyle = {
    fontFamily: FONTS.sans,
    fontSize: "0.7rem",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.18em",
    color: COLORS.muted,
    marginBottom: 4,
    display: "block",
  };

  if (error) {
    return (
      <p style={{ fontFamily: FONTS.sans, fontSize: "0.88rem", color: COLORS.muted }}>
        Rate unavailable — check{" "}
        <span style={{ color: COLORS.teal }}>xe.com</span> for current USD ↔ MXN rates.
      </p>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>USD $</span>
          <input
            type="number"
            min="0"
            value={usd}
            onChange={(e) => handleUsd(e.target.value)}
            style={inputStyle}
            aria-label="US Dollars"
          />
        </div>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: "1.1rem",
            color: COLORS.gold,
            paddingBottom: 6,
            flexShrink: 0,
          }}
        >
          ⇄
        </div>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>MXN $</span>
          <input
            type="number"
            min="0"
            value={mxn}
            onChange={(e) => handleMxn(e.target.value)}
            style={inputStyle}
            aria-label="Mexican Pesos"
          />
        </div>
      </div>
      {rate && (
        <p
          style={{
            fontFamily: FONTS.mono,
            fontSize: "0.68rem",
            color: "rgba(38,70,83,0.45)",
            marginTop: 10,
            marginBottom: 0,
          }}
        >
          1 USD = {rate.toFixed(2)} MXN{updatedAt ? ` · rate as of ${updatedAt}` : ""}
        </p>
      )}
    </div>
  );
}
