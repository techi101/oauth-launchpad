import { publicOrigin } from "@/lib/origin";
import { CURATED } from "@/lib/seeds";
import { listGenerated, toCard } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const cards = [...CURATED.map(toCard), ...(await listGenerated(50))];
  const body = `# OAuth Launchpad

> OAuth app setup and approval guides for AI agent builders: route (Composio-managed vs your own app), developer effort vs provider review wait, scopes, checklist with owners, blockers, and quote-checked evidence.

## How to use (agents)
- List guides: ${origin}/api/guides (optional ?q=<app>)
- One guide as JSON: ${origin}/g/<id>/json ; as Markdown: ${origin}/g/<id>/md
- Generate a new guide: POST ${origin}/api/research {"provider": "<app or website>", "actions": "<what the agent does>", "audience": "personal|internal|external"}; response is NDJSON events ending in {"type":"saved","id":"<id>"}.
- Evidence labels: observed, documented (quote checked against official page), secondary, inferred, unverified. Treat unverified claims as unknown.

## Guides
${cards.map((c) => `- [${c.name}: ${c.actions}](${origin}/g/${c.id}/md)`).join("\n")}

## Coverage
- ${origin}/coverage : Composio OAuth toolkits that need your own app, which have guides, and what to cover next
`;
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } });
}
