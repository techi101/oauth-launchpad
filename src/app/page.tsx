import Link from "next/link";
import AppLogo from "@/components/AppLogo";
import GuideGrid from "@/components/GuideGrid";
import Icon from "@/components/Icon";
import ResearchForm from "@/components/ResearchForm";
import { Eyebrow } from "@/components/ui";
import { SNAPSHOT } from "@/lib/composio";
import { llmConfigured } from "@/lib/llm";
import { CURATED, LIBRARY } from "@/lib/seeds";
import { listGenerated, toCard } from "@/lib/store";

export const dynamic = "force-dynamic";

const STEPS = [
  { icon: "search", title: "Pick the app", text: "Choose from the library, or name any app plus what your agent should do and who will connect." },
  { icon: "clock", title: "See the real cost", text: "Your hands-on hours, the provider's review wait, the exact scopes, and the blocker most likely to stop you." },
  { icon: "wand", title: "Let the agent start it", text: "Get a prefilled registration link or every form value ready to paste. You sign in and click Create." },
];

export default async function Home() {
  const cards = CURATED.map(toCard);
  const generated = await listGenerated(9);
  const live = llmConfigured();
  const checked = LIBRARY.reduce((a, g) => a + (g.review?.checked ?? 0), 0);
  const logos = cards.slice(0, 12);

  return (
    <div className="grid gap-20 sm:gap-24 [&>*]:min-w-0">
      {/* Hero */}
      <section className="hero-glow -mx-4 -mt-8 px-4 pb-4 pt-12 text-center sm:-mx-6 sm:-mt-10 sm:px-6 sm:pt-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {cards.length} apps · every claim linked to official docs
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-fg sm:text-6xl sm:leading-[1.05]">
          Know what it takes to connect an app{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-sky-500 bg-clip-text text-transparent">before you build.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
          Your AI agent needs OAuth access to Gmail, Slack or Salesforce. See your hands-on time, the provider&apos;s review wait and the
          blocker most likely to stop you, for your exact use case.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#library" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 hover:bg-accent-strong">
            Browse the library <Icon name="arrow" />
          </a>
          <a href="#research" className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-fg shadow-sm hover:border-slate-300">
            <Icon name="sparkles" className="h-4 w-4 text-accent" /> Research a new app
          </a>
        </div>
        <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-3" aria-label="Apps in the library">
          {logos.map((c) => (
            <Link key={c.id} href={`/g/${c.id}`} title={c.name} className="transition hover:-translate-y-0.5">
              <AppLogo name={c.name} domain={c.domain} size={44} />
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="-mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-sm sm:grid-cols-4">
        {[
          [String(cards.length), "apps with a full guide"],
          [String(checked), "key claims checked by hand"],
          ["1,085", "providers the agent can look up"],
          ["~1 min", "to research a new app live"],
        ].map(([v, l]) => (
          <div key={l} className="bg-white p-5 text-center">
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{v}</p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{l}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="grid gap-8">
        <div className="text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">From &ldquo;can my agent use this app?&rdquo; to a registered app</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-line bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <Icon name={s.icon} className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-muted">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Library */}
      <section id="library" className="grid scroll-mt-24 gap-6 [&>*]:min-w-0">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>App library</Eyebrow>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{cards.length} apps, hardest first</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted">
              GitHub, Slack and Gmail were researched by hand. The rest were written by the research agent, then a person checked their key
              claims against the official docs and fixed what was wrong.
            </p>
          </div>
        </div>
        <GuideGrid seeds={cards} generated={generated} />
      </section>

      {/* Research */}
      <section id="research" className="scroll-mt-24">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 p-[1px] shadow-xl shadow-indigo-500/10">
          <div className="grid gap-8 rounded-[23px] bg-white p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <Eyebrow>Live research</Eyebrow>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Not in the library? Research any app in about a minute.</h2>
              <ul className="mt-6 grid gap-3 text-sm text-slate-700">
                {[
                  "Reads the provider's official developer docs, live",
                  "Checks every quoted claim word for word against its page",
                  "Asks for a website instead of guessing when a name is unclear",
                  "Gives you a shareable guide with a permanent link",
                ].map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-line bg-subtle p-5 sm:p-6">
              {live ? (
                <ResearchForm />
              ) : (
                <p className="text-sm text-muted">Live research needs a model API key on the server. The library above still works.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Composio */}
      <section className="grid gap-6 rounded-3xl border border-line bg-subtle p-6 sm:p-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div>
          <Eyebrow>Building on Composio?</Eyebrow>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Every guide shows how the app plugs into Composio</h2>
          <p className="mt-2 text-sm text-slate-600">
            Managed or bring-your-own, the exact auth-config fields, and the redirect-URI trap that breaks new setups. Data from Composio&apos;s
            public toolkit list ({SNAPSHOT.retrieved}).
          </p>
          <Link href="/coverage" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:gap-2.5 hover:transition-all">
            See which apps need your own OAuth app <Icon name="arrow" />
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            [SNAPSHOT.stats.oauthToolkits, "OAuth toolkits"],
            [SNAPSHOT.stats.managed, "Composio-managed"],
            [SNAPSHOT.stats.bringYourOwn, "need your own app"],
          ].map(([v, l]) => (
            <div key={String(l)} className="rounded-2xl border border-line bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-semibold tracking-tight">{v}</p>
              <p className="mt-1 text-xs text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
