import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "ANTHROPIC_API_KEY not configured in Netlify environment" }) };
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

    // Phase 1 — generate 5 activity titles + tags
    const p1 = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Suggest 5 activity ideas for a 6-night Los Cabos trip at Villa Dos Mares, Palmilla Enclave (Km 27.5 Carretera Transpeninsular, between San José del Cabo and Cabo San Lucas), June 2026, group of ~8 adults. Return ONLY a JSON array with no markdown:
[{"title":"...","tag":"Culinary|Sightseeing|Culture|Adventure","icon":"(single emoji)"}]
Avoid duplicating these existing ideas: ${existingTitles || "none yet"}.`,
        },
      ],
    });

    const m1 = p1.content[0].text.trim().match(/\[[\s\S]*\]/);
    if (!m1) throw new Error("Phase 1: no JSON array in response");
    const titles = JSON.parse(m1[0]);

    // Phase 2 — parallel Tavily searches, one per activity
    let searchResults = titles.map(() => []);
    if (hasTavily) {
      const searches = await Promise.all(
        titles.map(({ title }) =>
          fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: process.env.TAVILY_API_KEY,
              query: `${title} Los Cabos book price`,
              search_depth: "basic",
              max_results: 2,
            }),
          })
            .then((r) => r.json())
            .catch(() => ({ results: [] }))
        )
      );
      searchResults = searches.map((s) => s.results || []);
    }

    // Phase 3 — Claude formats final JSON with real URLs from search results
    const searchContext = titles
      .map(({ title }, i) => {
        const snippets =
          searchResults[i]
            .map((r) => `URL: ${r.url}\nTitle: ${r.title}\nExcerpt: ${(r.content || "").slice(0, 300)}`)
            .join("\n\n") || "No search results available.";
        return `Activity: ${title}\n${snippets}`;
      })
      .join("\n\n---\n\n");

    const p3 = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are helping plan a Los Cabos trip. Villa Dos Mares is at Palmilla Enclave, Km 27.5 Carretera Transpeninsular — San José del Cabo is ~10 min east, Cabo San Lucas is ~30 min west.

Using the search results below, format 5 activity suggestions. Use real prices and URLs from the search results where available. Prefer direct booking pages over aggregators or search engines. Write concise 1-2 sentence descriptions. Return ONLY valid JSON with no markdown:
[{"title":"...","icon":"(emoji)","cost":"$X/pp or FREE","duration":"...","distance":"... from Palmilla","description":"1-2 sentences.","tag":"Culinary|Sightseeing|Culture|Adventure","link":"(real URL from search results — never a search engine page)"}]

${searchContext}`,
        },
      ],
    });

    const m3 = p3.content[0].text.trim().match(/\[[\s\S]*\]/);
    if (!m3) throw new Error("Phase 3: no JSON array in response");
    const suggestions = JSON.parse(m3[0]);

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions }) };
  } catch (err) {
    console.error("[suggest-activities] error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to generate suggestions" }) };
  }
};
