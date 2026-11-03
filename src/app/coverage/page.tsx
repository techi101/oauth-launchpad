import Link from "next/link";
import { loadCatalog } from "@/lib/catalog";
import { SNAPSHOT, findToolkit } from "@/lib/composio";
import { freshShare } from "@/lib/freshness";
import { SEEDS } from "@/lib/seeds";
import { listGenerated } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Coverage · OAuth Launchpad" };

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]/g, "");

export default async function Coverage() {
  const generated = await listGenerated(100);
  const ours = new Map<string, string>();
  for (const g of [...SEEDS.map((s) => ({ id: s.id, name: s.provider.name })), ...generated.map((g) => ({ id: g.id, name: g.name }))]) {
    const t = findToolkit(g.name);
    if (t && !ours.has(t.slug)) ours.set(t.slug, g.id);
  }
  let nango = new Set<string>();
  try {
    nango = new Set((await loadCatalog()).flatMap((e) => [norm(e.displayName), norm(e.key)]));
  } catch {
    /* catalog optional */
  }
  const fresh = freshShare([...SEEDS, ...generated.map((g) => ({ id: g.id, createdAt: g.createdAt }))]);

  // Priority for the 100-guide library: apps every developer must register themselves,
  // that Composio has no walkthrough for, weighted by demand/pain signals.
  const ranked = SNAPSHOT.toolkits
    .filter((t) => !t.managed)
    .map((t) => {
      const inNango = nango.has(norm(t.name)) || nango.has(norm(t.slug));
      const score = (t.composioGuide ? 0 : 10) + t.issueCount * 4 + (inNango ? 3 : 0) + Math.log10(1 + t.toolCount) * 2;
      return { t, inNango, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  const s = SNAPSHOT.stats;
  const tiles: [string, string | number, string][] = [
    ["OAuth toolkits on Composio", s.oauthToolkits, "with an OAuth auth scheme"],
    ["Composio-managed", s.managed, "developer can skip registration"],
    ["Bring your own app", s.bringYourOwn, "every developer must register"],
    ["…with no Composio walkthrough", s.byoWithoutGuide, `Composio has ${s.composioGuides} own-app guides`],
    ["Default to legacy v1 redirect", s.defaultRedirectLegacyV1, "auth-config Redirect URI field; docs say register v3"],
    ["Guides fresh (in review window)", `${Math.round(fresh * 100)}%`, `${SEEDS.length + generated.length} guides here`],
  ];

  return (
    <div className="grid min-w-0 gap-6 [&>*]:min-w-0">
      <div>
        <p className="text-sm text-muted"><Link href="/" className="underline">Guides</Link> / Coverage</p>
        <h1 className="mt-1 text-2xl font-semibold">Which 100 apps, and why</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          A guide matters most where a developer has no shortcut: the app has no Composio-managed OAuth, so registration (and any provider
          review) is on them. This page ranks those apps from Composio&apos;s public toolkit data (snapshot {SNAPSHOT.retrieved}) so the library
          grows where it removes the most work.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 [&>*]:min-w-0">
        {tiles.map(([label, value, sub]) => (
          <div key={label} className="rounded-lg border border-line bg-panel p-4">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm font-medium">{label}</p>
            <p className="text-xs text-muted">{sub}</p>
          </div>
        ))}
      </div>

      <section className="rounded-lg border border-line bg-panel p-5 text-sm">
        <h2 className="font-semibold">Ranking method</h2>
        <ul className="mt-2 grid list-disc gap-1 pl-5 text-muted">
          <li>Only <b>bring-your-own-app</b> toolkits are ranked ({s.bringYourOwn}). Managed toolkits still get guides on request, but a developer can start without one.</li>
          <li><b>+10</b> if Composio has no own-app walkthrough for it (composio.dev/auth covers {s.composioGuides}).</li>
          <li><b>+4 per GitHub issue</b> in ComposioHQ/composio whose title names the toolkit (last {s.issuesScanned} issues). This signal is sparse: most toolkits have none.</li>
          <li><b>+3</b> if Nango also supports it (a second integration platform found it worth supporting).</li>
          <li><b>+2 × log10(tools)</b>: how much of the toolkit Composio already exposes. A tie-breaker, not demand.</li>
          <li>Not used yet, and the next thing to add: Composio&apos;s own connection-attempt and failure counts per toolkit, which only Composio has.</li>
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-panel p-5">
        <h2 className="font-semibold">Next 100 guides</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="py-1 pr-3">#</th>
                <th className="py-1 pr-3">Toolkit</th>
                <th className="py-1 pr-3">Category</th>
                <th className="py-1 pr-3">Composio guide</th>
                <th className="py-1 pr-3">Issues</th>
                <th className="py-1 pr-3">Nango</th>
                <th className="py-1 pr-3">Tools</th>
                <th className="py-1">Guide here</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map(({ t, inNango }, i) => (
                <tr key={t.slug} className="border-t border-line">
                  <td className="py-1.5 pr-3 text-muted">{i + 1}</td>
                  <td className="py-1.5 pr-3 font-medium">{t.name}</td>
                  <td className="py-1.5 pr-3 text-muted">{t.category}</td>
                  <td className="py-1.5 pr-3">{t.composioGuide ? <a className="text-accent underline" href={t.composioGuide}>yes</a> : "none"}</td>
                  <td className="py-1.5 pr-3">{t.issueCount || ""}</td>
                  <td className="py-1.5 pr-3">{inNango ? "yes" : ""}</td>
                  <td className="py-1.5 pr-3 text-muted">{t.toolCount}</td>
                  <td className="py-1.5">
                    {ours.has(t.slug) ? (
                      <Link className="text-accent underline" href={`/g/${ours.get(t.slug)}`}>open</Link>
                    ) : (
                      <Link className="text-accent underline" href={`/research?${new URLSearchParams({ provider: t.name, actions: "Read and write the user's data", audience: "external" })}`}>research</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
