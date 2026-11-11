"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GuideCard } from "@/lib/store";
import { DIFF, ROUTE_LABEL } from "./ui";

const AUD: Record<string, string> = { personal: "Testing", internal: "Internal", external: "External customers" };
const RANK: Record<string, number> = { high: 0, medium: 1, low: 2, unknown: 3 };
type Level = "all" | "high" | "medium" | "low";

export default function GuideGrid({ seeds, generated }: { seeds: GuideCard[]; generated: GuideCard[] }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Level>("all");
  const [view, setView] = useState<"compare" | "cards">("compare");
  const filter = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (list: GuideCard[]) =>
      list.filter(
        (g) =>
          (level === "all" || g.difficulty === level) &&
          (!s || `${g.name} ${g.actions} ${g.reviewWait} ${g.mainBlocker}`.toLowerCase().includes(s)),
      );
  }, [q, level]);
  const lib = filter(seeds).sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.name.localeCompare(b.name));
  const fg = filter(generated);
  const count = (d: string) => seeds.filter((g) => g.difficulty === d).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search apps, use cases or blockers (e.g. review, CASA, admin)"
          aria-label="Search guides"
          className="min-w-0 flex-1 rounded-md border border-line bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="flex gap-1 text-xs" role="group" aria-label="Filter by effort">
          {(["all", "high", "medium", "low"] as Level[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-md border px-2 py-1.5 ${level === l ? "border-accent bg-accent-soft" : "border-line"}`}
            >
              {l === "all" ? `All ${seeds.length}` : `${DIFF[l].label.split(" ")[0]} ${count(l)}`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 text-xs" role="group" aria-label="View">
          {(["compare", "cards"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-md border px-2 py-1.5 ${view === v ? "border-accent bg-accent-soft" : "border-line"}`}
            >
              {v === "compare" ? "Compare" : "Cards"}
            </button>
          ))}
        </div>
      </div>

      <h3 className="text-sm font-semibold text-muted">
        Library: {seeds.length} apps, hardest first. Starter guides were hand-researched; the rest were written by the research agent
        and spot-checked against their sources.
      </h3>
      {view === "compare" ? <Compare list={lib} /> : <Cards list={lib} />}
      {lib.length === 0 && <p className="text-sm text-muted">No library guide matches. Research it below.</p>}

      {fg.length > 0 && (
        <>
          <h3 className="mt-2 text-sm font-semibold text-muted">Recent live runs (not yet reviewed)</h3>
          <Cards list={fg} />
        </>
      )}
    </div>
  );
}

function Compare({ list }: { list: GuideCard[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-panel text-xs text-muted">
          <tr>
            <th className="p-2">App</th>
            <th className="p-2">Effort</th>
            <th className="p-2">Route</th>
            <th className="p-2">Your hands-on work</th>
            <th className="p-2">Provider review wait</th>
            <th className="p-2">Main blocker</th>
          </tr>
        </thead>
        <tbody>
          {list.map((g) => (
            <tr key={g.id} className="border-t border-line align-top">
              <td className="p-2">
                <Link href={`/g/${g.id}`} className="font-semibold text-accent underline">
                  {g.name}
                </Link>
                <p className="line-clamp-2 text-xs text-muted">{g.actions}</p>
                {g.kind === "seed" && <span className="text-[11px] text-muted">Starter</span>}
              </td>
              <td className={`p-2 text-xs font-medium ${DIFF[g.difficulty].cls}`}>{DIFF[g.difficulty].label}</td>
              <td className="p-2 text-xs">{ROUTE_LABEL[g.route]}</td>
              <td className="p-2 text-xs"><span className="line-clamp-3">{g.activeWork}</span></td>
              <td className="p-2 text-xs"><span className="line-clamp-3">{g.reviewWait}</span></td>
              <td className="p-2 text-xs"><span className="line-clamp-3">{g.mainBlocker}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cards({ list }: { list: GuideCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((g) => (
        <Link key={g.id} href={`/g/${g.id}`} className="group rounded-lg border border-line bg-panel p-4 hover:border-accent">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-semibold group-hover:text-accent">{g.name}</span>
            <span className={`text-xs font-medium ${DIFF[g.difficulty].cls}`}>{DIFF[g.difficulty].label}</span>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{g.actions}</p>
          <dl className="mt-3 grid gap-1 text-xs">
            <div className="flex gap-1">
              <dt className="text-muted">Route:</dt>
              <dd>{ROUTE_LABEL[g.route]}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="text-muted">For:</dt>
              <dd>{AUD[g.audience]}</dd>
            </div>
            <div className="flex gap-1">
              <dt className="shrink-0 text-muted">Review wait:</dt>
              <dd className="line-clamp-2">{g.reviewWait}</dd>
            </div>
          </dl>
          {g.status === "partial" && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Partial result</p>}
        </Link>
      ))}
    </div>
  );
}
