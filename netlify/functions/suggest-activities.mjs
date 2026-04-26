import Anthropic from "@anthropic-ai/sdk";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

const PROMPT = (existingTitles) => `You are helping plan a 6-night trip to Los Cabos for 8 adults (couples in their late 40s–60s — adventurous but also enjoy relaxing, food and drink lovers, a mix of active and laid-back energy).

Trip: June 14–20, 2026 · Villa Dos Mares, Palmilla Enclave (Km 27.5, San José del Cabo — Sea of Cortez side).

Use tavily-search to find diverse, current activities and experiences available within roughly 1 hour's drive of Palmilla Enclave that suit this group in mid-June 2026.

SEASONAL CONSTRAINT — do NOT suggest:
whale watching, whale shark tours, gray whale tours, humpback whale tours, manta ray snorkeling tours (these are Dec–Mar season only).

Search broadly across types — outdoor adventure, food and drink, culture, day trips, water activities, nightlife, wellness, etc. — and across a range of energy levels and price points. Do not constrain yourself to any specific category or list of activities.

Return exactly 5 activities as a JSON array (no markdown, no explanation):
[{"title":"...","icon":"(emoji)","cost":"$X/pp or range","duration":"X hours","distance":"X min from Palmilla","description":"2 sentences — what it is and why this group will love it.","tag":"Adventure|Culinary|Culture|Sightseeing|Beach|Wellness|Nightlife","link":"URL to operator site, viator listing, or tourism page — null if none found"}]

Do not invent URLs. Use only links found via search. null is better than a made-up link.
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
        model: "claude-haiku-4-5",
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
      // Fallback: Claude uses training knowledge; null is fine for uncertain links
      message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        messages: [
          {
            role: "user",
            content:
              PROMPT(existingTitles) +
              "\n\n(No live search available — use your training knowledge for descriptions, pricing, and links. Only include a link if you are confident it is a real, current URL for that operator. null is preferred over a guessed link.)",
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
