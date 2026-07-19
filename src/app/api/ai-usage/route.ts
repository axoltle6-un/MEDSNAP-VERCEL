import { NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync } from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USAGE_FILE = "/tmp/medsnap-ai-usage.json";

interface UsageData {
  mistral: { calls: number; tokens: number; lastUsed: string | null };
  llm7: { calls: number; tokens: number; lastUsed: string | null };
  verified: { calls: number; lastUsed: string | null };
  total: { calls: number; lastUsed: string | null };
}

function getUsage(): UsageData {
  try {
    if (existsSync(USAGE_FILE)) {
      const raw = readFileSync(USAGE_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch {}
  return {
    mistral: { calls: 0, tokens: 0, lastUsed: null },
    llm7: { calls: 0, tokens: 0, lastUsed: null },
    verified: { calls: 0, lastUsed: null },
    total: { calls: 0, lastUsed: null },
  };
}

function saveUsage(data: UsageData) {
  try {
    writeFileSync(USAGE_FILE, JSON.stringify(data, null, 2));
  } catch {}
}

/** Record a usage event (called from AI search route) */
export function recordUsage(
  provider: "mistral" | "llm7" | "verified",
  tokens: number = 0
) {
  try {
    const usage = getUsage();
    const now = new Date().toISOString();
    usage[provider].calls++;
    if ("tokens" in usage[provider]) {
      (usage[provider] as any).tokens += tokens;
    }
    usage[provider].lastUsed = now;
    usage.total.calls++;
    usage.total.lastUsed = now;
    saveUsage(usage);
    console.log(`[usage] ${provider} call recorded. Total: ${usage[provider].calls} calls`);
  } catch (e) {
    console.error("[usage] Failed to record:", e);
  }
}

export async function GET() {
  const usage = getUsage();
  return NextResponse.json(
    {
      ...usage,
      mistralFreeLimit: "1000 calls/month (Mistral free tier)",
      llm7FreeLimit: "Unlimited (free tier)",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}

/** Reset usage (for testing) */
export async function DELETE() {
  saveUsage({
    mistral: { calls: 0, tokens: 0, lastUsed: null },
    llm7: { calls: 0, tokens: 0, lastUsed: null },
    verified: { calls: 0, lastUsed: null },
    total: { calls: 0, lastUsed: null },
  });
  return NextResponse.json({ success: true, message: "Usage reset" });
}
