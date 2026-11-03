import { z } from "zod";
import { runResearch, type ResearchEvent } from "@/lib/research";
import { llmConfigured } from "@/lib/llm";
import { saveGuide } from "@/lib/store";
import { Audience } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const Body = z.object({
  provider: z.string().trim().min(2).max(80),
  website: z.string().trim().max(200).optional().default(""),
  actions: z.string().trim().min(3).max(300),
  audience: Audience,
  catalogKey: z.string().max(80).regex(/^[a-z0-9_.-]*$/i).optional(),
  baseGuideId: z.string().max(80).regex(/^[a-z0-9-]*$/).optional(),
});

// Light per-instance limiter so one visitor cannot drain the model quota.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 6;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Enter an app name, what your agent should do, and who will use it." }, { status: 400 });
  if (!llmConfigured())
    return Response.json({ error: "Live research is not configured on this deployment (no model API key). Starter guides still work." }, { status: 503 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (limited(ip)) return Response.json({ error: "Too many research runs. Try again in a few minutes." }, { status: 429 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ResearchEvent | { type: "saved"; id: string }) => {
        try {
          controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
        } catch {
          /* client went away */
        }
      };
      try {
        const guide = await runResearch(parsed.data, (e) => {
          if (e.type !== "done") send(e);
        });
        if (guide) {
          try {
            await saveGuide(guide);
            send({ type: "saved", id: guide.id });
          } catch (e) {
            send({ type: "error", text: `The guide was researched but could not be saved: ${(e as Error).message}` });
          }
        }
      } catch (e) {
        send({ type: "error", text: `Research failed: ${(e as Error).message}` });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" },
  });
}
