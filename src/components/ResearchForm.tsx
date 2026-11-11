"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const EXAMPLES = ["Read emails and draft replies", "Post messages to channels", "Create issues", "Read calendar events", "Upload files"];

export default function ResearchForm({
  initialProvider = "",
  initialActions = "",
  initialAudience = "external",
  baseGuideId,
  compact: _compact = false, // eslint-disable-line @typescript-eslint/no-unused-vars
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
    <form onSubmit={submit} className="grid gap-4" aria-label="Research an app">
      <div className="grid gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium">1. Which app?</span>
          <input
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            placeholder="e.g. Calendly or calendly.com"
            className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            maxLength={80}
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium">2. What should your agent do with it?</span>
          <input
            value={actions}
            onChange={(e) => setActions(e.target.value)}
            placeholder="e.g. Read upcoming meetings and cancel them"
            className="rounded-xl border border-line bg-white px-3.5 py-2.5 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
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
        <legend className="mb-1.5 font-medium">3. Who will connect their accounts?</legend>
        <div className="flex flex-wrap gap-2">
          {[
            ["personal", "Just me / testing"],
            ["internal", "My own organisation"],
            ["external", "External customers"],
          ].map(([v, l]) => (
            <label
              key={v}
              className={`cursor-pointer rounded-xl border px-3 py-2 font-medium transition ${audience === v ? "border-indigo-300 bg-accent-soft text-accent ring-4 ring-indigo-100" : "border-line bg-white text-slate-600 hover:border-slate-300"}`}
            >
              <input type="radio" name="audience" value={v} checked={audience === v} onChange={() => setAudience(v)} className="sr-only" />
              {l}
            </label>
          ))}
        </div>
      </fieldset>
      {err && <p className="text-sm text-rose-600" role="alert">{err}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-accent-strong">
          {baseGuideId ? "Re-research for this use case" : "Research this app"} <span aria-hidden>→</span>
        </button>
        <span className="text-xs text-muted">About 1 minute. Reads official docs live.</span>
      </div>
    </form>
  );
}
