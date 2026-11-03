import { lookup } from "node:dns/promises";
import net from "node:net";

/**
 * Fetch public web pages only. Submitted websites and links found on pages are
 * untrusted, so every hop (including redirects) is checked against private,
 * loopback, link-local and metadata ranges before the request is made.
 */

const MAX_BYTES = 1_500_000;
const UA =
  "Mozilla/5.0 (compatible; OAuthLaunchpadResearch/1.0; +https://github.com/techi101/oauth-launchpad)";

function ipv4Private(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

export function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) return ipv4Private(ip);
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return ipv4Private(v.slice(7));
  return (
    v === "::" ||
    v === "::1" ||
    v.startsWith("fc") ||
    v.startsWith("fd") ||
    v.startsWith("fe8") ||
    v.startsWith("fe9") ||
    v.startsWith("fea") ||
    v.startsWith("feb")
  );
}

export async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Not a valid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    throw new Error("Only http and https URLs are allowed");
  if (url.username || url.password) throw new Error("Credentials in URLs are not allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal"))
    throw new Error("Private host blocked");
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Private address blocked");
    return url;
  }
  const addrs = await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address)))
    throw new Error("Host resolves to a private address");
  return url;
}

export type FetchedPage = {
  url: string;
  title: string;
  text: string;
  links: { href: string; text: string }[];
  via: "direct" | "reader";
};

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

export function htmlToText(html: string, base: string) {
  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").trim()).slice(0, 200);
  const links: { href: string; text: string }[] = [];
  const linkRe = /<a\b[^>]*href=["']([^"'#]+)[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html)) && links.length < 400) {
    try {
      const href = new URL(decode(m[1]), base).toString();
      const text = decode(m[2].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim().slice(0, 120);
      if (href.startsWith("http")) links.push({ href, text });
    } catch {
      /* ignore bad href */
    }
  }
  const text = decode(
    html
      .replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
  return { title, text, links };
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    chunks.push(value);
    if (size > MAX_BYTES) {
      await reader.cancel();
      break;
    }
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

async function directFetch(raw: string, timeoutMs: number): Promise<{ finalUrl: string; body: string; type: string }> {
  let current = raw;
  for (let hop = 0; hop < 5; hop++) {
    const url = await assertPublicUrl(current);
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "user-agent": UA, accept: "text/html,text/plain,application/xhtml+xml,*/*;q=0.5" },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, url).toString();
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { finalUrl: url.toString(), body: await readCapped(res), type: res.headers.get("content-type") ?? "" };
  }
  throw new Error("Too many redirects");
}

/** Jina Reader renders JS-heavy docs sites; used only when the direct HTML is near-empty. */
async function readerFetch(raw: string, timeoutMs: number): Promise<FetchedPage | null> {
  if (process.env.READER_FALLBACK === "off") return null;
  await assertPublicUrl(raw);
  const res = await fetch(`https://r.jina.ai/${raw}`, {
    headers: {
      accept: "text/plain",
      "x-return-format": "markdown",
      ...(process.env.JINA_API_KEY ? { authorization: `Bearer ${process.env.JINA_API_KEY}` } : {}),
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) return null;
  const md = await readCapped(res);
  const title = md.match(/^Title:\s*(.+)$/m)?.[1]?.trim() ?? "";
  const links: { href: string; text: string }[] = [];
  const re = /\[([^\]]{0,120})\]\((https?:\/\/[^)\s]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md)) && links.length < 400) links.push({ text: m[1], href: m[2] });
  const text = md.replace(/\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, "$1").replace(/!\[[^\]]*\]/g, "");
  return { url: raw, title, text, links, via: "reader" };
}

export async function fetchPage(raw: string, timeoutMs = 12000): Promise<FetchedPage> {
  let page: FetchedPage | null = null;
  let err: unknown = null;
  try {
    const r = await directFetch(raw, timeoutMs);
    if (/html|xml/.test(r.type) || r.body.trimStart().startsWith("<")) {
      const p = htmlToText(r.body, r.finalUrl);
      page = { url: r.finalUrl, ...p, via: "direct" };
    } else {
      page = { url: r.finalUrl, title: "", text: r.body, links: [], via: "direct" };
    }
  } catch (e) {
    err = e;
  }
  if (!page || page.text.length < 1200) {
    try {
      const rp = await readerFetch(page?.url ?? raw, timeoutMs + 8000);
      if (rp && rp.text.length > (page?.text.length ?? 0)) page = rp;
    } catch {
      /* keep direct result */
    }
  }
  if (!page) throw err instanceof Error ? err : new Error("Fetch failed");
  return page;
}
