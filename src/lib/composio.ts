import snapshot from "../../data/composio-toolkits.json";

/**
 * Composio facts for a provider, from a dated snapshot of Composio's public
 * toolkit data (docs.composio.dev/data/toolkits.json, the file behind the
 * managed-OAuth directory), its own-app guide index (composio.dev/auth) and
 * GitHub issue titles. Rebuild with scripts/build-composio-snapshot.py.
 */

export const MANAGED_URL = "https://docs.composio.dev/toolkits/managed-auth";
export const V3_CALLBACK = "https://backend.composio.dev/api/v3/toolkits/auth/callback";
export const V1_CALLBACK = "https://backend.composio.dev/api/v1/auth-apps/add";
export const WHITE_LABEL_URL = "https://docs.composio.dev/docs/authentication/white-labeling-authentication";
export const CUSTOM_VS_MANAGED_URL = "https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app";
export const PRICING_URL = "https://composio.dev/pricing";

export type ComposioToolkit = (typeof snapshot.toolkits)[number];
export const SNAPSHOT = snapshot;

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");
const ALIASES: Record<string, string> = {
  googlemail: "gmail",
  microsoftoutlook: "outlook",
  googlecalendar: "googlecalendar",
  googledrive: "googledrive",
  x: "twitter",
};

export function findToolkit(providerName: string, catalogKey?: string): ComposioToolkit | undefined {
  const keys = [providerName, catalogKey ?? ""].map(norm).filter((k) => k.length >= 1);
  const want = new Set(keys.flatMap((k) => [k, ALIASES[k] ?? k]));
  return (
    snapshot.toolkits.find((t) => want.has(norm(t.slug)) || want.has(norm(t.name))) ??
    snapshot.toolkits.find((t) => keys.some((k) => k.length >= 4 && norm(t.name).startsWith(k)))
  );
}

export type ManagedResult = {
  status: "available" | "not_listed" | "unknown";
  toolkit?: { name: string; slug: string };
  count: number;
  intro: string;
};

/** Kept async so callers don't care whether the data is a snapshot or live. */
export async function checkManaged(providerName: string, catalogKey?: string): Promise<ManagedResult> {
  const t = findToolkit(providerName, catalogKey);
  const count = snapshot.stats.managed;
  if (!t) return { status: "unknown", count, intro: "" };
  return {
    status: t.managed ? "available" : "not_listed",
    toolkit: { name: t.name, slug: t.slug },
    count,
    intro: t.managed ? "" : `${t.name} is listed under "Bring your own OAuth app".`,
  };
}

/** Kept for the test of the old reader-based parser (Composio's rendered list format). */
export function parseManagedList(md: string): { name: string; slug: string }[] {
  const list: { name: string; slug: string }[] = [];
  const re = /\)\s*([^\][]+?)\s+[A-Z0-9_]+\]\(https:\/\/docs\.composio\.dev\/toolkits\/([a-z0-9_]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) list.push({ name: m[1].trim(), slug: m[2] });
  return list;
}
