import { describe, expect, it } from "vitest";
import { assertPublicUrl, htmlToText, isPrivateIp, looksLikeErrorPage } from "./safeFetch";
import { quoteSupported, rootOf, scrub } from "./research";
import { matchCatalog, type CatalogEntry } from "./catalog";
import { Guide } from "./schema";
import { findToolkit, parseManagedList, SNAPSHOT } from "./composio";
import { freshness } from "./freshness";
import { toMarkdown } from "./markdown";
import github from "../../data/seeds/github.json";
import slack from "../../data/seeds/slack.json";
import gmail from "../../data/seeds/gmail.json";

describe("SSRF guard", () => {
  it("flags private and metadata addresses", () => {
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.20.0.1", "169.254.169.254", "::1", "fd00::1", "::ffff:127.0.0.1", "0.0.0.0"])
      expect(isPrivateIp(ip)).toBe(true);
    for (const ip of ["8.8.8.8", "140.82.112.3", "2606:4700::1111"]) expect(isPrivateIp(ip)).toBe(false);
  });
  it("rejects non-http schemes, localhost and literal private IPs", async () => {
    await expect(assertPublicUrl("file:///etc/passwd")).rejects.toThrow();
    await expect(assertPublicUrl("http://localhost:3000")).rejects.toThrow();
    await expect(assertPublicUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow();
    await expect(assertPublicUrl("http://user:pw@example.com")).rejects.toThrow();
  });
});

describe("quote verification", () => {
  const page =
    "If your app requests restricted scopes, it must undergo a security assessment by an independent assessor before it can be used by the public.";
  it("accepts verbatim quotes with different punctuation/case", () => {
    expect(quoteSupported("it must undergo a Security Assessment by an independent assessor", page)).toBe(true);
  });
  it("rejects invented quotes", () => {
    expect(quoteSupported("review is completed within 3 to 5 business days by our team", page)).toBe(false);
    expect(quoteSupported("short", page)).toBe(false);
  });
  it("rejects a real quote with an invented sentence appended", () => {
    const real = "it must undergo a Security Assessment by an independent assessor";
    expect(quoteSupported(`${real}. The assessment costs $99 and takes one day.`, page)).toBe(false);
    expect(quoteSupported(`${real}, which costs $99`, page)).toBe(false);
  });
  it("accepts real excerpts joined by an ellipsis, but not an invented excerpt", () => {
    const words = page.split(/\s+/);
    const a = words.slice(0, 6).join(" ");
    const b = "it must undergo a Security Assessment";
    expect(quoteSupported(`${a} ... ${b}`, page)).toBe(true);
    expect(quoteSupported(`${a} ... the review is free for every app`, page)).toBe(false);
  });
});

describe("official domain matching", () => {
  it("uses the public suffix list", () => {
    expect(rootOf("developer.xero.co.uk")).toBe("xero.co.uk");
    expect(rootOf("www.bbc.co.uk")).toBe("bbc.co.uk");
    expect(rootOf("developer.xero.co.uk")).not.toBe(rootOf("www.bbc.co.uk"));
    expect(rootOf("developers.notion.com")).toBe("notion.com");
    expect(rootOf("someone.github.io")).not.toBe(rootOf("other.github.io"));
  });
});

describe("error page detection", () => {
  it("flags soft-404 pages", () => {
    expect(looksLikeErrorPage({ title: "Page Not Found | Calendly", text: "x".repeat(5000) })).toBe(true);
    expect(looksLikeErrorPage({ title: "Calendly", text: "Sorry, this page doesn't exist. Go back home." })).toBe(true);
  });
  it("keeps real docs pages that mention 404 errors", () => {
    const docs = "OAuth scopes and errors. ".repeat(40) + " A 404 Not Found response means the event no longer exists.";
    expect(looksLikeErrorPage({ title: "Errors | Calendly Developer", text: docs })).toBe(false);
  });
});

describe("html extraction", () => {
  it("drops scripts and resolves links", () => {
    const r = htmlToText('<title>T</title><script>evil()</script><p>Hello <a href="/docs/oauth">OAuth docs</a></p>', "https://x.com/a");
    expect(r.title).toBe("T");
    expect(r.text).not.toContain("evil");
    expect(r.links[0]).toEqual({ href: "https://x.com/docs/oauth", text: "OAuth docs" });
  });
});

describe("catalog matching", () => {
  const e = (key: string, displayName: string, domains: string[] = []): CatalogEntry => ({ key, displayName, authMode: "OAUTH2", docs: [], domains });
  const cat = [e("google-mail", "Gmail", ["accounts.google.com"]), e("slack", "Slack", ["slack.com"]), e("zoho-crm", "Zoho CRM"), e("zoho-mail", "Zoho Mail")];
  it("prefers exact names and website domains", () => {
    expect(matchCatalog(cat, "Slack")[0].key).toBe("slack");
    expect(matchCatalog(cat, "mail", "https://google.com")[0].key).toBe("google-mail");
  });
  it("returns several candidates for ambiguous names", () => {
    expect(matchCatalog(cat, "zoho").length).toBe(2);
  });
});

describe("seed guides", () => {
  for (const [name, raw] of Object.entries({ github, slack, gmail })) {
    it(`${name} validates, has no dangling source ids, and exports markdown`, () => {
      const g = Guide.parse(raw);
      const ids = new Set(g.sources.map((s) => s.id));
      const cited = [
        g.summary.mainBlocker, g.summary.testingBeforeReview, g.timing.activeWork, g.timing.reviewWait,
        ...g.timing.policyDeadlines, ...g.prerequisites, ...g.permissions, ...g.blockers, ...g.phases.flatMap((p) => p.steps),
      ].flatMap((c) => c.sourceIds);
      expect(cited.filter((i) => !ids.has(i))).toEqual([]);
      expect(g.sources.every((s) => s.url.startsWith("https://"))).toBe(true);
      expect(toMarkdown(g)).toContain(g.provider.name);
    });
  }
});

describe("Composio managed directory parsing", () => {
  it("extracts toolkit names and slugs", () => {
    const md =
      "[![Image 15](https://logos.composio.dev/api/calendly) Calendly CALENDLY](https://docs.composio.dev/toolkits/calendly)" +
      "[![Image 16](https://logos.composio.dev/api/capsule_crm) Capsule CRM CAPSULE_CRM](https://docs.composio.dev/toolkits/capsule_crm)";
    expect(parseManagedList(md)).toEqual([
      { name: "Calendly", slug: "calendly" },
      { name: "Capsule CRM", slug: "capsule_crm" },
    ]);
  });
});

describe("Composio snapshot", () => {
  it("matches providers to toolkits, including display names with qualifiers", () => {
    expect(findToolkit("Gmail (Google)")?.slug).toBe("gmail");
    expect(findToolkit("Xero")?.managed).toBe(false);
    expect(findToolkit("Calendly")?.managed).toBe(true);
    expect(findToolkit("Flurbix")).toBeUndefined();
  });
  it("has consistent stats", () => {
    const s = SNAPSHOT.stats;
    expect(s.managed + s.bringYourOwn).toBe(s.oauthToolkits);
    expect(SNAPSHOT.toolkits.length).toBe(s.oauthToolkits);
  });
});

describe("freshness", () => {
  it("staggers review dates and flags overdue guides", () => {
    const now = new Date("2026-11-04T00:00:00Z");
    const a = freshness({ id: "a", createdAt: "2026-11-03" }, now);
    const b = freshness({ id: "zz-other", createdAt: "2026-11-03" }, now);
    expect(a.verified).toBe("2026-11-03");
    expect(a.due).toBe(false);
    expect(freshness({ id: "a", createdAt: "2026-01-01" }, now).due).toBe(true);
    expect([a.nextReview, b.nextReview].every((d) => d > "2026-11-25" && d < "2026-12-11")).toBe(true);
  });
});

describe("scrub", () => {
  it("drops junk list items anywhere", () => {
    expect(scrub({ a: ["ok", "[object Object]", ""], b: { c: ["x", "[object Object]"] } })).toEqual({ a: ["ok"], b: { c: ["x"] } });
  });
});

describe("model output tolerance", () => {
  it("keeps the guide when the model returns objects where text is expected", async () => {
    const { ExtractOut } = await import("./research");
    const r = ExtractOut.safeParse({
      difficulty: "high",
      nextAction: { action: "Create a General app", where: "marketplace.zoom.us" },
      routeReason: ["Managed app exists", "but external apps need review"],
      permissions: [{ scope: "meeting:write", enables: { text: "create meetings" } }, { scope: {} }],
      blockers: [{ symptom: "Review rejected", nextAction: { step: "Fix and resubmit" } }],
      steps: [{ title: "Register", detail: 42, where: null }],
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.nextAction).toContain("Create a General app");
    expect(r.data.routeReason).toContain("external apps need review");
    expect(r.data.permissions).toHaveLength(1); // empty scope dropped, not the whole guide
    expect(r.data.permissions[0].enables).toBe("create meetings");
    expect(r.data.blockers[0].nextAction).toBe("Fix and resubmit");
    expect(r.data.steps[0].detail).toBe("42");
  });
});

describe("setup kit", () => {
  const k = { appName: "Demo Agent", homepage: "https://demo.dev", redirectUri: "https://backend.composio.dev/api/v3/toolkits/auth/callback" };
  it("builds a Slack manifest link with the guide's exact scopes", async () => {
    const { kitFor, slackScopes } = await import("./setupKit");
    const g = Guide.parse(slack);
    const s = slackScopes(g);
    expect(s.bot).toEqual(expect.arrayContaining(["channels:history", "chat:write"]));
    const kit = kitFor(g, k);
    expect(kit.kind).toBe("slack");
    if (kit.kind !== "slack") return;
    expect(kit.url.startsWith("https://api.slack.com/apps?new_app=1&manifest_json=")).toBe(true);
    const m = JSON.parse(decodeURIComponent(kit.url.split("manifest_json=")[1]));
    expect(m.oauth_config.redirect_urls).toEqual([k.redirectUri]);
    expect(m.oauth_config.scopes.bot).toContain("chat:write");
  });
  it("builds a GitHub App registration URL with read/write permissions", async () => {
    const { kitFor } = await import("./setupKit");
    const kit = kitFor(Guide.parse(github), k);
    expect(kit.kind).toBe("github");
    if (kit.kind !== "github") return;
    const u = new URL(kit.url);
    expect(u.origin + u.pathname).toBe("https://github.com/settings/apps/new");
    expect(u.searchParams.get("contents")).toBe("read");
    expect(u.searchParams.get("issues")).toBe("write");
    expect(u.searchParams.getAll("callback_urls[]")).toEqual([k.redirectUri]);
  });
  it("falls back to a paste-ready packet for providers without a documented prefill", async () => {
    const { kitFor, packet } = await import("./setupKit");
    const g = Guide.parse(gmail);
    expect(kitFor(g, k).kind).toBe("packet");
    const p = packet(g, k);
    expect(p).toContain("Redirect / callback URI: " + k.redirectUri);
    expect(p).toContain("gmail");
  });
});

describe("plan tolerance", () => {
  it("accepts string URLs, object list items and string booleans", async () => {
    const { PlanOut } = await import("./research");
    const p = PlanOut.parse({
      ambiguous: "false",
      officialDomains: ["shopify.dev", { domain: "shopify.com" }],
      candidateUrls: ["https://shopify.dev/docs/apps/auth", { href: "https://shopify.dev/docs/api/usage/access-scopes" }, { why: "no url" }],
      searchQueries: "shopify protected customer data",
    });
    expect(p.providerName).toBe("");
    expect(p.ambiguous).toBe(false);
    expect(p.officialDomains).toEqual(["shopify.dev", "shopify.com"]);
    expect(p.candidateUrls.map((c) => c.url)).toEqual(["https://shopify.dev/docs/apps/auth", "https://shopify.dev/docs/api/usage/access-scopes"]);
    expect(p.searchQueries).toEqual(["shopify protected customer data"]);
  });
});

describe("english sources", () => {
  it("drops non-English language parameters", async () => {
    const { preferEnglish } = await import("./safeFetch");
    expect(preferEnglish("https://developers.google.com/identity/protocols/oauth2?hl=es-419")).toBe("https://developers.google.com/identity/protocols/oauth2");
    expect(preferEnglish("https://developers.google.com/x?hl=en&a=1")).toBe("https://developers.google.com/x?hl=en&a=1");
    expect(preferEnglish("https://example.com/docs?lang=pt-br&page=2")).toBe("https://example.com/docs?page=2");
  });
});
