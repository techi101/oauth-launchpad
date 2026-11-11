import { EFFORT } from "@/lib/display";
import type { Evidence, Owner } from "@/lib/schema";

const EV: Record<Evidence, { label: string; cls: string; title: string }> = {
  observed: { label: "Observed", cls: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", title: "Seen during a real setup attempt" },
  documented: { label: "Documented", cls: "bg-sky-50 text-sky-700 ring-sky-600/20", title: "Quoted from official provider documentation" },
  secondary: { label: "Secondary", cls: "bg-violet-50 text-violet-700 ring-violet-600/20", title: "From a non-provider source such as an integration platform" },
  inferred: { label: "Inferred", cls: "bg-slate-50 text-slate-600 ring-slate-500/20", title: "Reasoned from sources, not stated directly" },
  unverified: { label: "Unverified", cls: "bg-slate-100 text-slate-500 ring-slate-400/30", title: "Could not be confirmed from any source" },
};

export function EvidenceTag({ e }: { e: Evidence }) {
  const x = EV[e];
  return (
    <span title={x.title} className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${x.cls}`}>
      {x.label}
    </span>
  );
}

const OWN: Record<Owner, { label: string; cls: string }> = {
  agent: { label: "Agent", cls: "bg-indigo-50 text-indigo-700" },
  developer: { label: "You", cls: "bg-slate-100 text-slate-700" },
  admin: { label: "Org admin", cls: "bg-amber-50 text-amber-800" },
  provider: { label: "Provider", cls: "bg-sky-50 text-sky-700" },
};
export function OwnerTag({ o }: { o: Owner }) {
  const x = OWN[o];
  return <span className={`inline-flex whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-medium ${x.cls}`}>{x.label}</span>;
}

export function Cites({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <span className="ml-1 text-[11px] text-muted">
      {ids.map((id) => (
        <a key={id} href={`#src-${id}`} className="mr-0.5 rounded px-0.5 hover:bg-accent-soft hover:text-accent">
          [{id}]
        </a>
      ))}
    </span>
  );
}

export function EffortPill({ level, size = "sm" }: { level: keyof typeof EFFORT; size?: "sm" | "md" }) {
  const x = EFFORT[level] ?? EFFORT.unknown;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset ${x.pill} ${size === "md" ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[11px]"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${x.dot}`} />
      {x.label}
    </span>
  );
}

/** Kept for older pages. */
export const DIFF: Record<string, { label: string; cls: string }> = {
  low: { label: "Low effort", cls: "text-emerald-600" },
  medium: { label: "Medium effort", cls: "text-amber-600" },
  high: { label: "High effort", cls: "text-rose-600" },
  unknown: { label: "Unknown", cls: "text-muted" },
};

export const ROUTE_LABEL: Record<string, string> = {
  managed: "Managed OAuth app",
  own_app: "Register your own app",
  unresolved: "Unresolved",
};

export function Section({ id, title, children, hint, icon }: { id?: string; title: string; children: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">{children}</p>;
}
