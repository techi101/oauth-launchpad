import type { Evidence, Owner } from "@/lib/schema";

const EV: Record<Evidence, { label: string; cls: string; title: string }> = {
  observed: { label: "Observed", cls: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200", title: "Seen during a real setup attempt" },
  documented: { label: "Documented", cls: "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200", title: "Quoted from official provider documentation" },
  secondary: { label: "Secondary source", cls: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200", title: "From a non-provider source such as an integration platform" },
  inferred: { label: "Inferred", cls: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200", title: "Reasoned from sources, not stated directly" },
  unverified: { label: "Unverified", cls: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200", title: "Could not be confirmed from any source" },
};

export function EvidenceTag({ e }: { e: Evidence }) {
  const x = EV[e];
  return (
    <span title={x.title} className={`inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${x.cls}`}>
      {x.label}
    </span>
  );
}

const OWN: Record<Owner, string> = { agent: "Agent", developer: "You", admin: "Org admin", provider: "Provider" };
export function OwnerTag({ o }: { o: Owner }) {
  return (
    <span className="inline-block whitespace-nowrap rounded border border-line px-1.5 py-0.5 text-[11px] text-muted">
      {OWN[o]}
    </span>
  );
}

export function Cites({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <span className="ml-1 text-[11px] text-muted">
      {ids.map((id) => (
        <a key={id} href={`#src-${id}`} className="mr-0.5 underline decoration-dotted hover:text-accent">
          [{id}]
        </a>
      ))}
    </span>
  );
}

export const DIFF: Record<string, { label: string; cls: string }> = {
  low: { label: "Low effort", cls: "text-emerald-700 dark:text-emerald-300" },
  medium: { label: "Medium effort", cls: "text-amber-700 dark:text-amber-300" },
  high: { label: "High effort", cls: "text-rose-700 dark:text-rose-300" },
  unknown: { label: "Unknown", cls: "text-muted" },
};

export const ROUTE_LABEL: Record<string, string> = {
  managed: "Managed OAuth app",
  own_app: "Register your own app",
  unresolved: "Unresolved",
};

export function Section({ id, title, children, hint }: { id?: string; title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section id={id} className="min-w-0 rounded-lg border border-line bg-panel p-4 sm:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
