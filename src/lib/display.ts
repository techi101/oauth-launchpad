import { getDomain } from "tldts";
import type { Guide } from "./schema";

/** Registrable domain for the provider (used for its logo). */
export function domainOf(g: Pick<Guide, "provider" | "sources">): string {
  const cands = [g.provider.website, g.provider.developerPortal, ...g.sources.filter((s) => s.type === "official").map((s) => s.url)];
  for (const c of cands) {
    if (!c) continue;
    const d = getDomain(c.startsWith("http") ? c : `https://${c}`);
    if (d) return d;
  }
  return "";
}

/** Brand domains where the docs domain is not the brand (e.g. LinkedIn docs live on microsoft.com). */
const BRAND_DOMAIN: Record<string, string> = {
  linkedin: "linkedin.com",
  "microsoft outlook": "outlook.com",
  outlook: "outlook.com",
  "google drive": "drive.google.com",
  "google calendar": "calendar.google.com",
  gmail: "mail.google.com",
  "gmail (google)": "mail.google.com",
  instagram: "instagram.com",
  "x (twitter)": "x.com",
  x: "x.com",
  jira: "atlassian.com",
  "quickbooks online": "quickbooks.intuit.com",
  shopify: "shopify.com",
};

export function logoDomain(name: string, fallback: string) {
  return BRAND_DOMAIN[name.toLowerCase()] ?? fallback;
}

/** Google's favicon service returns the same "G" for every Google product, so those use Google's own product icons. */
const PRODUCT_ICON: Record<string, string> = {
  "mail.google.com": "https://ssl.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png",
  "calendar.google.com": "https://ssl.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png",
  "drive.google.com": "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
};

export const logoUrl = (domain: string) =>
  PRODUCT_ICON[domain] ?? (domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : "");

const NUM: Record<string, string> = { one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10" };
const n = (x: string) => NUM[x.toLowerCase()] ?? x;
const UNIT = String.raw`(minutes?|mins?|hours?|hrs?|business days?|working days?|days?|weeks?|months?)`;
const W = String.raw`(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)`;

function unitWord(u: string, plural: boolean) {
  const base = u.toLowerCase().replace(/^hrs?$/, "hour").replace(/^mins?$/, "minute").replace(/s$/, "");
  return plural ? `${base}s` : base;
}
const RANK = (u: string) => (/month/i.test(u) ? 5 : /week/i.test(u) ? 4 : /day/i.test(u) ? 3 : /hour|hr/i.test(u) ? 2 : 1);

type Dur = { label: string; rank: number; at: number; range: boolean };

/** Every duration mentioned in the text, e.g. "2–4 hours", "Up to 6 weeks", "Several weeks". */
function durations(text: string): Dur[] {
  const t = text.replace(/[–—]/g, "-");
  const out: Dur[] = [];
  const add = (re: RegExp, label: (m: RegExpMatchArray) => string, unit: (m: RegExpMatchArray) => string, range = false) => {
    for (const m of t.matchAll(re)) out.push({ label: label(m), rank: RANK(unit(m)), at: m.index ?? 0, range });
  };
  add(new RegExp(String.raw`${W}\s*(?:-|to)\s*${W}\s*${UNIT}\b`, "gi"), (m) => `${n(m[1])}–${n(m[2])} ${unitWord(m[3], true)}`, (m) => m[3], true);
  add(new RegExp(String.raw`up to\s+${W}\s*${UNIT}\b`, "gi"), (m) => `Up to ${n(m[1])} ${unitWord(m[2], n(m[1]) !== "1")}`, (m) => m[2], true);
  add(/\b(several|a few|many)\s+(weeks|months)\b/gi, (m) => `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} ${m[2].toLowerCase()}`, (m) => m[2], true);
  add(/\b(an?)\s+(hour|day|week|month)\b/gi, (m) => `About 1 ${m[2].toLowerCase()}`, (m) => m[2]);
  add(new RegExp(String.raw`\b${W}\s+${UNIT}\b`, "gi"), (m) => `${n(m[1])} ${unitWord(m[2], n(m[1]) !== "1")}`, (m) => m[2]);
  // A single number inside a range we already captured ("2-4 hours" also matches "4 hours") is dropped.
  return out.filter((d) => d.range || !out.some((o) => o.range && d.at >= o.at && d.at <= o.at + o.label.length + 6));
}

/** "about 2-4 hours to register..." -> "2–4 hours" (first duration mentioned). */
export function shortDuration(text: string): string {
  return durations(text).sort((a, b) => a.at - b.at)[0]?.label ?? "";
}

export function shortWork(text: string) {
  const d = shortDuration(text);
  if (d) return d;
  if (/\bdays\b/i.test(text)) return "Hours to days";
  if (/\bhours?\b/i.test(text)) return "A few hours";
  return "See guide";
}

/** The longest wait mentioned: a review that "can take several weeks" beats "2-3 business days" for another step. */
export function shortWait(text: string) {
  if (/no (app )?review (is )?(needed|required)/i.test(text)) return "No review to start";
  const ds = durations(text).sort((a, b) => b.rank - a.rank || a.at - b.at);
  if (ds.length) return ds[0].label;
  if (/not publish|not stated|could not|couldn't|no published|does not state|not verified/i.test(text)) return "Not published";
  return text.trim() ? "Varies" : "Not published";
}

/** First sentence, trimmed for cards. */
export function firstSentence(text: string, max = 120) {
  const parts = text.split(/(?<=[.!?])\s/);
  let s = parts[0] ?? text;
  // "Customer organizations. New orgs have..." -> a heading-like fragment; keep the next sentence too.
  if (s.split(/\s+/).length < 5 && parts[1]) s = `${s} ${parts[1]}`;
  s = s.trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

export const EFFORT = {
  low: { label: "Low effort", short: "Low", dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", text: "text-emerald-600" },
  medium: { label: "Medium effort", short: "Medium", dot: "bg-amber-500", pill: "bg-amber-50 text-amber-800 ring-amber-600/20", text: "text-amber-600" },
  high: { label: "High effort", short: "High", dot: "bg-rose-500", pill: "bg-rose-50 text-rose-700 ring-rose-600/20", text: "text-rose-600" },
  unknown: { label: "Unknown", short: "Unknown", dot: "bg-slate-400", pill: "bg-slate-50 text-slate-600 ring-slate-500/20", text: "text-slate-500" },
} as const;

export const ROUTE_SHORT: Record<string, string> = { managed: "Use a managed app", own_app: "Register your own app", unresolved: "Unclear" };
