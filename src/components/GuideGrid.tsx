"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GuideCard } from "@/lib/store";
import { ROUTE_SHORT } from "@/lib/display";
import AppLogo from "./AppLogo";
import Icon from "./Icon";
import { EffortPill } from "./ui";

const RANK: Record<string, number> = { high: 0, medium: 1, low: 2, unknown: 3 };
const AUD: Record<string, string> = { personal: "Just me / testing", internal: "My organisation", external: "External customers" };
type Level = "all" | "high" | "medium" | "low";

export default function GuideGrid({ seeds, generated }: { seeds: GuideCard[]; generated: GuideCard[] }) {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<Level>("all");
  const [view, setView] = useState<"cards" | "table">("cards");
  const match = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (g: GuideCard) =>
      (level === "all" || g.difficulty === level) && (!s || `${g.name} ${g.actions} ${g.reviewWait} ${g.mainBlocker}`.toLowerCase().includes(s));
  }, [q, level]);
  const lib = seeds.filter(match).sort((a, b) => RANK[a.difficulty] - RANK[b.difficulty] || a.name.localeCompare(b.name));
  const recent = generated.filter(match);
  const count = (d: string) => seeds.filter((g) => g.difficulty === d).length;

  return (
    <div className="grid gap-6 [&>*]:min-w-0">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-subtle p-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search apps or blockers, e.g. Salesforce, admin consent, security review"
            aria-label="Search guides"
            className="w-full rounded-xl border border-line bg-white py-2.5 pl-9 pr-3 text-sm shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-line" role="group" aria-label="Filter by effort">
            {(["all", "high", "medium", "low"] as Level[]).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${level === l ? "bg-fg text-white" : "text-slate-600 hover:bg-subtle"}`}
              >
                {l === "all" ? `All · ${seeds.length}` : `${l[0].toUpperCase()}${l.slice(1)} · ${count(l)}`}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-xl bg-white p-1 shadow-sm ring-1 ring-line" role="group" aria-label="View">
            {(["cards", "table"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-label={v === "cards" ? "Card view" : "Table view"}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${view === v ? "bg-accent-soft text-accent" : "text-slate-500 hover:bg-subtle"}`}
              >
                <Icon name={v === "cards" ? "grid" : "list"} className="h-3.5 w-3.5" />
                {v === "cards" ? "Cards" : "Compare"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {lib.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-medium">No app in the library matches “{q}”.</p>
          <p className="mt-1 text-sm text-muted">The research agent can write a guide for it in about a minute.</p>
          <a href="#research" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-strong">
            <Icon name="sparkles" /> Research it now
          </a>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lib.map((g) => (
            <Card key={g.id} g={g} />
          ))}
        </div>
      ) : (
        <Table list={lib} />
      )}

      {recent.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-baseline justify-between">
            <h3 className="font-semibold">Recent live runs</h3>
            <span className="text-xs text-muted">Written by the agent, not yet reviewed by a person</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((g) => (
              <Link key={g.id} href={`/g/${g.id}`} className="flex items-center gap-3 rounded-xl border border-line bg-white p-3 hover:border-indigo-200 hover:shadow-sm">
                <AppLogo name={g.name} domain={g.domain} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{g.name}</span>
                  <span className="block truncate text-xs text-muted">{g.actions}</span>
                </span>
                {g.status === "partial" ? <span className="text-[11px] font-medium text-slate-500">Partial</span> : <EffortPill level={g.difficulty} />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ g }: { g: GuideCard }) {
  return (
    <Link
      href={`/g/${g.id}`}
      className="group flex flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <div className="flex items-start gap-3">
        <AppLogo name={g.name} domain={g.domain} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold group-hover:text-accent">{g.name}</p>
          <p className="line-clamp-1 text-xs text-muted">{g.actions}</p>
        </div>
        <EffortPill level={g.difficulty} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-subtle px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted"><Icon name="clock" className="h-3 w-3" /> Your work</p>
          <p className="mt-0.5 text-sm font-semibold">{g.workShort}</p>
        </div>
        <div className="rounded-xl bg-subtle px-3 py-2">
          <p className="flex items-center gap-1 text-[11px] text-muted"><Icon name="hourglass" className="h-3 w-3" /> Review wait</p>
          <p className="mt-0.5 text-sm font-semibold">{g.waitShort}</p>
        </div>
      </div>

      <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted">Main blocker</p>
      <p className="mt-1 line-clamp-3 text-sm text-slate-700">{g.blockerShort}</p>

      <div className="mt-auto flex items-center justify-between pt-4 text-xs">
        <span className="text-muted">{ROUTE_SHORT[g.route]}</span>
        <span className="inline-flex items-center gap-1 font-medium text-emerald-700">
          <Icon name="check" className="h-3.5 w-3.5" />
          {g.kind === "seed" ? "Hand-researched" : "Reviewed"}
        </span>
      </div>
    </Link>
  );
}

function Table({ list }: { list: GuideCard[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white shadow-sm">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-line bg-subtle text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">App</th>
            <th className="px-4 py-3 font-medium">Effort</th>
            <th className="px-4 py-3 font-medium">Your work</th>
            <th className="px-4 py-3 font-medium">Review wait</th>
            <th className="px-4 py-3 font-medium">Route</th>
            <th className="px-4 py-3 font-medium">Main blocker</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {list.map((g) => (
            <tr key={g.id} className="align-top hover:bg-subtle/60">
              <td className="px-4 py-3">
                <Link href={`/g/${g.id}`} className="flex items-center gap-3">
                  <AppLogo name={g.name} domain={g.domain} size={32} />
                  <span>
                    <span className="block font-medium hover:text-accent">{g.name}</span>
                    <span className="block text-xs text-muted">{AUD[g.audience]}</span>
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3"><EffortPill level={g.difficulty} /></td>
              <td className="px-4 py-3 font-medium">{g.workShort}</td>
              <td className="px-4 py-3 font-medium">{g.waitShort}</td>
              <td className="px-4 py-3 text-xs text-muted">{ROUTE_SHORT[g.route]}</td>
              <td className="max-w-sm px-4 py-3 text-xs text-slate-700"><span className="line-clamp-2">{g.blockerShort}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
