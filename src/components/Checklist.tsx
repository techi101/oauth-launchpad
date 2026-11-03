"use client";

import { useEffect, useState } from "react";
import type { Guide } from "@/lib/schema";
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

  if (!all.length) return <p className="text-sm text-muted">No verified steps yet. See Evidence for the pages to read.</p>;

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-3 text-sm">
        <div className="h-2 flex-1 overflow-hidden rounded bg-line" aria-hidden>
          <div className="h-full bg-accent" style={{ width: `${(n / all.length) * 100}%` }} />
        </div>
        <span className="text-muted">
          {n}/{all.length} done <span className="text-xs">(saved in this browser only)</span>
        </span>
      </div>
      {guide.phases.map((ph) => (
        <div key={ph.name}>
          <h3 className="mb-2 text-sm font-semibold">{ph.name}</h3>
          <ol className="grid gap-2">
            {ph.steps.map((s) => {
              const blockedBy = s.dependsOn.filter((d) => titles[d] && !done[d]);
              return (
                <li key={s.id} className="rounded-md border border-line p-3">
                  <label className="flex cursor-pointer gap-3">
                    <input type="checkbox" checked={!!done[s.id]} onChange={() => toggle(s.id)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
                    <span className="grid flex-1 gap-1">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className={`font-medium ${done[s.id] ? "text-muted line-through" : ""}`}>{s.title}</span>
                        <OwnerTag o={s.owner} />
                        <EvidenceTag e={s.evidence} />
                        <Cites ids={s.sourceIds} />
                      </span>
                      {s.detail && <span className="text-sm text-muted">{s.detail}</span>}
                      {s.outcome && <span className="text-sm"><span className="text-muted">Outcome:</span> {s.outcome}</span>}
                      {blockedBy.length > 0 && (
                        <span className="text-xs text-amber-700 dark:text-amber-300">After: {blockedBy.map((d) => titles[d]).join("; ")}</span>
                      )}
                    </span>
                  </label>
                  {s.where && (
                    <a href={s.where} target="_blank" rel="noreferrer" className="ml-7 mt-1 inline-block break-all text-xs text-accent underline">
                      {s.where}
                    </a>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}
