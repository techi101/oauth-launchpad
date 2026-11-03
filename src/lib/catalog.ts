import { parse } from "yaml";

/**
 * Discovery hints from Nango's open-source provider catalog (Elastic License
 * 2.0; read at runtime for doc links, not redistributed). It tells us a
 * provider's auth mode, OAuth endpoints and documentation URLs. It does NOT
 * prove approval requirements; research still has to read the provider docs.
 */

const CATALOG_URL =
  "https://raw.githubusercontent.com/NangoHQ/nango/master/packages/providers/providers.yaml";

export type CatalogEntry = {
  key: string;
  displayName: string;
  authMode: string;
  docs: string[];
  authorizationUrl?: string;
  domains: string[];
};

let cache: { at: number; entries: CatalogEntry[] } | null = null;

function hostOf(u?: string) {
  if (!u) return "";
  try {
    return new URL(u.replace(/\$\{[^}]+\}/g, "x")).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function loadCatalog(): Promise<CatalogEntry[]> {
  if (cache && Date.now() - cache.at < 6 * 3600_000) return cache.entries;
  const res = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Catalog HTTP ${res.status}`);
  const raw = parse(await res.text()) as Record<string, Record<string, unknown>>;
  const entries: CatalogEntry[] = [];
  for (const [key, v] of Object.entries(raw ?? {})) {
    if (!v || typeof v !== "object") continue;
    const docs = [v.docs, v.docs_connect, v.setup_guide_url]
      .filter((d): d is string => typeof d === "string" && d.startsWith("http"));
    const authorizationUrl = typeof v.authorization_url === "string" ? v.authorization_url : undefined;
    const domains = [authorizationUrl, typeof v.token_url === "string" ? v.token_url : undefined]
      .map(hostOf)
      .filter(Boolean);
    entries.push({
      key,
      displayName: String(v.display_name ?? key),
      authMode: String(v.auth_mode ?? "unknown"),
      docs,
      authorizationUrl,
      domains,
    });
  }
  cache = { at: Date.now(), entries };
  return entries;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Returns matching entries, best first. Prefers OAuth2 entries. */
export function matchCatalog(entries: CatalogEntry[], name: string, website?: string): CatalogEntry[] {
  const n = norm(name);
  const site = hostOf(website);
  const siteRoot = site.split(".").slice(-2).join(".");
  const scored: { e: CatalogEntry; s: number }[] = [];
  for (const e of entries) {
    let s = 0;
    const dn = norm(e.displayName);
    const k = norm(e.key);
    if (n && (dn === n || k === n)) s += 100;
    else if (n && n.length >= 3 && (dn.startsWith(n) || k.startsWith(n))) s += 40;
    else if (n && n.length >= 4 && (dn.includes(n) || k.includes(n))) s += 15;
    if (siteRoot && e.domains.some((d) => d.endsWith(siteRoot))) s += 80;
    if (siteRoot && e.docs.some((d) => hostOf(d).endsWith(siteRoot))) s += 20;
    if (s === 0) continue;
    if (e.authMode === "OAUTH2") s += 5;
    scored.push({ e, s });
  }
  return scored.sort((a, b) => b.s - a.s).map((x) => x.e).slice(0, 8);
}
