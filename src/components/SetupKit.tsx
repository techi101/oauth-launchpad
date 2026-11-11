"use client";

import { useMemo, useState } from "react";
import type { Guide } from "@/lib/schema";
import { kitFor, packet } from "@/lib/setupKit";

const V3 = "https://backend.composio.dev/api/v3/toolkits/auth/callback";

/**
 * Hands the developer the part an agent can actually do before a human logs in:
 * a prefilled registration link where the provider documents one, otherwise a
 * paste-ready packet of every form value. Nothing is submitted on their behalf.
 */
export default function SetupKit({ guide }: { guide: Guide }) {
  const [appName, setAppName] = useState("My Agent");
  const [homepage, setHomepage] = useState("");
  const [redirectUri, setRedirectUri] = useState(V3);
  const [copied, setCopied] = useState("");
  const input = { appName, homepage, redirectUri };
  const kit = useMemo(() => kitFor(guide, input), [guide, appName, homepage, redirectUri]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = useMemo(() => packet(guide, input), [guide, appName, homepage, redirectUri]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async (what: string, v: string) => {
    try {
      await navigator.clipboard.writeText(v);
      setCopied(what);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const field = "w-full rounded-xl border border-line bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100";
  return (
    <div className="grid gap-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-1">
          <span className="text-muted">App name</span>
          <input className={field} value={appName} onChange={(e) => setAppName(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-muted">Homepage (optional)</span>
          <input className={field} value={homepage} placeholder="https://your-app.com" onChange={(e) => setHomepage(e.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-muted">Redirect URI</span>
          <input className={field} value={redirectUri} onChange={(e) => setRedirectUri(e.target.value)} />
        </label>
      </div>
      <p className="-mt-2 text-xs text-muted">
        Default is Composio&apos;s v3 callback (bring-your-own-app). Use your own callback if you run the OAuth flow yourself.
      </p>

      {kit.kind !== "packet" ? (
        <div className="rounded-md border border-accent bg-accent-soft p-3">
          <p className="font-medium">
            One-click registration: {kit.kind === "slack" ? "Slack app manifest" : "GitHub App URL parameters"} (documented by the
            provider)
          </p>
          <p className="mt-1 text-muted">
            Opens the provider&apos;s own create-app page already filled with your name, redirect URI and these permissions:{" "}
            <span className="font-mono text-xs text-fg">{kit.scopes.join(", ")}</span>. You review and click Create while signed
            in; nothing is created for you.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a href={kit.url} target="_blank" rel="noreferrer" className="rounded-md bg-accent px-3 py-1.5 font-medium text-white">
              Open prefilled {kit.kind === "slack" ? "Slack" : "GitHub"} registration
            </a>
            <button onClick={() => copy("link", kit.url)} className="rounded-md border border-line px-3 py-1.5">
              {copied === "link" ? "Copied" : "Copy link"}
            </button>
            {kit.kind === "slack" && (
              <button onClick={() => copy("manifest", JSON.stringify(kit.manifest, null, 2))} className="rounded-md border border-line px-3 py-1.5">
                {copied === "manifest" ? "Copied" : "Copy manifest"}
              </button>
            )}
            <a href={kit.doc} target="_blank" rel="noreferrer" className="self-center text-xs text-accent underline">
              Format source
            </a>
          </div>
        </div>
      ) : (
        <p className="text-muted">
          {guide.provider.name} does not document a prefilled registration link, so the agent prepares every value instead. Paste
          them into the registration form.
        </p>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="font-medium">Registration packet</span>
          <button onClick={() => copy("packet", text)} className="rounded-md border border-line px-2 py-1 text-xs">
            {copied === "packet" ? "Copied" : "Copy packet"}
          </button>
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-900 p-4 font-mono text-xs text-slate-100">{text}</pre>
      </div>
    </div>
  );
}
