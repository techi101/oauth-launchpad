import { publicOrigin } from "@/lib/origin";
import { findToolkit } from "@/lib/composio";
import { freshness } from "@/lib/freshness";
import { CURATED } from "@/lib/seeds";
import { listGenerated, toCard } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Index of all guides for agents: GET /api/guides?q=slack */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.toLowerCase() ?? "";
  const origin = publicOrigin(req);
  const cards = [...CURATED.map(toCard), ...(await listGenerated(100))]
    .filter((c) => !q || `${c.name} ${c.actions}`.toLowerCase().includes(q))
    .map((c) => ({
      ...c,
      composioManaged: findToolkit(c.name)?.managed ?? null,
      freshness: freshness({ id: c.id, createdAt: c.createdAt }),
      url: `${origin}/g/${c.id}`,
      json: `${origin}/g/${c.id}/json`,
      markdown: `${origin}/g/${c.id}/md`,
    }));
  return Response.json({ count: cards.length, guides: cards }, { headers: { "access-control-allow-origin": "*" } });
}
