"use client";

import { useEffect, useState } from "react";
import type { Guide } from "@/lib/schema";
import Icon from "./Icon";
import { Cites, EvidenceTag, OwnerTag } from "./ui";

/** Progress is personal: stored only in this browser, never in the shared guide. */
export default function Checklist({ guide }: { guide: Guide }) {
  const key = `oauth-launchpad:progress:${guide.id}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(key) ?? "{}"));
    } catch {
      /* storage blocked */
    }
  }, [key]);
  const toggle = (id: string) => {
    const next = { ...done, [id]: !done[id] };
    setDone(next);
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const all = guide.phases.flatMap((p) => p.steps);
  const n = all.filter((s) => done[s.id]).length;
  const titles = Object.fromEntries(all.map((s) => [s.id, s.title]));
  const pct = all.length ? Math.round((n / all.length) * 100) : 0;
  let num = 0;

  if (!all.length) return <p className="text-sm text-muted">No verified steps yet. See Evidence for the pages to read.</p>;

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3 rounded-xl bg-subtle px-4 py-3 text-sm">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white ring-1 ring-line" aria-hidden>
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="font-medium">{n} of {all.length} done</span>
      </div>
      {guide.phases.map((ph) => (
        <div key={ph.name}>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{ph.name}</h3>
          <ol className="relative grid gap-3 border-l border-line pl-6 ml-3.5">
            {ph.steps.map((s) => {
              num += 1;
              const isDone = !!done[s.id];
              const blockedBy = s.dependsOn.filter((d) => titles[d] && !done[d]);
              return (
                <li key={s.id} className="relative">
                  <button
                    onClick={() => toggle(s.id)}
                    aria-label={isDone ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}
                    className={`absolute -left-[38px] top-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-white transition ${
                      isDone ? "bg-emerald-500 text-white" : "border border-line bg-white text-slate-600 hover:border-indigo-300 hover:text-accent"
                    }`}
                  >
                    {isDone ? <Icon name="check" className="h-3.5 w-3.5" /> : num}
                  </button>
                  <div className={`rounded-xl border p-4 transition ${isDone ? "border-emerald-200 bg-emerald-50/40" : "border-line bg-white"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium ${isDone ? "text-slate-500 line-through" : ""}`}>{s.title}</span>
                      <OwnerTag o={s.owner} />
                    </div>
                    {s.detail && <p className="mt-1.5 text-sm text-slate-600">{s.detail}</p>}
                    {s.outcome && <p className="mt-1 text-sm"><span className="text-muted">Done when: </span>{s.outcome}</p>}
                    {blockedBy.length > 0 && <p className="mt-1 text-xs text-amber-700">After: {blockedBy.map((d) => titles[d]).join("; ")}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <EvidenceTag e={s.evidence} />
                      <Cites ids={s.sourceIds} />
                      {s.where && /^https?:/.test(s.where) && (
                        <a href={s.where} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline">
                          Open page <Icon name="external" className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
