/**
 * Does Composio already provide the OAuth app for this toolkit?
 * Reads Composio's public "Managed OAuth apps" directory (JS-rendered, so via
 * the reader) and matches the provider against the "Composio-managed OAuth
 * available" list. Not being listed does NOT prove the toolkit is BYO-only
 * (it may be missing from Composio entirely); the guide says which.
 */

export const MANAGED_URL = "https://docs.composio.dev/toolkits/managed-auth";

export type ManagedResult = {
  status: "available" | "not_listed" | "unknown";
  toolkit?: { name: string; slug: string };
  count: number;
  intro: string;
};

/** Toolkit entries rendered as "[![logo](...) Name SLUG](https://docs.composio.dev/toolkits/slug)". */
export function parseManagedList(md: string): { name: string; slug: string }[] {
  const list: { name: string; slug: string }[] = [];
  const re = /\)\s*([^\]\[]+?)\s+[A-Z0-9_]+\]\(https:\/\/docs\.composio\.dev\/toolkits\/([a-z0-9_]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) list.push({ name: m[1].trim(), slug: m[2] });
  return list;
}

let cache: { at: number; list: { name: string; slug: string }[]; intro: string } | null = null;
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function load() {
  if (cache && Date.now() - cache.at < 6 * 3600_000) return cache;
  const res = await fetch(`https://r.jina.ai/${MANAGED_URL}`, {
    headers: {
      accept: "text/plain",
      ...(process.env.JINA_API_KEY ? { authorization: `Bearer ${process.env.JINA_API_KEY}` } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Composio directory HTTP ${res.status}`);
  const md = await res.text();
  const list = parseManagedList(md);
  const intro =
    md.match(/Composio can provide the OAuth app[^\n]*/)?.[0] ??
    "Composio can provide the OAuth app that your users authorize when they connect a toolkit.";
  if (list.length < 50) throw new Error("Composio directory format changed");
  cache = { at: Date.now(), list, intro };
  return cache;
}

export async function checkManaged(providerName: string, catalogKey?: string): Promise<ManagedResult> {
  try {
    const { list, intro } = await load();
    const keys = [providerName, catalogKey ?? "", providerName.replace(/\s*\(.*\)$/, "")]
      .map(norm)
      .filter((k) => k.length >= 3);
    const aliases: Record<string, string> = { googlemail: "gmail", microsoftoutlook: "outlook" };
    const want = new Set(keys.flatMap((k) => [k, aliases[k] ?? k]));
    const hit = list.find((t) => want.has(norm(t.name)) || want.has(norm(t.slug)));
    return { status: hit ? "available" : "not_listed", toolkit: hit, count: list.length, intro };
  } catch {
    return { status: "unknown", count: 0, intro: "" };
  }
}
