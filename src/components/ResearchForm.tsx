"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = ["Read emails and draft replies", "Post messages to channels", "Create issues", "Read calendar events", "Upload files"];

export default function ResearchForm({
  initialProvider = "",
  initialActions = "",
  initialAudience = "external",
  baseGuideId,
  compact = false,
}: {
  initialProvider?: string;
  initialActions?: string;
  initialAudience?: string;
  baseGuideId?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [provider, setProvider] = useState(initialProvider);
  const [actions, setActions] = useState(initialActions);
  const [audience, setAudience] = useState(initialAudience);
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (provider.trim().length < 2) return setErr("Enter an app name or website.");
    if (actions.trim().length < 3) return setErr("Say what your agent should do with it.");
    const q = new URLSearchParams({ provider: provider.trim(), actions: actions.trim(), audience });
    if (baseGuideId) q.set("base", baseGuideId);
    router.push(`/research?${q}`);
  }

  return (
    <form onSubmit={submit} className="grid gap-3" aria-label="Research an app">
      <div className={compact ? "grid gap-3" : "grid gap-3 md:grid-cols-[1fr_1.3fr]"}>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">1. Which app?</span>
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. Calendly or calendly.com"
            className="rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
            maxLength={80}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">2. What should your agent do with it?</span>
          <input
            value={actions}
            onChange={(e) => setActions(e.target.value)}
            placeholder="e.g. Read upcoming meetings and cancel them"
            className="rounded-md border border-line bg-bg px-3 py-2 outline-none focus:border-accent"
            maxLength={300}
            list="action-examples"
          />
          <datalist id="action-examples">
            {EXAMPLES.map((x) => (
              <option key={x} value={x} />
            ))}
          </datalist>
        </label>
      </div>
      <fieldset className="text-sm">
        <legend className="mb-1 font-medium">3. Who will connect their accounts?</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["personal", "Just me / testing"],
            ["internal", "My own organisation"],
            ["external", "External customers"],
          ].map(([v, l]) => (
            <label
              key={v}
              className={`cursor-pointer rounded-md border px-3 py-1.5 ${audience === v ? "border-accent bg-accent-soft" : "border-line"}`}
            >
              <input type="radio" name="audience" value={v} checked={audience === v} onChange={() => setAudience(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      {err && <p className="text-sm text-rose-600" role="alert">{err}</p>}
      <div>
        <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          {baseGuideId ? "Re-research for this use case" : "Research this app"}
        </button>
        <span className="ml-3 text-xs text-muted">Takes 1–3 minutes. The agent reads official docs live.</span>
      </div>
    </form>
  );
}
