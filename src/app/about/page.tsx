import Link from "next/link";
import Icon from "@/components/Icon";
import { EvidenceTag } from "@/components/ui";

export const metadata = { title: "How it works · OAuth Launchpad" };

const IDEAS = [
  {
    icon: "key",
    title: "The problem",
    text: "To let users connect an app to your agent, you register an OAuth app with the provider once, then each user clicks “Allow”. Some providers add a review before outside users can connect, and the rules depend on the permissions you ask for and who your users are.",
  },
  {
    icon: "route",
    title: "First question: do you need your own app?",
    text: "Platforms such as Composio offer managed OAuth apps for many apps. That removes registration, but branding, custom scopes, quotas or production policy can still require your own. Every guide starts with that decision.",
  },
  {
    icon: "layers",
    title: "Why three inputs",
    text: "“Connect Gmail” is too vague. Sending and reading email need different Google scopes, and reading triggers a much heavier review. Who connects (just you, your organisation, or external customers) decides whether review applies at all.",
  },
];

const AGENT = [
  ["Resolve", "Looks the app up in Nango's open catalog of 1,085 providers, and asks you to pick if the name is ambiguous."],
  ["Plan", "Picks the official pages to read and fetches them through a guard that only allows public web addresses."],
  ["Follow links", "Reads further pages to fill gaps: scopes, review, distribution, rate limits."],
  ["Probe", "Checks the provider's OAuth metadata and registration page without logging in, and records where it had to stop."],
  ["Draft", "Writes the guide from the pages read only. Every claim must carry a word-for-word quote."],
  ["Verify", "Checks each quote against the page it cites. A quote that doesn't match is marked Unverified."],
  ["Save", "Stores the guide at a permanent link. Your checklist progress stays in your browser only."],
];

export default function About() {
  return (
    <div className="mx-auto grid max-w-4xl gap-14">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">How it works</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">One guide per app, use case and audience</h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          OAuth Launchpad tells a developer what it really takes to let their agent act in another app, and labels how it knows each
          claim.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {IDEAS.map((x) => (
          <div key={x.title} className="rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon name={x.icon} className="h-5 w-5" />
            </span>
            <h2 className="mt-4 font-semibold">{x.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{x.text}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-2xl font-semibold tracking-tight">What the research agent does</h2>
        <p className="mt-1 text-sm text-muted">No fake progress bars: every event you see during a run is a real step.</p>
        <ol className="relative ml-3.5 mt-6 grid gap-4 border-l border-line pl-8">
          {AGENT.map(([t, d], i) => (
            <li key={t} className="relative">
              <span className="absolute -left-[46px] top-0 inline-flex h-7 w-7 items-center justify-center rounded-full bg-fg text-xs font-semibold text-white ring-4 ring-white">
                {i + 1}
              </span>
              <p className="font-semibold">{t}</p>
              <p className="text-sm text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-line bg-subtle p-6">
        <h2 className="text-lg font-semibold">How we label every claim</h2>
        <p className="mt-1 text-sm text-muted">No confidence percentages. Review times are shown only when the provider states them.</p>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          {(
            [
              ["observed", "Seen during a real setup attempt"],
              ["documented", "Quoted from the provider's official docs, quote checked"],
              ["secondary", "From a non-provider source, such as an integration platform"],
              ["inferred", "Reasoned from the sources, not stated directly"],
              ["unverified", "Could not be confirmed from any source"],
            ] as const
          ).map(([e, d]) => (
            <p key={e} className="flex items-center gap-3">
              <EvidenceTag e={e} /> <span className="text-slate-600">{d}</span>
            </p>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/#library" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-strong">
          Browse the library <Icon name="arrow" />
        </Link>
        <Link href="/#research" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold hover:border-slate-300">
          Research an app
        </Link>
      </div>
    </div>
  );
}
