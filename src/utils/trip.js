import { TRIP_START, TRIP_END } from "../theme";

const MS_PER_DAY = 86400000;

export function getTripPhase(now = new Date()) {
  const nowMs = now.getTime();
  const startMs = new Date(TRIP_START).getTime();
  const endMs = new Date(TRIP_END).getTime();
  if (nowMs < startMs) return { phase: "before", days: Math.ceil((startMs - nowMs) / MS_PER_DAY) };
  if (nowMs < endMs) return { phase: "during" };
  return { phase: "after" };
}

export function getCountdownLabel(now = new Date()) {
  const p = getTripPhase(now);
  if (p.phase === "during") return "Welcome to Cabo! 🌅";
  if (p.phase === "after") return "Hope you had fun ✨";
  if (p.days === 1) return "1 day to Cabo · 🌴";
  return `${p.days} days to Cabo · 🌴`;
}
