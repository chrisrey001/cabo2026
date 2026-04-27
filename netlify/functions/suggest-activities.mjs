import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const SOURCES = [
  "airbnb.com",
  "getyourguide.com",
  "tripadvisor.com",
  "viator.com",
  "cabo-adventures.com",
];

const FALLBACK_URLS = {
  "airbnb.com": "https://www.airbnb.com/cabo-san-lucas-mexico/things-to-do",
  "getyourguide.com": "https://www.getyourguide.com/los-cabos-l264/",
  "tripadvisor.com":
    "https://www.tripadvisor.com/Attractions-g152515-Activities-c42-Cabo_San_Lucas_Los_Cabos_Baja_California.html",
  "viator.com": "https://www.viator.com/Cabo-San-Lucas-d50859",
  "cabo-adventures.com": "https://www.cabo-adventures.com/en",
};

const GROUP_HEADER = `You are helping plan a 6-night trip to Los Cabos for 8 adults (couples in their late 40s–60s — adventurous but also enjoy relaxing, food and drink lovers, a mix of active and laid-back energy).

Trip: June 14–20, 2026 · Villa Dos Mares, Palmilla Enclave (Km 27.5, San José del Cabo — Sea of Cortez side).`;

const SEASONAL_CONSTRAINT = `SEASONAL CONSTRAINT — do NOT suggest:
whale watching, whale shark tours, gray whale tours, humpback whale tours, manta ray snorkeling tours (these are Dec–Mar season only).`;

const OUTPUT_FORMAT = (existingTitles) =>
  `Return exactly 5 activities as a JSON array (no markdown, no explanation):
[{"title":"...","icon":"(emoji)","cost":"$X/pp or range","duration":"X hours","distance":"X min from Palmilla","description":"2 sentences — what it is and why this group will love it.","tag":"Adventure|Culinary|Culture|Sightseeing|Beach|Wellness|Nightlife","link":"..."}]
Avoid duplicating: ${existingTitles || "none yet"}.`;

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
    };
  }

  let activities = [];
  try {
    ({ activities } = JSON.parse(event.body || "{}"));
  } catch {
    return {
      statusCode: 400,
      headers: CORS,
      body: JSON.stringify({ error: "Invalid request body" }),
    };
  }

  const existingTitles = (activities || [])
    .map((a) => a.title)
    .filter(Boolean)
    .join(", ");

  const hasTavily = !!process.env.TAVILY_API_KEY;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    let promptContent;

    if (hasTavily) {
      // Phase 1: Code runs all searches — Tavily fetches, Claude never touches the web
      const searchResults = await Promise.all(
        SOURCES.map((domain) =>
          fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query: "tours activities experiences Los Cabos",
              include_domains: [domain],
              search_depth: "advanced",
              max_results: 5,
            }),
          })
            .then((r) => r.json())
            .catch(() => ({ results: [] }))
        )
      );

      const listings = searchResults
        .flatMap((res, i) =>
          (res.results || []).map(
            (r) =>
              `[${SOURCES[i]}]\nTitle: ${r.title}\nURL: ${r.url}\nAbout: ${(r.content || "").slice(0, 300)}`
          )
        )
        .join("\n\n");

      // Phase 2: Claude analyzes results — no tools, no web access, URLs must come from listings
      promptContent = `${GROUP_HEADER}

Below are real activity listings pulled from 5 booking sites. Analyze them and select 5 that are diverse in type and best suit this group for mid-June 2026.

${SEASONAL_CONSTRAINT}

LISTINGS:
${listings}

${OUTPUT_FORMAT(existingTitles).replace('"link":"..."', '"link":"exact URL from the listings above"')}

Use only URLs that appear in the listings above. Do not modify or invent URLs.`;
    } else {
      // Fallback: no Tavily — Claude uses training knowledge, links to known category pages
      const fallbackLinks = Object.entries(FALLBACK_URLS)
        .map(([domain, url]) => `- ${domain}: ${url}`)
        .join("\n");

      promptContent = `${GROUP_HEADER}

${SEASONAL_CONSTRAINT}

Suggest 5 diverse activities available in Los Cabos in mid-June 2026. Use your training knowledge for titles, descriptions, costs, and durations.

${OUTPUT_FORMAT(existingTitles).replace('"link":"..."', '"link":"most relevant category URL from the list below"')}

For the link field, use only URLs from this list — do not invent others:
${fallbackLinks}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: promptContent }],
    });

    const textBlock = message.content.filter((b) => b.type === "text").pop();
    if (!textBlock) throw new Error("No text content in response");

    const match = textBlock.text.trim().match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in response");

    const suggestions = JSON.parse(match[0]);
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({ suggestions }),
    };
  } catch (err) {
    console.error("[suggest-activities] error:", err);
    return {
      statusCode: 500,
      headers: CORS,
      body: JSON.stringify({ error: "Failed to generate suggestions" }),
    };
  }
};
