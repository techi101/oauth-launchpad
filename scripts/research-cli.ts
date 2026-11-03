/**
 * Run the live research agent from the terminal (same code path as the website).
 *   npm run research -- "Calendly" "Read upcoming meetings and cancel them" external
 * Writes the guide to ./.data/guides (local storage mode) and prints events.
 */
import { runResearch } from "../src/lib/research";
import { saveGuide } from "../src/lib/store";
import type { Audience } from "../src/lib/schema";

const [provider, actions = "Read and write the user's data", audience = "external", website = ""] = process.argv.slice(2);
if (!provider) {
  console.error('Usage: npm run research -- "<app>" "<actions>" [personal|internal|external] [website]');
  process.exit(1);
}
async function main() {
const t0 = Date.now();
const g = await runResearch({ provider, actions, audience: audience as Audience, website }, (e) => {
  const s = Math.round((Date.now() - t0) / 1000);
  if (e.type === "source") console.log(`${s}s  source ${e.official ? "[official]" : "[other]"} ${e.url}`);
  else if (e.type === "ambiguous") console.log(`${s}s  AMBIGUOUS ${e.text}`, e.candidates.map((c) => c.name).join(" | "));
  else if (e.type !== "done") console.log(`${s}s  ${e.type}: ${e.text}`);
});
if (g) {
  await saveGuide(g);
  const count = (x: { evidence: string }[]) => x.reduce<Record<string, number>>((a, c) => ((a[c.evidence] = (a[c.evidence] ?? 0) + 1), a), {});
  const all = [g.summary.mainBlocker, g.summary.testingBeforeReview, g.timing.reviewWait, ...g.prerequisites, ...g.permissions, ...g.blockers, ...g.phases.flatMap((p) => p.steps)];
  console.log(`\nSaved ${g.id} status=${g.status} route=${g.summary.route} difficulty=${g.summary.difficulty} sources=${g.sources.length} attempts=${g.attempts.length}`);
  console.log("Evidence mix:", count(all));
  console.log("Review wait:", g.timing.reviewWait.text);
  console.log("Next action:", g.summary.nextAction);
}
}
main().catch((e) => { console.error(e); process.exit(1); });
