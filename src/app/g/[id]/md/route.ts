import { getGuide } from "@/lib/store";
import { toMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await getGuide(id);
  if (!g) return new Response("Not found", { status: 404 });
  const pub = req.headers.get("x-public-origin");
  const base = pub && /^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(pub) ? pub : req.url;
  const url = new URL(`/g/${id}`, base).toString();
  return new Response(toMarkdown(g, url), {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${id}-oauth-guide.md"`,
    },
  });
}
