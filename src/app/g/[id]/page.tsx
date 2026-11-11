import Link from "next/link";
import { notFound } from "next/navigation";
import AppLogo from "@/components/AppLogo";
import Checklist from "@/components/Checklist";
import Icon from "@/components/Icon";
import OnComposio from "@/components/OnComposio";
import ResearchForm from "@/components/ResearchForm";
import SetupKit from "@/components/SetupKit";
import ShareBar from "@/components/ShareBar";
import { Cites, EffortPill, EvidenceTag, OwnerTag, Section } from "@/components/ui";
import { domainOf, EFFORT, firstSentence, logoDomain, ROUTE_SHORT, shortWait, shortWork } from "@/lib/display";
import { freshness } from "@/lib/freshness";
import { llmConfigured } from "@/lib/llm";
import { AUDIENCE_LABEL, type Claim } from "@/lib/schema";
import { getGuide } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const g = await getGuide((await params).id);
  return { title: g ? `${g.provider.name} OAuth guide · OAuth Launchpad` : "Guide not found" };
}

function ClaimLine({ c }: { c: Claim }) {
  return (
    <span>
      {c.text} <EvidenceTag e={c.evidence} />
      <Cites ids={c.sourceIds} />
    </span>
  );
}

function scopeClass(text: string) {
  if (/restricted/i.test(text)) return { label: "Restricted", cls: "bg-rose-50 text-rose-700 ring-rose-600/20" };
  if (/sensitive/i.test(text) && !/non-sensitive/i.test(text)) return { label: "Sensitive", cls: "bg-amber-50 text-amber-800 ring-amber-600/20" };
  if (/admin consent|admin approval/i.test(text)) return { label: "Admin consent", cls: "bg-sky-50 text-sky-700 ring-sky-600/20" };
  if (/review|justif|vetted|approval/i.test(text)) return { label: "Reviewed", cls: "bg-violet-50 text-violet-700 ring-violet-600/20" };
  return null;
}

const TOC = [
  ["timing", "Effort and timing"],
  ["permissions", "Permissions"],
  ["before", "Before you start"],
  ["setup-kit", "Let the agent start it"],
  ["steps", "Step by step"],
  ["composio", "On Composio"],
  ["blockers", "Blockers"],
  ["evidence", "Evidence"],
] as const;

export default async function GuidePage({ params }: { params: Promise<{ id: string }> }) {
  const g = await getGuide((await params).id);
  if (!g) notFound();
  const f = freshness(g);
  const domain = logoDomain(g.provider.name, domainOf(g));
  const eff = EFFORT[g.summary.difficulty] ?? EFFORT.unknown;
  const recheck = `/research?${new URLSearchParams({ provider: g.provider.name, actions: g.useCase.actions, audience: g.useCase.audience, ...(g.kind === "seed" ? { base: g.id } : {}) })}`;
  const managed = g.summary.managedOAuth;

  const glance = [
    { icon: "gauge", label: "Effort", value: eff.label, valueCls: eff.text, note: firstSentence(g.summary.difficultyReason, 140) },
    { icon: "clock", label: "Your hands-on work", value: shortWork(g.timing.activeWork.text), valueCls: "", note: "Estimate for registering and configuring the app" },
    { icon: "hourglass", label: "Provider review wait", value: shortWait(g.timing.reviewWait.text), valueCls: "", note: firstSentence(g.timing.reviewWait.text, 140) },
    {
      icon: "route",
      label: "Route",
      value: ROUTE_SHORT[g.summary.route],
      valueCls: "",
      note: managed
        ? managed.status === "available"
          ? g.summary.route === "managed"
            ? "Composio's managed app covers this use case"
            : "Composio has a managed app, but your own app is recommended here"
          : managed.status === "not_listed"
            ? "Not Composio-managed, so bring your own app"
            : "Managed status unknown"
        : "",
    },
  ];

  return (
    <article className="grid min-w-0 gap-8 [&>*]:min-w-0">
      {/* Header */}
      <header className="grid gap-5">
        <nav className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/#library" className="hover:text-fg">Library</Link>
          <span>/</span>
          <span className="text-fg">{g.provider.name}</span>
        </nav>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <AppLogo name={g.provider.name} domain={domain} size={64} />
            <div className="min-w-0">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{g.provider.name}</h1>
              <p className="mt-1 text-slate-600">
                <span className="text-fg">“{g.useCase.actions}”</span> · {AUDIENCE_LABEL[g.useCase.audience]}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <EffortPill level={g.summary.difficulty} size="md" />
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  <Icon name="route" className="h-3.5 w-3.5" /> {ROUTE_SHORT[g.summary.route]}
                </span>
                {g.kind === "seed" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <Icon name="check" className="h-3.5 w-3.5" /> Hand-researched
                  </span>
                ) : g.review ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <Icon name="check" className="h-3.5 w-3.5" /> Checked by a person
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                    <Icon name="sparkles" className="h-3.5 w-3.5" /> Written by the agent
                  </span>
                )}
                {g.status === "partial" && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Partial result</span>
                )}
              </div>
            </div>
          </div>
          <ShareBar id={g.id} recheck={recheck} />
        </div>
      </header>

      {/* At a glance */}
      <section aria-label="At a glance" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {glance.map((x) => (
          <div key={x.label} className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              <Icon name={x.icon} className="h-3.5 w-3.5" /> {x.label}
            </p>
            <p className={`mt-2 text-xl font-semibold tracking-tight ${x.valueCls}`}>{x.value}</p>
            {x.note && <p className="mt-1 line-clamp-3 text-xs text-muted">{x.note}</p>}
          </div>
        ))}
      </section>

      {/* Start here + watch out */}
      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            <Icon name="arrow" className="h-3.5 w-3.5" /> Start here
          </p>
          <p className="mt-2 text-lg font-medium leading-snug">{g.summary.nextAction}</p>
          <a href="#setup-kit" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5 hover:transition-all">
            Let the agent prepare the registration <Icon name="arrow" />
          </a>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-rose-700">
            <Icon name="alert" className="h-3.5 w-3.5" /> Watch out for
          </p>
          <p className="mt-2 font-medium leading-snug">
            <ClaimLine c={g.summary.mainBlocker} />
          </p>
          <p className="mt-3 text-sm text-slate-600">
            <span className="font-medium text-fg">Testing before review: </span>
            <ClaimLine c={g.summary.testingBeforeReview} />
          </p>
        </div>
      </section>

      {/* Review */}
      {g.review && (
        <details className="group rounded-2xl border border-emerald-200 bg-white p-5">
          <summary className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Icon name="shield" className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 basis-[calc(100%-3rem)] text-sm sm:basis-0">
              <span className="font-semibold">Checked by a person on {g.review.date}.</span>{" "}
              <span className="text-slate-600">
                {g.review.checked} key claims checked against official pages · {g.review.confirmed} right as written
                {g.review.checked > g.review.confirmed ? ` · ${g.review.checked - g.review.confirmed} corrected or marked unconfirmed` : ""}
              </span>
            </span>
            <span className="w-full pl-11 text-xs font-medium text-accent group-open:hidden sm:w-auto sm:pl-0">Show what was checked</span>
            <span className="hidden w-full pl-11 text-xs font-medium text-accent group-open:inline sm:w-auto sm:pl-0">Hide</span>
          </summary>
          <ul className="mt-4 grid gap-2 border-t border-line pt-4 text-sm text-slate-700">
            {g.review.notes.map((n, i) => (
              <li key={i} className="flex gap-2">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${/^corrected|^removed/i.test(n) ? "bg-rose-500" : /^could not|^unconfirmed/i.test(n) ? "bg-slate-400" : "bg-emerald-500"}`} />
                {n}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Body + side nav */}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="grid min-w-0 gap-6">
          <Section id="timing" title="Effort and timing" icon={<Icon name="clock" />} hint="Your work and the provider's wait are different things, so they are shown separately.">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your hands-on work</p>
                <p className="mt-1.5 text-sm"><ClaimLine c={g.timing.activeWork} /></p>
              </div>
              <div className="rounded-xl bg-subtle p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Provider review wait</p>
                <p className="mt-1.5 text-sm"><ClaimLine c={g.timing.reviewWait} /></p>
              </div>
            </div>
            {(g.timing.policyDeadlines.length > 0 || g.timing.costs.length > 0) && (
              <ul className="mt-4 grid gap-2 text-sm">
                {g.timing.policyDeadlines.map((c, i) => (
                  <li key={`d${i}`} className="flex gap-2.5">
                    <span className="mt-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Deadline</span>
                    <ClaimLine c={c} />
                  </li>
                ))}
                {g.timing.costs.map((c, i) => (
                  <li key={`c${i}`} className="flex gap-2.5">
                    <span className="mt-0.5 rounded-md bg-sky-50 px-1.5 py-0.5 text-[11px] font-medium text-sky-700">Cost</span>
                    <ClaimLine c={c} />
                  </li>
                ))}
              </ul>
            )}
            <details className="mt-4 text-sm">
              <summary className="text-xs font-medium text-accent">Why this effort rating?</summary>
              <p className="mt-2 text-slate-600">{g.summary.difficultyReason}</p>
              <p className="mt-2 text-slate-600"><span className="font-medium text-fg">Route: </span>{g.summary.routeReason}</p>
              {managed && <p className="mt-2 text-slate-600"><span className="font-medium text-fg">Managed app: </span>{managed.text}<Cites ids={managed.sourceIds} /></p>}
            </details>
          </Section>

          {g.permissions.length > 0 && (
            <Section id="permissions" title="Permissions to request" icon={<Icon name="shield" />} hint="The smallest set of scopes that still supports your use case, and what each one does to review.">
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {g.permissions.map((p) => {
                  const k = scopeClass(p.reviewImpact);
                  return (
                    <li key={p.scope} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,220px)_1fr]">
                      <div className="flex flex-wrap items-start gap-2">
                        <code title={p.scope} className="break-all rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800">{p.scope.replace(/^https:\/\/www\.googleapis\.com\/auth\//, "")}</code>
                        {k && <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${k.cls}`}>{k.label}</span>}
                      </div>
                      <div className="text-sm">
                        <p>{p.enables}</p>
                        {p.reviewImpact && <p className="mt-1 text-slate-600">{p.reviewImpact}</p>}
                        <p className="mt-1.5"><EvidenceTag e={p.evidence} /><Cites ids={p.sourceIds} /></p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Section>
          )}

          <Section id="before" title="Before you start" icon={<Icon name="list" />}>
            <div className="grid gap-5">
              {g.prerequisites.length > 0 && (
                <ul className="grid gap-2 text-sm">
                  {g.prerequisites.map((p, i) => (
                    <li key={i} className="flex gap-2.5">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                        <Icon name="check" className="h-3 w-3" />
                      </span>
                      <ClaimLine c={p} />
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-indigo-900"><Icon name="bot" /> An agent can do</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-slate-700">
                    {g.agentVsHuman.agentCan.map((a, i) => <li key={i} className="flex gap-2"><span className="text-indigo-400">•</span>{a}</li>)}
                  </ul>
                </div>
                <div className="rounded-xl border border-line bg-subtle p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Icon name="user" /> You (or an admin) must</p>
                  <ul className="mt-2 grid gap-1.5 text-sm text-slate-700">
                    {g.agentVsHuman.humanMust.map((a, i) => <li key={i} className="flex gap-2"><span className="text-slate-400">•</span>{a}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </Section>

          <Section id="setup-kit" title="Let the agent start it" icon={<Icon name="wand" />} hint="Everything an agent can prepare before you sign in. You review it and click Create.">
            <SetupKit guide={g} />
          </Section>

          <Section id="steps" title="Step by step" icon={<Icon name="layers" />} hint="Tick steps as you go. Progress is saved in this browser only.">
            <Checklist guide={g} />
          </Section>

          <OnComposio guide={g} />

          {g.blockers.length > 0 && (
            <Section id="blockers" title="Blockers and how to recover" icon={<Icon name="alert" />}>
              <ul className="grid gap-3">
                {g.blockers.map((b, i) => (
                  <li key={i} className="rounded-xl border border-line p-4 text-sm">
                    <p className="flex flex-wrap items-center gap-2 font-semibold">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-50 text-rose-600"><Icon name="alert" className="h-3.5 w-3.5" /></span>
                      {b.symptom}
                    </p>
                    <div className="mt-2 grid gap-1 pl-8">
                      <p className="text-slate-600"><span className="font-medium text-fg">Likely cause: </span>{b.cause}</p>
                      <p className="text-slate-600"><span className="font-medium text-fg">Fix: </span>{b.nextAction}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-1.5"><OwnerTag o={b.owner} /><EvidenceTag e={b.evidence} /><Cites ids={b.sourceIds} /></p>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {(g.uncertainties.length > 0 || g.conflicts.length > 0) && (
            <Section id="uncertain" title="What we could not confirm" icon={<Icon name="info" />} hint="Listed so you know where to double-check, instead of us guessing.">
              <ul className="grid gap-2 text-sm text-slate-700">
                {g.conflicts.map((c, i) => <li key={`c${i}`} className="flex gap-2"><span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">Conflict</span>{c}</li>)}
                {g.uncertainties.map((u, i) => <li key={`u${i}`} className="flex gap-2"><span className="text-slate-400">•</span>{u}</li>)}
              </ul>
            </Section>
          )}

          <Section id="evidence" title="Evidence and sources" icon={<Icon name="book" />} hint="Every claim above links here. What we tested, and the pages behind each claim.">
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-subtle p-3 text-xs text-slate-600">
              <span className="font-medium text-fg">Labels:</span>
              <EvidenceTag e="observed" /> seen in a setup attempt
              <EvidenceTag e="documented" /> quoted from official docs
              <EvidenceTag e="secondary" /> non-provider source
              <EvidenceTag e="inferred" /> reasoned from sources
              <EvidenceTag e="unverified" /> not confirmed
            </div>
            {g.attempts.length > 0 && (
              <details className="mb-4 rounded-xl border border-line p-4">
                <summary className="text-sm font-semibold">Setup attempts ({g.attempts.length})</summary>
                <ul className="mt-3 grid gap-3">
                  {g.attempts.map((a, i) => (
                    <li key={i} className="rounded-lg bg-subtle p-3 text-sm">
                      <p className="font-medium">{a.intended} <span className="text-xs font-normal text-muted">· {a.date}</span></p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-600">{a.attempted}</p>
                      <p className="mt-1"><span className="text-muted">Result:</span> {a.result}</p>
                      <p><span className="text-muted">Stopped at:</span> {a.stoppedAt}</p>
                      <p><span className="text-muted">Proves:</span> {a.proves}</p>
                      <p><span className="text-muted">Does not prove:</span> {a.doesNotProve}</p>
                    </li>
                  ))}
                </ul>
              </details>
            )}
            <ol className="grid gap-2 text-sm">
              {g.sources.map((s) => (
                <li key={s.id} id={`src-${s.id}`} className="scroll-mt-24 rounded-xl border border-line p-3 target:border-indigo-300 target:ring-4 target:ring-indigo-100">
                  <p className="flex flex-wrap items-baseline gap-2">
                    <span className="rounded bg-slate-100 px-1.5 font-mono text-[11px] text-slate-600">{s.id}</span>
                    <a href={s.url} target="_blank" rel="noreferrer" className="break-all font-medium text-accent hover:underline">{s.title}</a>
                    <span className="text-xs text-muted">{s.type} · {s.retrieved}</span>
                  </p>
                  {s.note && <p className="mt-1.5 border-l-2 border-indigo-100 pl-3 text-slate-600">“{s.note}”</p>}
                </li>
              ))}
            </ol>
            {g.researchLog.length > 0 && (
              <details className="mt-4">
                <summary className="text-xs font-medium text-accent">Research log ({g.researchLog.length} events)</summary>
                <ol className="mt-2 grid list-decimal gap-0.5 pl-5 font-mono text-xs text-muted">
                  {g.researchLog.map((l, i) => <li key={i} className="break-all">{l}</li>)}
                </ol>
              </details>
            )}
          </Section>

          {llmConfigured() && (
            <Section title="Different use case?" icon={<Icon name="sparkles" />} hint="Re-run the research agent for your own actions and audience.">
              <ResearchForm compact initialProvider={g.provider.name} initialActions="" initialAudience={g.useCase.audience} baseGuideId={g.kind === "seed" ? g.id : undefined} />
            </Section>
          )}
        </div>

        {/* Side nav */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 grid gap-6">
            <nav className="grid gap-0.5 text-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">On this page</p>
              {TOC.filter(([id]) => (id === "permissions" ? g.permissions.length : id === "blockers" ? g.blockers.length : true)).map(([id, label]) => (
                <a key={id} href={`#${id}`} className="rounded-md border-l-2 border-transparent px-3 py-1.5 text-slate-600 hover:border-indigo-300 hover:bg-subtle hover:text-fg">
                  {label}
                </a>
              ))}
            </nav>
            <div className="grid gap-1.5 rounded-xl border border-line bg-subtle p-4 text-xs text-slate-600">
              <p><span className="font-medium text-fg">Last verified</span> {f.verified}</p>
              <p className={f.due ? "font-medium text-rose-600" : ""}>{f.due ? `Review overdue since ${f.nextReview}` : `Next review ${f.nextReview}`}</p>
              <p>{g.kind === "seed" ? "Hand-researched" : "Researched by the agent"} · {g.createdAt.slice(0, 10)}</p>
              <a href={`/g/${g.id}/json`} className="mt-1 font-medium text-accent hover:underline">JSON for agents →</a>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
