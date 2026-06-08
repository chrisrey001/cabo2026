import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 700;
const MAX_TURNS = 20;
const MAX_USER_CHARS = 2000;
const MAX_TOOL_ITERATIONS = 4;
const TRIP_START_ISO = "2026-06-14T09:25:00-06:00";
const ADDED_BY = "Cabo Bot";

const json = (statusCode, body) => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

const log = (level, msg, extra = {}) => {
  console.log(JSON.stringify({ level, fn: "cabo-bot", msg, ...extra }));
};

function getSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function fetchTripContext(supa) {
  if (!supa) return null;
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

## Tools — adding to the trip plan
You can add new entries directly to the group's **Dining Guide** with the \`add_restaurant\` tool.

When to call it:
- ONLY when the user explicitly asks you to add a restaurant (e.g. "add Mariscos La Guerrerense to dining," "put Flora Farms on the list").
- Do NOT auto-add suggestions. If you think a spot belongs on the list, *suggest it* and ask if they'd like it added.
- Never invent precise prices, hours, or phone numbers. Use ranges or leave fields blank when unsure.
- After a successful tool call, briefly confirm what was added. The list updates live — no refresh needed.

## Tools — web search
You also have a \`web_search\` tool. Use it when:
- The user asks about hours, current prices, recent reviews, or "what's new."
- They want a recent recommendation ("best taco spot right now," "hottest sunset cruise").
- The answer would be stronger with a fresh source link.
- They ask you to find a real spot before adding to the trip — search first, then call \`add_restaurant\` with details from a reputable result.

Don't search for things you already know reliably (e.g. "what is El Arco?", "what time does sunset happen in June?"). You're capped at 3 searches per turn. Sources don't need to be booking sites — local blogs, Reddit, Google Maps reviews, news, the operator's own site are all fair game.

## Response format

**For normal questions (no web search):**
- Short paragraphs. Markdown bold and bullets when comparing options.
- 2–4 sentences typical, or up to 5 bullets.

**When you used web search, format the answer as:**
- One short sentence framing the answer.
- A tight bulleted list (max 5). Each bullet:
  - Lead with **bold name**.
  - 1-line description (vibe, price band, why it's good).
  - Inline Markdown link: [more info](url).
  - One fitting emoji at the end of the bullet (🌮 🌅 🐬 🏖️ 🍹 ⛵ 🌵).
- Skip filler. No long paragraphs.
- Do **not** add a "Sources:" list yourself — citations are appended automatically.

## Other constraints
- Stay in Baja California Sur. Politely redirect off-topic destination questions back to Cabo.
- If the group has already booked an activity or restaurant, reference it when relevant.
- If asked for an opinion, give one.`;
}

const TOOLS = [
  {
    name: "add_restaurant",
    description:
      "Add a new restaurant to the group's 'Dining Guide' section. Only call this when the user explicitly asks you to add one.",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Restaurant name." },
        cuisine: { type: "string", description: "Cuisine type, e.g. 'Seafood', 'Italian', 'Traditional Mexican'." },
        vibe: { type: "string", description: "Short vibe description, e.g. 'Cliffside fine dining' or 'Casual taco joint'." },
        cost: { type: "string", description: "Cost range like '$60–80/pp'. Leave blank if unknown." },
        distance: { type: "string", description: "From the villa, e.g. '20 min drive'. Leave blank if unknown." },
        hours: { type: "string", description: "Opening hours, e.g. '5 – 10 PM'. Leave blank if unknown." },
        phone: { type: "string", description: "Phone number if confidently known. Leave blank otherwise." },
        book: { type: "string", description: "How to book, e.g. 'OpenTable', 'Walk-in OK', 'Call ahead'. Leave blank if unknown." },
      },
      required: ["name", "cuisine", "vibe"],
    },
  },
  {
    type: "web_search_20250305",
    name: "web_search",
    max_uses: 3,
    user_location: {
      type: "approximate",
      city: "Cabo San Lucas",
      region: "Baja California Sur",
      country: "MX",
      timezone: "America/Mazatlan",
    },
  },
];

async function nextSort(supa, table) {
  const { data, error } = await supa.from(table).select("sort").order("sort", { ascending: false }).limit(1);
  if (error || !data?.length) return 0;
  return (data[0].sort ?? 0) + 1;
}

function parseCostNum(cost) {
  if (!cost) return 0;
  const matches = String(cost).match(/\d+/g);
  if (!matches) return 0;
  const nums = matches.map(Number);
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
  return Math.round(avg);
}

async function runTool(supa, name, input) {
  if (!supa) return { ok: false, error: "Trip database is not configured on the server." };

  if (name === "add_restaurant") {
    const { name: rName, cuisine, vibe, cost, distance, hours, phone, book } = input || {};
    if (!rName || !cuisine || !vibe) return { ok: false, error: "Missing required fields (name, cuisine, vibe)." };

    const sort = await nextSort(supa, "restaurants");
    const row = {
      name: rName,
      cuisine,
      vibe,
      cost: cost || "",
      distance: distance || "",
      hours: hours || "",
      phone: phone || "",
      book: book || "",
      cost_num: parseCostNum(cost),
      sort,
      added_by: ADDED_BY,
    };
    const { data, error } = await supa.from("restaurants").insert(row).select().single();
    if (error) {
      log("error", "add_restaurant insert failed", { err: error.message });
      return { ok: false, error: "Database insert failed." };
    }
    return { ok: true, id: data.id, name: data.name };
  }

  return { ok: false, error: `Unknown tool: ${name}` };
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

function extractText(blocks) {
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function extractCitations(blocks) {
  const out = [];
  for (const b of blocks) {
    if (b.type !== "text" || !Array.isArray(b.citations)) continue;
    for (const c of b.citations) {
      if (c.type !== "web_search_result_location") continue;
      if (!c.url) continue;
      out.push({ url: c.url, title: c.title || c.url });
    }
  }
  return out;
}

function formatSources(citations) {
  if (!citations.length) return "";
  const seen = new Set();
  const unique = [];
  for (const c of citations) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    unique.push(c);
  }
  const lines = unique.map((c) => `- [${c.title}](${c.url})`).join("\n");
  return `\n\n**Sources:**\n${lines}`;
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

  const supa = getSupabase();

  let context = null;
  try {
    context = await fetchTripContext(supa);
  } catch (err) {
    log("warn", "trip context fetch failed; continuing without it", { err: String(err) });
  }

  const system = buildSystemPrompt(context);

  try {
    const client = new Anthropic({ apiKey });
    const conversation = [...messages];
    let finalText = "";
    let toolsUsed = [];
    const citations = [];
    let webSearches = 0;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const resp = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        temperature: 0.7,
        system,
        tools: TOOLS,
        messages: conversation,
      });

      citations.push(...extractCitations(resp.content));
      webSearches += resp.usage?.server_tool_use?.web_search_requests || 0;

      if (resp.stop_reason !== "tool_use") {
        finalText = extractText(resp.content) + formatSources(citations);
        log("info", "ok", {
          iters: i + 1,
          turns: messages.length,
          outChars: finalText.length,
          stop: resp.stop_reason,
          tools: toolsUsed,
          webSearches,
          citations: citations.length,
        });
        break;
      }

      conversation.push({ role: "assistant", content: resp.content });
      const toolUses = resp.content.filter((b) => b.type === "tool_use");
      const results = await Promise.all(
        toolUses.map(async (tu) => {
          toolsUsed.push(tu.name);
          const result = await runTool(supa, tu.name, tu.input);
          return {
            type: "tool_result",
            tool_use_id: tu.id,
            content: JSON.stringify(result),
            is_error: !result.ok,
          };
        })
      );
      conversation.push({ role: "user", content: results });
    }

    if (!finalText) {
      finalText = "Sorry, amigo — that one looped longer than expected. Try rephrasing?";
      log("warn", "tool loop exhausted", { tools: toolsUsed });
    }

    return json(200, { message: finalText });
  } catch (err) {
    log("error", "anthropic call failed", { err: String(err), status: err?.status });
    return json(502, { error: "Cabo Bot is napping in the shade. Try again in a sec." });
  }
};
