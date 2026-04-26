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
  "tripadvisor.com": "https://www.tripadvisor.com/Attractions-g152515-Activities-c42-Cabo_San_Lucas_Los_Cabos_Baja_California.html",
  "viator.com": "https://www.viator.com/Cabo-San-Lucas-d50859",
  "cabo-adventures.com": "https://www.cabo-adventures.com/en",
};

const PROMPT = (existingTitles) => `You are helping plan a 6-night trip to Los Cabos for 8 adults (couples in their late 40s–60s — adventurous but also enjoy relaxing, food and drink lovers, a mix of active and laid-back energy).

Trip: June 14–20, 2026 · Villa Dos Mares, Palmilla Enclave (Km 27.5, San José del Cabo — Sea of Cortez side).

Use tavily-search to find activities, restricting your searches to these 5 domains only:
${SOURCES.map((s) => `- ${s}`).join("\n")}

Run multiple searches across these domains to surface a variety of specific activity listings — tours, experiences, excursions — available in Los Cabos in mid-June 2026. Search each domain at least once.

SEASONAL CONSTRAINT — do NOT suggest:
whale watching, whale shark tours, gray whale tours, humpback whale tours, manta ray snorkeling tours (these are Dec–Mar season only).

Pick 5 activities that are diverse in type (adventure, food/drink, culture, water, wellness, nightlife, etc.) and energy level. Prioritize results that are distinct from each other.

Return exactly 5 activities as a JSON array (no markdown, no explanation):
[{"title":"...","icon":"(emoji)","cost":"$X/pp or range","duration":"X hours","distance":"X min from Palmilla","description":"2 sentences — what it is and why this group will love it.","tag":"Adventure|Culinary|Culture|Sightseeing|Beach|Wellness|Nightlife","link":"exact URL of the specific listing page from your search results"}]

Every activity MUST have a real link — the exact URL of the specific listing page you found in search results. Do not use a homepage or category URL; use the direct link to that activity.
Avoid duplicating: ${existingTitles || "none yet"}.`;

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
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    let message;

    if (hasTavily) {
      message = await client.beta.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        mcp_servers: [
          {
            type: "url",
            url: `https://mcp.tavily.com/mcp/?tavilyApiKey=${process.env.TAVILY_API_KEY}`,
            name: "tavily",
          },
        ],
        messages: [{ role: "user", content: PROMPT(existingTitles) }],
        betas: ["mcp-client-2025-04-04"],
      });
    } else {
      // Fallback: no Tavily — use training knowledge, link to known category pages
      const fallbackLinks = Object.entries(FALLBACK_URLS)
        .map(([domain, url]) => `- ${domain}: ${url}`)
        .join("\n");
      message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content:
              PROMPT(existingTitles) +
              `\n\n(No live search available. Use your training knowledge for titles, descriptions, costs, and durations. For the link field, use the most relevant category URL from this list:\n${fallbackLinks}\nOnly use these URLs as links — do not invent others.)`,
          },
        ],
      });
    }

    const textBlock = message.content.filter((b) => b.type === "text").pop();
    if (!textBlock) throw new Error("No text content in response");

    const match = textBlock.text.trim().match(/\[[\s\S]*\]/);
    if (!match) throw new Error("No JSON array found in response");

    const suggestions = JSON.parse(match[0]);
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ suggestions }) };
  } catch (err) {
    console.error("[suggest-activities] error:", err);
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: "Failed to generate suggestions" }) };
  }
};
