/**
 * Minimal JSON-mode model client. Gemini first (models from GEMINI_MODELS),
 * DeepSeek as fallback. Keys stay server-side.
 */

export type LlmResult = { json: unknown; model: string };

const DEFAULT_MODELS = "gemini-3.5-flash,gemini-3.8-flash,gemini-flash-latest";
// Tried only after DeepSeek: fast and usually available, but weaker at long structured drafting.
const LAST_RESORT = process.env.GEMINI_LAST_RESORT ?? "gemini-3.1-flash-lite";

export function llmConfigured() {
  return Boolean(process.env.GEMINI_API_KEY || process.env.DEEPSEEK_API_KEY);
}

function extractJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(t.slice(start, end + 1));
    throw new Error("Model did not return JSON");
  }
}

async function gemini(model: string, system: string, user: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 16000,
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
      signal: AbortSignal.timeout(timeoutMs),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${model} HTTP ${res.status}`);
  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? [])
    .map((p: { text?: string; thought?: boolean }) => (p.thought ? "" : p.text ?? ""))
    .join("");
  if (!text) throw new Error(`Gemini ${model} returned no text`);
  return extractJson(text);
}

async function deepseek(system: string, user: string, timeoutMs: number): Promise<unknown> {
  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      temperature: 0.2,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
  const data = await res.json();
  return extractJson(data?.choices?.[0]?.message?.content ?? "");
}

/** All attempts (Gemini rotation, DeepSeek, last resort) share one deadline: the call never runs past timeoutMs. */
export async function llmJson(system: string, user: string, timeoutMs = 90000): Promise<LlmResult> {
  const errors: string[] = [];
  const started = Date.now();
  const left = () => timeoutMs - (Date.now() - started);
  if (process.env.GEMINI_API_KEY) {
    const models = (process.env.GEMINI_MODELS || DEFAULT_MODELS)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // Free-tier models return 503/429 under load: try each model, retry the list once after a pause.
    const reserve = process.env.DEEPSEEK_API_KEY ? Math.min(60000, timeoutMs / 2) : 0; // leave time for the fallback
    const passes = process.env.DEEPSEEK_API_KEY ? 2 : 6;
    for (let pass = 0; pass < passes; pass++) {
      for (const m of models) {
        const remaining = timeoutMs - reserve - (Date.now() - started);
        if (remaining < 8000) break;
        try {
          return { json: await gemini(m, system, user, remaining), model: m };
        } catch (e) {
          errors.push(String((e as Error).message));
        }
      }
      const wait = [2500, 5000, 8000, 10000, 12000][pass] ?? 12000;
      if (timeoutMs - reserve - (Date.now() - started) < wait + 8000) break;
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  if (process.env.DEEPSEEK_API_KEY && left() >= 8000) {
    try {
      return { json: await deepseek(system, user, left()), model: "deepseek-chat" };
    } catch (e) {
      errors.push(String((e as Error).message));
    }
  }
  if (process.env.GEMINI_API_KEY && LAST_RESORT && left() >= 8000) {
    try {
      return { json: await gemini(LAST_RESORT, system, user, left()), model: LAST_RESORT };
    } catch (e) {
      errors.push(String((e as Error).message));
    }
  }
  if (llmConfigured() && left() < 8000) errors.push(`Model calls stopped at the ${Math.round(timeoutMs / 1000)}s deadline`);
  throw new Error(errors.length ? [...new Set(errors)].join("; ") : "No model API key configured");
}
