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

    const prompt = `You are helping plan a 6-night Los Cabos trip at Villa Dos Mares, Palmilla Enclave (Km 27.5 Carretera Transpeninsular — San José del Cabo is ~10 min east, Cabo San Lucas is ~30 min west), June 2026, group of ~8 adults.

${hasTavily ? "Use the search tool to find real booking pages and current pricing for each activity. Search for direct booking URLs — not aggregators or search engine results pages." : ""}

Suggest 5 unique activity ideas. Return ONLY a valid JSON array with no markdown:
[{"title":"...","icon":"(single emoji)","cost":"$X/pp or FREE","duration":"...","distance":"... from Palmilla","description":"1-2 sentences.","tag":"Culinary|Sightseeing|Culture|Adventure","link":"(real direct booking URL — not a search engine)"}]
Avoid duplicating these existing ideas: ${existingTitles || "none yet"}.`;

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
        messages: [{ role: "user", content: prompt }],
        betas: ["mcp-client-2025-04-04"],
      });
    } else {
      message = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });
    }

    // Find the final text block — MCP responses include tool_use blocks, skip them
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
