import { findToolkit, SNAPSHOT } from "@/lib/composio";
import { freshness } from "@/lib/freshness";
import { getGuide } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Machine-readable guide for agents: the stored guide plus Composio facts and review dates. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await getGuide(id);
  if (!g) return Response.json({ error: "not found" }, { status: 404 });
  const t = findToolkit(g.provider.name);
  return Response.json(
    {
      ...g,
      freshness: freshness(g),
      composio: t
        ? {
            snapshot: SNAPSHOT.retrieved,
            slug: t.slug,
            managed: t.managed,
            requiredFields: t.requiredFields,
            defaultRedirect: t.defaultRedirect,
            defaultScopeCount: t.defaultScopes.length,
            composioGuide: t.composioGuide || null,
            knownIssues: t.issues,
          }
        : null,
    },
    { headers: { "access-control-allow-origin": "*", "cache-control": "public, max-age=300" } },
  );
}
