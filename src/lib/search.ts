/**
 * Optional web search. Research works without it (catalog + official-domain
 * discovery + link following), but a search key widens discovery for
 * providers outside the catalog. Set one of TAVILY_API_KEY or BRAVE_API_KEY.
 */

export type Hit = { url: string; title: string };

export function searchConfigured() {
  return Boolean(process.env.TAVILY_API_KEY || process.env.BRAVE_API_KEY);
}

export async function search(q: string): Promise<Hit[]> {
  if (process.env.TAVILY_API_KEY) {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${process.env.TAVILY_API_KEY}` },
      body: JSON.stringify({ query: q, max_results: 6 }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
    const d = await res.json();
    return (d.results ?? []).map((r: { url: string; title: string }) => ({ url: r.url, title: r.title }));
  }
  if (process.env.BRAVE_API_KEY) {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(q)}&count=6`, {
      headers: { accept: "application/json", "x-subscription-token": process.env.BRAVE_API_KEY },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`Brave HTTP ${res.status}`);
    const d = await res.json();
    return (d.web?.results ?? []).map((r: { url: string; title: string }) => ({ url: r.url, title: r.title }));
  }
  return [];
}
