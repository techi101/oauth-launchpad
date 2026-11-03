import Link from "next/link";
import GuideGrid from "@/components/GuideGrid";
import ResearchForm from "@/components/ResearchForm";
import { llmConfigured } from "@/lib/llm";
import { SEEDS } from "@/lib/seeds";
import { listGenerated, toCard } from "@/lib/store";
import { SNAPSHOT } from "@/lib/composio";

export const dynamic = "force-dynamic";

export default async function Home() {
  const generated = await listGenerated(12);
  const live = llmConfigured();
  return (
    <div className="grid gap-10">
      <section className="grid gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Know what it takes to connect your users&apos; apps.</h1>
        <p className="max-w-2xl text-muted">
          Before your agent can act in Gmail, Slack or GitHub for your users, you may need to register an OAuth app and get it
          approved. Each guide tells you the route, the work, the wait, the blockers, and what an agent can do for you. Every claim is
          labelled by how we know it.
        </p>
      </section>

      <GuideGrid seeds={SEEDS.map(toCard)} generated={generated} />

      <p className="-mt-4 text-sm text-muted">
        Building on Composio? {SNAPSHOT.stats.bringYourOwn} of its {SNAPSHOT.stats.oauthToolkits} OAuth toolkits need your own app.{" "}
        <Link href="/coverage" className="text-accent underline">See which, and what this library covers next</Link>. Agents can read every guide as{" "}
        <a href="/llms.txt" className="underline">llms.txt</a> or <a href="/api/guides" className="underline">JSON</a>.
      </p>

      <section id="research" className="rounded-lg border border-line bg-panel p-5">
        <h2 className="text-lg font-semibold">Research an app</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          An agent reads the provider&apos;s official docs, checks its quotes against them, probes the registration page, and writes a
          shareable guide for your exact use case.
        </p>
        {live ? (
          <ResearchForm />
        ) : (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Live research needs a model API key on the server (GEMINI_API_KEY or DEEPSEEK_API_KEY). The starter guides above still work.
          </p>
        )}
      </section>
    </div>
  );
}
