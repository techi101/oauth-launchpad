import type { Guide } from "./schema";

/**
 * "Do it for me" setup links. Only providers with a DOCUMENTED prefilled-registration URL get one:
 * - Slack: https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests
 *   ("https://api.slack.com/apps?new_app=1&manifest_json=<manifest_here>", URL-encoded)
 * - GitHub Apps: https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters
 *   (https://github.com/settings/apps/new?name=..&url=..&callback_urls[]=..&<permission>=read|write)
 * Every other provider gets a registration packet: the values to paste into its console.
 */

export type KitInput = { appName: string; homepage: string; redirectUri: string };
export type KitScope = { token: string; note: string };

const SLACK_SCOPE = /\b([a-z]+(?:\.[a-z]+)?:[a-z]+(?:\.[a-z]+)*)\b/g;

/** Exact Slack scope names (e.g. chat:write, channels:history) mentioned in the guide's permissions. */
export function slackScopes(g: Guide): { bot: string[]; user: string[] } {
  const bot = new Set<string>();
  const user = new Set<string>();
  for (const p of g.permissions) {
    const isUser = /user token|xoxp|\(user\)/i.test(p.scope) && !/\(bot\)/i.test(p.scope);
    for (const m of p.scope.matchAll(SLACK_SCOPE)) (isUser ? user : bot).add(m[1]);
  }
  return { bot: [...bot], user: [...user] };
}

export function slackManifest(g: Guide, k: KitInput) {
  const { bot, user } = slackScopes(g);
  const scopes: Record<string, string[]> = {};
  if (bot.length) scopes.bot = bot;
  if (user.length) scopes.user = user;
  const manifest: Record<string, unknown> = {
    display_information: { name: k.appName.slice(0, 35) || "My Agent" },
    oauth_config: { redirect_urls: [k.redirectUri], scopes },
    settings: { org_deploy_enabled: false, socket_mode_enabled: false, token_rotation_enabled: false },
  };
  if (bot.length) manifest.features = { bot_user: { display_name: (k.appName || "My Agent").slice(0, 80), always_online: false } };
  return manifest;
}

export const slackUrl = (g: Guide, k: KitInput) =>
  `https://api.slack.com/apps?new_app=1&manifest_json=${encodeURIComponent(JSON.stringify(slackManifest(g, k)))}`;

/** GitHub App permission names from text like "Contents (read)", "Issues (read and write)". */
const GH_PERMS = [
  "actions", "administration", "checks", "contents", "deployments", "discussions", "environments", "issues", "packages",
  "pages", "pull_requests", "repository_projects", "secret_scanning_alerts", "secrets", "security_events", "statuses",
  "vulnerability_alerts", "workflows", "members", "organization_projects",
];
export function githubPermissions(g: Guide): Record<string, "read" | "write"> {
  const out: Record<string, "read" | "write"> = {};
  for (const p of g.permissions) {
    if (!/github app/i.test(p.scope) && !/\((read|write|read and write)\)/i.test(p.scope)) continue;
    for (const m of p.scope.matchAll(/([A-Za-z][A-Za-z ]+?)\s*\((read and write|read|write)\)/gi)) {
      const name = m[1].replace(/^.*:\s*/, "").trim().toLowerCase().replace(/\s+/g, "_");
      if (!GH_PERMS.includes(name)) continue;
      const level = /write/i.test(m[2]) ? "write" : "read";
      if (out[name] !== "write") out[name] = level;
    }
  }
  return out;
}

export function githubUrl(g: Guide, k: KitInput) {
  const q = new URLSearchParams();
  q.set("name", k.appName.slice(0, 34) || "My Agent");
  if (k.homepage) q.set("url", k.homepage);
  q.append("callback_urls[]", k.redirectUri);
  q.set("request_oauth_on_install", "true");
  q.set("webhook_active", "false");
  for (const [p, v] of Object.entries(githubPermissions(g))) q.set(p, v);
  return `https://github.com/settings/apps/new?${q.toString()}`;
}

export type Kit =
  | { kind: "slack"; url: string; manifest: unknown; scopes: string[]; doc: string }
  | { kind: "github"; url: string; scopes: string[]; doc: string }
  | { kind: "packet" };

export function kitFor(g: Guide, k: KitInput): Kit {
  const n = `${g.provider.name} ${g.provider.website}`.toLowerCase();
  if (/\bslack\b/.test(n)) {
    const { bot, user } = slackScopes(g);
    if (bot.length + user.length)
      return {
        kind: "slack",
        url: slackUrl(g, k),
        manifest: slackManifest(g, k),
        scopes: [...bot.map((s) => `${s} (bot)`), ...user.map((s) => `${s} (user)`)],
        doc: "https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests",
      };
  }
  if (/\bgithub\b/.test(n)) {
    const perms = githubPermissions(g);
    if (Object.keys(perms).length)
      return {
        kind: "github",
        url: githubUrl(g, k),
        scopes: Object.entries(perms).map(([p, v]) => `${p}: ${v}`),
        doc: "https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters",
      };
  }
  return { kind: "packet" };
}

/** Plain-text values to paste into any provider's registration form. */
export function packet(g: Guide, k: KitInput) {
  const lines = [
    `Provider: ${g.provider.name}`,
    `Register at: ${g.provider.developerPortal || g.provider.website || "(see checklist)"}`,
    `App name: ${k.appName}`,
    k.homepage ? `Homepage / app URL: ${k.homepage}` : "",
    `Redirect / callback URI: ${k.redirectUri}`,
    `Audience: ${g.useCase.audience}`,
    "",
    "Permissions to request (smallest set for this use case):",
    ...g.permissions.map((p) => `- ${p.scope}: ${p.enables}${p.reviewImpact ? ` [review: ${p.reviewImpact}]` : ""}`),
    "",
    "Before external launch, have ready:",
    ...g.prerequisites.map((p) => `- ${p.text}`),
  ];
  return lines.filter((l, i) => l !== "" || lines[i - 1] !== "").join("\n").trim();
}
