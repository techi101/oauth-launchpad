import { describe, expect, it } from "vitest";
import { assertPublicUrl, htmlToText, isPrivateIp } from "./safeFetch";
import { quoteSupported } from "./research";
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
