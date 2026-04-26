import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// June is NOT the right season for these — exclude them entirely
const JUNE_BLACKLIST = [
  "whale watching",
  "whale shark snorkeling",
  "gray whale",
  "humpback whale",
  "whale shark",
  "whale tour",
  "whale shark tour",
  "manta ray snorkeling",
];

// Peak-season activities for June in Los Cabos (marlin season opens, calm Cortez side)
const JUNE_PEAK = [
  "offshore sportfishing (marlin, dorado, wahoo — peak season June–Nov)",
  "SCUBA diving (summer visibility excellent on Cortez side)",
  "sunset sailing or catamaran cruise",
  "kayaking and snorkeling at Pelican Rock / Chileno Bay",
  "ATV or UTV off-road tour through Baja desert",
  "yacht charter (half-day, Sea of Cortez)",
  "cooking class or mezcal/tequila tasting experience",
  "golf at Quivira or Cabo del Sol (summer discounts common)",
  "zip-line or canopy tour in the Sierra de la Laguna foothills",
  "Todos Santos art village day trip (~1 hr drive)",
  "horseback riding on the beach",
  "paddleboard or surf lesson on Cortez side",
];

const EXCLUDE_DOMAINS = [
  "tripadvisor.com",
  "yelp.com",
  "google.com",
  "lonelyplanet.com",
  "fodors.com",
  "frommers.com",
  "expedia.com",
  "booking.com",
  "hotels.com",
  "travelocity.com",
  "kayak.com",
  "orbitz.com",
  "getyourguide.com",
  "viator.com",
  "airbnb.com",
  "pinterest.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "wikipedia.org",
];

async function tavilySearch(query, apiKey) {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      exclude_domains: EXCLUDE_DOMAINS,
      include_answer: false,
    }),
  });
  if (!res.ok) return [];
  const json = await res.json();
  return (json.results || []).map((r) => ({ url: r.url, title: r.title, content: r.content?.slice(0, 300) }));
}

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }) };
  }

  let activities = [];
  try {
    ({ activities } = JSON.parse(event.body || "{}"));
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const existingTitles = (activities || [])
    .map((a) => a.title)
    .filter(Boolean)
    .join(", ");

  const hasTavily = !!process.env.TAVILY_API_KEY;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // ── Phase 1: Claude generates 5 title strings ──────────────────────────
    const phase1 = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are planning a Los Cabos trip for 8 adults, June 14–20 2026 at Villa Dos Mares in Palmilla Enclave. Generate exactly 5 unique activity TITLES only.

SEASONAL RULES FOR JUNE:
- FORBIDDEN (wrong season): ${JUNE_BLACKLIST.join(", ")}
- GOOD for June: ${JUNE_PEAK.join("; ")}

Avoid duplicating: ${existingTitles || "none yet"}.

Reply with ONLY a JSON array of 5 short title strings, e.g.: ["Offshore Sportfishing Charter","Sunset Catamaran Cruise","Chileno Bay Snorkel & Kayak","Todos Santos Art Village Day Trip","Mezcal Tasting & Distillery Tour"]
No markdown, no explanation.`,
        },
      ],
    });

    const titlesText = phase1.content.find((b) => b.type === "text")?.text?.trim() || "";
    const titlesMatch = titlesText.match(/\[[\s\S]*\]/);
    if (!titlesMatch) throw new Error("Phase 1: no titles JSON");
    const titles = JSON.parse(titlesMatch[0]);
    if (!Array.isArray(titles) || titles.length === 0) throw new Error("Phase 1: empty titles");

    // ── Phase 2: Parallel Tavily searches ──────────────────────────────────
    let searchResults = [];
    if (hasTavily) {
      searchResults = await Promise.all(
        titles.map((title) =>
          tavilySearch(`${title} Los Cabos book reserve 2025 2026`, process.env.TAVILY_API_KEY)
        )
      );
    }

    // ── Phase 3: Claude formats full activity objects ───────────────────────
    const searchContext = hasTavily
      ? titles
          .map((title, i) => {
            const hits = searchResults[i] || [];
            if (!hits.length) return `Activity: "${title}"\nNo search results found.`;
            const lines = hits.map((h) => `  URL: ${h.url}\n  Title: ${h.title}\n  Snippet: ${h.content}`).join("\n---\n");
            return `Activity: "${title}"\nSearch results:\n${lines}`;
          })
          .join("\n\n===\n\n")
      : `Activities: ${titles.join(", ")}\n(No search results available)`;

    const phase3 = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1800,
      messages: [
        {
          role: "user",
          content: `You are formatting Los Cabos activity cards for a trip planning app (June 2026, 8 adults, Villa Dos Mares, Palmilla Enclave).

Here are the 5 activities with search results:

${searchContext}

Return a JSON array of exactly 5 objects. Each object MUST follow this schema:
{"title":"...","icon":"(single emoji)","cost":"$X/pp or range or FREE","duration":"X hours","distance":"X min from Palmilla","description":"1-2 engaging sentences.","tag":"Culinary|Sightseeing|Culture|Adventure|Beach|Nightlife","link":"URL or null"}

STRICT URL RULES:
- For "link": use ONLY a URL that appears verbatim in the search results above
- The URL must be a direct booking or official operator page (NOT tripadvisor, yelp, google, etc.)
- If no qualifying URL exists in the results, set "link" to null — never invent or guess a URL
- Prefer URLs containing "book", "reserve", "tours", or the operator's own domain

Return ONLY the JSON array. No markdown, no explanation.`,
        },
      ],
    });

    const phase3Text = phase3.content.find((b) => b.type === "text")?.text?.trim() || "";
    const match = phase3Text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Phase 3: no JSON array");

    const suggestions = JSON.parse(match[0]);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions }) };
  } catch (err) {
    console.error("[suggest-activities] error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to generate suggestions" }) };
  }
};
