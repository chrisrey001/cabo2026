import { useState, useEffect } from "react";
import { codeToEmoji } from "../utils/weatherCode";

// Full trip window. `travel` days keep the ✈️ icon even when live data exists.
const TRIP = [
  { iso: "2026-06-14", day: "Sun", date: "14", emoji: "✈️", hi: 88, lo: 73, travel: true },
  { iso: "2026-06-15", day: "Mon", date: "15", emoji: "☀️", hi: 89, lo: 74 },
  { iso: "2026-06-16", day: "Tue", date: "16", emoji: "☀️", hi: 90, lo: 74 },
  { iso: "2026-06-17", day: "Wed", date: "17", emoji: "☀️", hi: 90, lo: 75 },
  { iso: "2026-06-18", day: "Thu", date: "18", emoji: "☀️", hi: 89, lo: 75 },
  { iso: "2026-06-19", day: "Fri", date: "19", emoji: "☀️", hi: 88, lo: 74 },
  { iso: "2026-06-20", day: "Sat", date: "20", emoji: "✈️", hi: 88, lo: 74, travel: true },
];

// Seasonal-average view of every trip day (used until live data is in range).
const FALLBACK = TRIP.map(({ iso, travel, ...rest }) => ({ ...rest, sunrise: null, sunset: null }));

// Open-Meteo's free tier serves today + 15 days. Requesting beyond that errors
// the whole call, so we clamp end_date to stay inside the window.
const FORECAST_HORIZON_DAYS = 15;

// Current conditions change through the day, so keep the cache short.
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

// One request gives us both live "now" conditions and the daily trip forecast.
// When the trip is still beyond the forecast horizon we drop the daily/date
// params (which would error) but keep current conditions.
function buildUrl(startIso, endIso) {
  let url =
    "https://api.open-meteo.com/v1/forecast" +
    "?latitude=23.008&longitude=-109.717" +
    "&timezone=America%2FMazatlan" +
    "&temperature_unit=fahrenheit&wind_speed_unit=mph" +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day";
  if (startIso) {
    url +=
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,sunrise,sunset" +
      `&start_date=${startIso}&end_date=${endIso}`;
  }
  return url;
}

// Live "right now in Cabo" snapshot.
function parseCurrent(data) {
  const c = data && data.current;
  if (!c || c.temperature_2m == null) return null;
  const code = c.weather_code;
  const isDay = c.is_day === 1;
  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: Math.round(c.relative_humidity_2m),
    wind: Math.round(c.wind_speed_10m),
    emoji: !isDay && code === 0 ? "🌙" : codeToEmoji(code),
    isDay,
  };
}

// Map the daily response into a lookup keyed by ISO date.
function parseDays(data) {
  const d = data && data.daily;
  if (!d || !d.time || d.time.length === 0) return {};
  const byDate = {};
  d.time.forEach((iso, i) => {
    if (d.temperature_2m_max[i] == null) return;
    byDate[iso] = {
      emoji: codeToEmoji(d.weathercode[i]),
      hi: Math.round(d.temperature_2m_max[i]),
      lo: Math.round(d.temperature_2m_min[i]),
      sunrise: d.sunrise?.[i] ?? null,
      sunset: d.sunset?.[i] ?? null,
    };
  });
  return byDate;
}

// Merge live data (where available) over the seasonal fallback, per day.
function mergeDays(live) {
  return TRIP.map((t) => {
    const hit = live[t.iso];
    if (!hit) {
      const { iso, travel, ...rest } = t;
      return { ...rest, sunrise: null, sunset: null, live: false };
    }
    return {
      day: t.day,
      date: t.date,
      emoji: t.travel ? t.emoji : hit.emoji,
      hi: hit.hi,
      lo: hit.lo,
      sunrise: hit.sunrise,
      sunset: hit.sunset,
      live: true,
    };
  });
}

export function useForecast() {
  const [state, setState] = useState({
    days: FALLBACK,
    isLive: false,
    liveCount: 0,
    total: TRIP.length,
    current: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      const today = new Date();
      const todayIso = isoDate(today);
      const cacheKey = `cabo26:forecast:${todayIso}`;

      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          const { ts, payload } = JSON.parse(cached);
          if (Date.now() - ts < CACHE_TTL) {
            setState({ ...payload, loading: false });
            return;
          }
        }
      } catch (_) {}

      // Only request the slice of the trip that falls within the forecast horizon.
      const horizonIso = isoDate(addDays(today, FORECAST_HORIZON_DAYS));
      const tripInRange = TRIP[0].iso <= horizonIso;
      const startIso = tripInRange ? TRIP[0].iso : null;
      const endIso = tripInRange
        ? TRIP[TRIP.length - 1].iso < horizonIso
          ? TRIP[TRIP.length - 1].iso
          : horizonIso
        : null;

      try {
        const res = await fetch(buildUrl(startIso, endIso));
        if (!res.ok) throw new Error("fetch failed");
        const data = await res.json();
        const current = parseCurrent(data);
        const days = tripInRange ? mergeDays(parseDays(data)) : FALLBACK;
        const liveCount = days.filter((d) => d.live).length;
        const payload = { days, isLive: liveCount > 0, liveCount, total: TRIP.length, current };
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), payload }));
        } catch (_) {}
        setState({ ...payload, loading: false });
      } catch (_) {
        setState({
          days: FALLBACK,
          isLive: false,
          liveCount: 0,
          total: TRIP.length,
          current: null,
          loading: false,
        });
      }
    })();
  }, []);

  return state;
}
