#!/usr/bin/env node
// Helper script: reads input from stdin, calls AI API, outputs response to stdout
//
// Strategy (all FREE models, no credits needed):
// - Text-only searches → LLM7.io codestral-latest (free, fast, reliable)
// - Photo searches → OpenRouter nvidia/nemotron-nano-12b-v2-vl:free (free vision model)
//
// Input JSON: { systemPrompt, userMessage, images?: [dataUrl1, ...] }
const fs = require("fs");

async function main() {
  const input = await new Promise((resolve) => {
    let data = "";
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
  });

  const { systemPrompt, userMessage, images } = JSON.parse(input);

  // Read API keys from .z-ai-config
  let llm7Key = null;
  let openrouterKey = null;
  const configPaths = [
    "/home/z/my-project/.z-ai-config",
    process.env.HOME + "/.z-ai-config",
    "/etc/.z-ai-config",
  ];
  for (const p of configPaths) {
    try {
      const raw = fs.readFileSync(p, "utf-8");
      const config = JSON.parse(raw);
      if (config.apiKey && config.apiKey !== "YOUR_API_KEY_HERE") {
        llm7Key = config.apiKey;
      }
    } catch {}
  }

  // Also check for OpenRouter key in env or a separate config
  openrouterKey = process.env.OPENROUTER_API_KEY || "";

  const hasImages = images && images.length > 0;

  let result;
  if (hasImages && openrouterKey) {
    // Use OpenRouter free vision model for photo searches
    console.error("[ai-helper] Using OpenRouter nemotron (free vision) for photo search");
    result = await callOpenRouter(openrouterKey, systemPrompt, userMessage, images);
  } else if (llm7Key) {
    // Use LLM7 codestral (free text-only) for text searches
    console.error("[ai-helper] Using LLM7 codestral (free text) for text search");
    result = await callLLM7(llm7Key, systemPrompt, userMessage);
  } else {
    process.stderr.write("No API key found.");
    process.exit(1);
  }

  if (result.error) {
    process.stderr.write(result.error);
    process.exit(1);
  }

  process.stdout.write(result.content);
}

/**
 * Call LLM7.io codestral-latest (free, text-only)
 */
async function callLLM7(apiKey, systemPrompt, userMessage) {
  const apiUrl = "https://api.llm7.io/v1/chat/completions";
  const model = "codestral-latest";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { error: `LLM7 API error ${res.status}: ${errText.slice(0, 300)}` };
  }

  const json = await res.json();
  let out = json.choices?.[0]?.message?.content || "";
  out = out.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(out);
    return { content: JSON.stringify(parsed) };
  } catch {
    return { content: out };
  }
}

/**
 * Call OpenRouter nvidia/nemotron-nano-12b-v2-vl:free (free vision model)
 */
async function callOpenRouter(apiKey, systemPrompt, userMessage, images) {
  const apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  const model = "nvidia/nemotron-nano-12b-v2-vl:free";

  // Build message with text + images
  const userContent = [
    { type: "text", text: userMessage },
    ...images.slice(0, 2).map((url) => ({
      type: "image_url",
      image_url: { url },
    })),
  ];

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://medsnap.app",
      "X-Title": "MedSnap",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { error: `OpenRouter API error ${res.status}: ${errText.slice(0, 300)}` };
  }

  const json = await res.json();
  let out = json.choices?.[0]?.message?.content || "";
  out = out.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();

  try {
    const parsed = JSON.parse(out);
    return { content: JSON.stringify(parsed) };
  } catch {
    return { content: out };
  }
}

main().catch((e) => {
  process.stderr.write(e.message || String(e));
  process.exit(1);
});
