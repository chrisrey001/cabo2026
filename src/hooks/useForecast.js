import { useState, useEffect } from "react";
import { codeToEmoji } from "../utils/weatherCode";

const TRIP_DAYS = [
  { day: "Sun", date: "14" },
  { day: "Mon", date: "15" },
  { day: "Tue", date: "16" },
  { day: "Wed", date: "17" },
  { day: "Thu", date: "18" },
  { day: "Fri", date: "19" },
  { day: "Sat", date: "20" },
];

const FALLBACK = [
  { day: "Sun", date: "14", emoji: "✈️", hi: 88, lo: 73, sunrise: null, sunset: null },
  { day: "Mon", date: "15", emoji: "☀️", hi: 89, lo: 74, sunrise: null, sunset: null },
  { day: "Tue", date: "16", emoji: "☀️", hi: 90, lo: 74, sunrise: null, sunset: null },
  { day: "Wed", date: "17", emoji: "☀️", hi: 90, lo: 75, sunrise: null, sunset: null },
  { day: "Thu", date: "18", emoji: "☀️", hi: 89, lo: 75, sunrise: null, sunset: null },
  { day: "Fri", date: "19", emoji: "☀️", hi: 88, lo: 74, sunrise: null, sunset: null },
  { day: "Sat", date: "20", emoji: "✈️", hi: 88, lo: 74, sunrise: null, sunset: null },
];

const CACHE_KEY = "cabo26:forecast";
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=23.008&longitude=-109.717" +
  "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset" +
  "&timezone=America%2FMazatlan" +
  "&temperature_unit=fahrenheit" +
  "&start_date=2026-06-14&end_date=2026-06-20";

function parseDays(data) {
  const d = data.daily;
  if (!d || !d.time || d.time.length === 0) return null;
  return d.time.map((_, i) => ({
    day: TRIP_DAYS[i].day,
    date: TRIP_DAYS[i].date,
    emoji: i === 0 || i === 6 ? "✈️" : codeToEmoji(d.weathercode[i]),
    hi: Math.round(d.temperature_2m_max[i]),
    lo: Math.round(d.temperature_2m_min[i]),
    sunrise: d.sunrise[i] ?? null,
    sunset: d.sunset[i] ?? null,
  }));
}

export function useForecast() {
  const [state, setState] = useState({ days: FALLBACK, isLive: false, loading: true });

  useEffect(() => {
    (async () => {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) {
          const { ts, days, isLive } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setState({ days, isLive, loading: false });
            return;
          }
        }
      } catch (_) {}

      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const parsed = parseDays(data);
        const isLive = parsed !== null;
        const days = isLive ? parsed : FALLBACK;
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), days, isLive }));
        } catch (_) {}
        setState({ days, isLive, loading: false });
      } catch (_) {
        setState({ days: FALLBACK, isLive: false, loading: false });
      }
    })();
  }, []);

  return state;
}
