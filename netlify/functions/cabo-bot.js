import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 512;
const MAX_TURNS = 20;
const MAX_USER_CHARS = 2000;
const TRIP_START_ISO = "2026-06-14T09:25:00-06:00";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const log = (level, msg, extra = {}) => {
  console.log(JSON.stringify({ level, fn: "cabo-bot", msg, ...extra }));
};

async function fetchTripContext() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const supa = createClient(url, key, { auth: { persistSession: false } });
  const [guests, activities, restaurants, polls] = await Promise.all([
    supa.from("guests").select("name,role,confirmed"),
    supa.from("activities").select("title,cost,tag,confirmed_by"),
    supa.from("restaurants").select("name,cuisine,confirmed_by"),
    supa.from("polls").select("question,options,closed").eq("closed", false),
  ]);

  return {
    guests: guests.data || [],
    activities: activities.data || [],
    restaurants: restaurants.data || [],
    polls: polls.data || [],
  };
}

function buildSystemPrompt(ctx) {
  const today = new Date();
  const tripStart = new Date(TRIP_START_ISO);
  const tDays = Math.floor((tripStart - today) / (24 * 60 * 60 * 1000));
  const todayStr = today.toISOString().slice(0, 10);

  let tripFacts = "(Trip data unavailable right now — answer from general Cabo knowledge.)";
  if (ctx) {
    const confirmed = ctx.guests.filter((g) => g.confirmed && g.name).map((g) => g.name);
    const guestLine = confirmed.length
      ? `${ctx.guests.length} guests — confirmed: ${confirmed.join(", ")}.`
      : `${ctx.guests.length} guests.`;

    const ideaActs = ctx.activities.filter((a) => !a.confirmed_by).map((a) => a.title).filter(Boolean);
    const bookedActs = ctx.activities.filter((a) => a.confirmed_by).map((a) => a.title).filter(Boolean);
    const ideaRests = ctx.restaurants.filter((r) => !r.confirmed_by).map((r) => r.name).filter(Boolean);
    const bookedRests = ctx.restaurants.filter((r) => r.confirmed_by).map((r) => r.name).filter(Boolean);
    const pollLines = ctx.polls.map((p) => `"${p.question}"`);

    tripFacts = [
      `- Group: ${guestLine}`,
      `- Activities being considered: ${ideaActs.length ? ideaActs.join(", ") : "(none yet)"}`,
      `- Activities already booked: ${bookedActs.length ? bookedActs.join(", ") : "(none yet)"}`,
      `- Restaurants being considered: ${ideaRests.length ? ideaRests.join(", ") : "(none yet)"}`,
      `- Restaurants already booked: ${bookedRests.length ? bookedRests.join(", ") : "(none yet)"}`,
      `- Open polls: ${pollLines.length ? pollLines.join("; ") : "(none)"}`,
    ].join("\n");
  }

  return `You are Cabo Bot, a laid-back, knowledgeable local guide for Los Cabos, Mexico, helping a private group plan their trip to Villa Dos Mares in Palmilla, June 14–20, 2026. Today is ${todayStr}; the trip is ${tDays} days away.

## The trip
- Stay: Villa Dos Mares, Palmilla Enclave (~10 min from San José del Cabo, ~25 min from Cabo San Lucas).
${tripFacts}

## Persona
Friendly, sun-soaked, useful. Light flavor — occasional "amigo," "local secret," "check this out" — not overdone. Keep replies tight: 2–4 sentences, or a short bulleted list when comparing options.

## Local knowledge to draw from
- El Arco kayak tours, Mt. Solmar / rescue-dog hikes, Chileno Bay snorkel, water taxi to Lover's Beach (warn about Divorce Beach surf).
- Taquerías downtown Cabo San Lucas; Thursday-night Art Walk in San José del Cabo (Nov–Jun season).
- Toss in a useful Spanish phrase when natural ("la cuenta, por favor").
- Safety: Authorized Taxis or Uber, sunscreen, hydrate.

## Constraints
- Stay in Baja California Sur. Politely redirect off-topic destination questions back to Cabo.
- If the group has already booked an activity or restaurant, reference it when relevant.
- Don't invent specific prices, hours, or phone numbers — say "worth confirming on their site / Google" instead.
- If asked for an opinion, give one.`;
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return null;
  const cleaned = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    if (typeof m.content !== "string" || !m.content.trim()) continue;
    cleaned.push({ role: m.role, content: m.content.slice(0, MAX_USER_CHARS) });
  }
  if (!cleaned.length || cleaned[cleaned.length - 1].role !== "user") return null;
  return cleaned.slice(-MAX_TURNS);
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log("error", "missing ANTHROPIC_API_KEY");
    return json(500, { error: "Server misconfigured: missing ANTHROPIC_API_KEY" });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const messages = sanitizeMessages(payload.messages);
  if (!messages) return json(400, { error: "Invalid messages array" });

  let context = null;
  try {
    context = await fetchTripContext();
  } catch (err) {
    log("warn", "trip context fetch failed; continuing without it", { err: String(err) });
  }

  const system = buildSystemPrompt(context);

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.7,
      system,
      messages,
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    log("info", "ok", { turns: messages.length, outChars: text.length, stop: resp.stop_reason });
    return json(200, { message: text });
  } catch (err) {
    log("error", "anthropic call failed", { err: String(err), status: err?.status });
    return json(502, { error: "Cabo Bot is napping in the shade. Try again in a sec." });
  }
};
