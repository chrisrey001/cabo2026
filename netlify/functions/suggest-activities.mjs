import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Per-category search configs — different queries and domains for each intent.
// A single generic query hitting all activity sites is why restaurants and
// nightlife never appeared before.
const CATEGORY_CONFIG = {
  adventures: {
    query: "tours excursions adventures booking Los Cabos 2026",
    domains: ["viator.com", "getyourguide.com", "cabo-adventures.com", "tripadvisor.com"],
  },
  experiences: {
    query: "Los Cabos unique experiences local hosts 2026",
    domains: ["airbnb.com", "viator.com", "getyourguide.com", "withlocals.com"],
  },
  restaurants: {
    query: "best restaurants Cabo San Lucas San Jose del Cabo 2026 reviews",
    domains: ["theinfatuation.com", "eater.com", "opentable.com", "tripadvisor.com", "cntraveler.com"],
  },
  nightlife: {
    query: "best bars nightlife Cabo San Lucas 2026 reviews",
    domains: ["theinfatuation.com", "tripadvisor.com", "timeout.com", "cntraveler.com"],
  },
};

const GROUP_HEADER = `You are helping plan a 6-night trip to Los Cabos for 8 adults (couples in their late 40s–60s — adventurous but also enjoy relaxing, food and drink lovers, a mix of active and laid-back energy).

Trip: June 14–20, 2026 · Villa Dos Mares, Palmilla Enclave (Km 27.5, San José del Cabo — Sea of Cortez side).`;

const SEASONAL_CONSTRAINT = `SEASONAL CONSTRAINT — do NOT suggest:
whale watching, whale shark tours, gray whale tours, humpback whale tours, manta ray snorkeling tours (these are Dec–Mar season only).`;

// Claude returns source_index (an integer) — code looks up the URL from the
// original Tavily array. Claude never produces a URL string, so hallucination
// is structurally impossible regardless of how long or complex the URL is.
const RANKING_TOOL = {
  name: "rank_activities",
  description: "Select the best activities from the provided listings.",
  input_schema: {
    type: "object",
    properties: {
      selections: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            source_index: {
              type: "integer",
              description: "0-based index of the chosen listing in the input array.",
            },
            title: { type: "string" },
            icon: { type: "string", description: "Single emoji." },
            cost: { type: "string", description: "e.g. '$80/pp', '$150–200/pp', or 'Free'." },
            duration: { type: "string", description: "e.g. '3 hours', 'Half day', 'Evening'." },
            distance: { type: "string", description: "Travel time from Palmilla, e.g. '15 min from Palmilla'." },
            description: { type: "string", description: "Two sentences: what it is and why this group will love it." },
            tag: {
              type: "string",
              enum: ["Adventure", "Culinary", "Culture", "Sightseeing", "Beach", "Wellness", "Nightlife"],
            },
          },
          required: ["source_index", "title", "icon", "cost", "duration", "distance", "description", "tag"],
        },
      },
    },
    required: ["selections"],
  },
};

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
  if (!process.env.TAVILY_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "TAVILY_API_KEY not configured" }) };
  }

  let activities = [];
  let category = "adventures";
  try {
    const body = JSON.parse(event.body || "{}");
    activities = body.activities || [];
    category = body.category || "adventures";
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const config = CATEGORY_CONFIG[category];
  if (!config) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: `Unknown category: ${category}` }) };
  }

  const existingTitles = activities.map((a) => a.title).filter(Boolean).join(", ");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Phase 1: Tavily fetches — code-controlled, Claude not involved.
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: config.query,
        include_domains: config.domains,
        search_depth: "advanced",
        max_results: 15,
      }),
    });
    const tavilyData = await tavilyRes.json();
    const results = tavilyData.results || [];

    if (results.length === 0) {
      return { statusCode: 502, headers: CORS, body: JSON.stringify({ error: "No results from search" }) };
    }

    // Indexed listing format — the [N] prefix is what Claude references in
    // source_index. Explicit and unambiguous.
    const listings = results
      .map((r, i) => `[${i}] ${r.title}\n    URL: ${r.url}\n    About: ${(r.content || "").slice(0, 400)}`)
      .join("\n\n");

    // Phase 2: Claude ranks via tool use — no URL strings produced by the model.
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      tools: [RANKING_TOOL],
      tool_choice: { type: "tool", name: "rank_activities" },
      messages: [
        {
          role: "user",
          content: `${GROUP_HEADER}

${SEASONAL_CONSTRAINT}

Below are ${results.length} ${category} listings from real booking and review sites. Pick the best ones for this group — up to 5, diverse in type.

Prioritize:
- Specific bookable experiences over generic listicle pages
- Variety across your picks
- Quality and relevance to the group

Avoid duplicating: ${existingTitles || "none"}.

LISTINGS:
${listings}`,
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse) throw new Error("No tool call in response");

    // Hydrate URLs from the Tavily source array — Claude said "index 7",
    // we look up results[7].url. The URL is verbatim from Tavily, untouched.
    const suggestions = toolUse.input.selections
      .map((sel) => {
        const source = results[sel.source_index];
        if (!source) return null;
        return {
          title: sel.title,
          icon: sel.icon,
          cost: sel.cost,
          duration: sel.duration,
          distance: sel.distance,
          description: sel.description,
          tag: sel.tag,
          link: source.url,
          source_domain: new URL(source.url).hostname.replace(/^www\./, ""),
        };
      })
      .filter(Boolean);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions }) };
  } catch (err) {
    console.error("[suggest-activities] error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to generate suggestions" }) };
  }
};
