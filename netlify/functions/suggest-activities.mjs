import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

// Per-category Tavily search configs. The selected category narrows both the
// query and the include_domains to one focused intent.
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

const GROUP_HEADER = `You are helping plan a 6-night trip to Los Cabos for couples in their mid-to-late 30s — hard-working parents getting a serious break from the kids. High household incomes ($350K+), so budget isn't a constraint. They're adventurous but want real relaxation and unique experiences, and they love beaches, lively restaurants, and standout activities.

Trip: June 14–20, 2026 · Villa Dos Mares, Palmilla Enclave (Km 27.5, San José del Cabo — Sea of Cortez side).`;

const SEASONAL_CONSTRAINT = `SEASONAL CONSTRAINT — do NOT suggest:
whale watching, whale shark tours, gray whale tours, humpback whale tours, manta ray snorkeling tours (these are Dec–Mar season only).`;

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

  // Phase 1 — Tavily. Single narrow search, max 5 results for the chosen category.
  // search_depth: "basic" — 1 credit/call vs 2 for "advanced", and ~1-3s faster.
  // Sufficient quality for a curated 4-5 domain whitelist.
  let results;
  try {
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: config.query,
        include_domains: config.domains,
        search_depth: "basic",
        max_results: 5,
      }),
    });
    if (!tavilyRes.ok) {
      const raw = await tavilyRes.text();
      let detail = raw.slice(0, 200);
      try {
        const body = JSON.parse(raw);
        detail = body.error || body.detail || body.message || detail;
      } catch {
        // Not JSON — keep the raw text snippet.
      }
      console.error("[suggest-activities] tavily non-2xx:", { category, status: tavilyRes.status, detail });
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: `Tavily ${tavilyRes.status}: ${detail}`, stage: "tavily" }),
      };
    }
    const tavilyData = await tavilyRes.json();
    results = tavilyData.results || [];
    console.log("[suggest-activities] tavily ok:", { category, count: results.length, first: results[0]?.url });
  } catch (err) {
    console.error("[suggest-activities] tavily error:", { category, message: err.message });
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `Tavily request failed: ${err.message}`, stage: "tavily" }),
    };
  }

  if (results.length === 0) {
    console.error("[suggest-activities] tavily empty:", { category });
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `No Tavily results for ${category}`, stage: "tavily" }),
    };
  }

  // Numbered listings — Claude returns the index of its picks so we hydrate
  // URLs verbatim from the Tavily array (no model-authored URL strings).
  const listings = results
    .map((r, i) => `[${i}] ${r.title}\n    URL: ${r.url}\n    About: ${(r.content || "").slice(0, 400)}`)
    .join("\n\n");

  const promptContent = `${GROUP_HEADER}

${SEASONAL_CONSTRAINT}

Below are ${results.length} ${category} listings from real booking and review sites. Pick the TOP 3 that best fit this group.

Prioritize specific, bookable picks over generic listicles. Variety helps but quality and fit to the group come first.

Avoid duplicating these existing picks: ${existingTitles || "none"}.

LISTINGS:
${listings}

Return exactly 3 picks as a JSON array, no markdown, no commentary:
[{"source_index": <int between 0 and ${results.length - 1}>, "title": "...", "icon": "<one emoji>", "cost": "$X/pp or range", "duration": "e.g. 3 hours, Half day, Evening", "distance": "X min from Palmilla", "description": "Two sentences — what it is and why this group will love it.", "tag": "Adventure|Culinary|Culture|Sightseeing|Beach|Wellness|Nightlife"}]`;

  // Phase 2 — Sonnet 4.6 ranks the 5 results down to top 3.
  let textBlock;
  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: promptContent }],
    });
    textBlock = message.content.filter((b) => b.type === "text").pop();
    if (!textBlock) {
      console.error("[suggest-activities] anthropic no text block:", { category, stop_reason: message.stop_reason });
      return {
        statusCode: 502,
        headers: CORS,
        body: JSON.stringify({ error: "No text content in Claude response", stage: "anthropic" }),
      };
    }
    console.log("[suggest-activities] anthropic ok:", { category, stop_reason: message.stop_reason, text_len: textBlock.text.length });
  } catch (err) {
    console.error("[suggest-activities] anthropic error:", { category, message: err.message });
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `Claude request failed: ${err.message}`, stage: "anthropic" }),
    };
  }

  // Phase 3 — Parse the JSON array out of Claude's text response.
  let picks;
  try {
    const match = textBlock.text.trim().match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in response");
    picks = JSON.parse(match[0]);
    if (!Array.isArray(picks)) throw new Error("Parsed value is not an array");
  } catch (err) {
    console.error("[suggest-activities] parse error:", { category, message: err.message, text: textBlock.text.slice(0, 500) });
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: `Could not parse Claude response: ${err.message}`, stage: "parse" }),
    };
  }

  // Phase 4 — Hydrate URLs from the Tavily array. Per-item try so a single
  // malformed URL drops one suggestion rather than failing the whole batch.
  const suggestions = picks
    .map((sel) => {
      const source = results[sel.source_index];
      if (!source) return null;
      let source_domain = source.url;
      try {
        source_domain = new URL(source.url).hostname.replace(/^www\./, "");
      } catch {
        // Leave source_domain as the raw URL if parsing fails.
      }
      return {
        title: sel.title,
        icon: sel.icon,
        cost: sel.cost,
        duration: sel.duration,
        distance: sel.distance,
        description: sel.description,
        tag: sel.tag,
        link: source.url,
        source_domain,
      };
    })
    .filter(Boolean);

  return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions }) };
};
