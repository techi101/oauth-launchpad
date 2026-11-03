export const metadata = { title: "How it works · OAuth Launchpad" };

export default function About() {
  return (
    <div className="prose-sm grid max-w-3xl gap-4 text-sm leading-6">
      <h1 className="text-2xl font-semibold">How it works</h1>
      <p>
        <b>The problem.</b> To let users connect an app to your agent, you often register an <i>OAuth app</i> with the provider: one
        registration for your product, after which each user clicks “Allow”. Some providers then require a review before outside users
        can connect, and the rules depend on which permissions you ask for and who your users are.
      </p>
      <p>
        <b>First question: do you need your own app?</b> Platforms such as Composio offer managed OAuth apps for many toolkits. That
        removes registration, but branding, custom scopes, quotas or production policy can still require your own. Each guide starts
        with that route decision.
      </p>
      <p>
        <b>Why three inputs.</b> “Connect Gmail” is too vague. Sending email and reading email need different Google scopes, and the
        reading one triggers a much heavier review. Who connects (just you, your organisation, or external customers) decides whether
        review applies at all. So every guide is written for a specific use case and audience.
      </p>
      <p><b>What the research agent does</b> (no timers; every event you see is a real step):</p>
      <ol className="list-decimal pl-5">
        <li>Resolves the provider using Nango&apos;s open provider catalog as a hint and asks you to pick if the name is ambiguous.</li>
        <li>Plans which official pages to read, then fetches them through a guard that only allows public web addresses.</li>
        <li>Follows links on those pages to fill gaps (scopes, review, distribution, limits).</li>
        <li>Probes the provider&apos;s OAuth metadata and registration page without logging in, and records where it had to stop.</li>
        <li>Drafts the guide using only the pages read. Every claim must carry a verbatim quote.</li>
        <li>Checks each quote against the page it cites. Quotes that don&apos;t match are marked <i>Unverified</i>.</li>
        <li>Saves the guide with a permanent link. Your checklist progress stays in your browser only.</li>
      </ol>
      <p>
        <b>Evidence labels.</b> Observed (seen in a setup attempt) · Documented (quoted from official docs and checked) · Secondary source
        · Inferred · Unverified. There are no confidence percentages. Review times are shown only when a source states them.
      </p>
    </div>
  );
}
