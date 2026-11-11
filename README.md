# OAuth Launchpad

**Know what it takes to connect your users' apps.**

Live: https://oauth-launchpad-omega.vercel.app (mirror for networks that block vercel.app: https://oauth-launchpad.cf-hub.workers.dev)

A developer building an AI agent types an app, what the agent should do with it, and who will connect. They get a shareable guide with:
- the route: a managed OAuth app, your own app, or unresolved
- the work and the provider wait, shown separately
- prerequisites and scopes
- a checklist with an owner for each step
- blockers and how to recover from them
- what an agent can do and where a person takes over
- evidence for every claim

The **library** has three hand-researched starter guides (GitHub, Slack, Gmail) plus agent-written guides that a person spot-checked against their sources (`data/library.json`; each shows a "Reviewed" banner with how many claims were checked). The home page compares them side by side, hardest first: effort, route, hands-on work, review wait and main blocker. A live research agent writes a new guide for any other app.

Every guide also has **"Let the agent start it"**: the registration work an agent can do before a person signs in. Where the provider documents a prefilled registration link, it builds one from the guide's exact permissions: a [Slack app manifest link](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests) or a [GitHub App URL-parameter link](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters). The developer reviews the prefilled page and clicks Create. For every other provider it prepares a paste-ready registration packet (name, redirect URI defaulting to Composio's v3 callback, scopes with their review impact, prerequisites).

## Key product decisions

1. **One guide answers one scenario.** "Connect Gmail" is too vague. Sending email needs `gmail.send` (sensitive scope, verification only). Reading or drafting needs `gmail.readonly` or `gmail.compose` (restricted scopes, plus a security assessment if data reaches your servers). So the form asks three questions: which app, what the agent should do, and who will connect. Those answers change the guide.
2. **The route comes first.** Every guide looks the app up in a dated snapshot of Composio's public toolkit data (`data/composio-toolkits.json`, taken 2026-11-03 from `docs.composio.dev/data/toolkits.json`: 127 managed toolkits) and cites it with that date. It is not a live call; `scripts/build-composio-snapshot.py` refreshes it. Managed OAuth can remove registration entirely. The guide says when that works and when it doesn't. With a managed app, users see the platform's name on the consent screen and share its quota, so the starter guides recommend your own app for an external launch.
3. **Work, wait and deadlines are three separate fields.** Developer effort is always labelled as an estimate. A review wait is shown only when a source states it; otherwise the guide says "Provider does not publish a turnaround we could verify." Deadlines triggered by usage are listed on their own. Example: Dropbox gives you two weeks after your 50th linked user, and that is not a promise about review time.
4. **Evidence labels instead of confidence scores.** Every claim is tagged *Observed*, *Documented*, *Secondary source*, *Inferred* or *Unverified* and linked to its source. The agent has to give a word-for-word quote for every claim, and the server checks each quote against the page it cites. A claim whose quote doesn't match is downgraded to *Unverified*, so it can't pass as fact.
5. **"No approval needed" is never a default.** If the agent finds no approval page, the guide says that and lists it as an uncertainty.
6. **The agent starts the setup, the person finishes it.** Registration needs the developer's own login and legal acceptance, so the agent never signs in or submits. It does everything up to that point: a prefilled create-app link where the provider documents one (Slack, GitHub), otherwise every field value ready to paste.
7. **A reviewed library beats a big unreviewed one.** Generated guides only enter the library after a person checks a sample of their claims against the cited pages; un-reviewed runs are shown separately as "Recent live runs".
8. **Small, real setup attempts.** The agent probes the provider's OAuth discovery document and the registration page without logging in. It records exactly where it stopped, what that proves and what it doesn't.

## Built for Composio specifically

- **On Composio section in every guide.** It comes from a dated snapshot of Composio's public toolkit data and shows:
  - whether the app is managed or bring-your-own
  - a link to Composio's own walkthrough, if one exists
  - the exact auth-config fields
  - a redirect URI warning: 382 of 402 auth configs default to the legacy v1 callback, while the docs say to register v3
  - how many scopes the auth config requests by default, and advice to trim them
  - the `auth_configs` session snippet
  - a "verify with one real call" step
  - known GitHub issues for that toolkit
- **`/coverage`** ranks the 275 bring-your-own toolkits for the 100-guide library, with the method shown, and reports supply-health numbers.
- **Agent endpoints:** `/llms.txt`, `/api/guides?q=`, `/g/<id>/json` and `/g/<id>/md`. Composio's own agents could read these.
- **Freshness:** each guide has a last-verified date, a staggered next review and a one-click re-check.
- **[`docs/FINDINGS_FOR_COMPOSIO.md`](docs/FINDINGS_FOR_COMPOSIO.md):** what the data shows about Composio's toolkit supply.

## How the live agent works (`src/lib/research.ts`)

The steps are bounded, and each event in the UI is a real step (there are no fake progress timers):

1. **Resolve:** match the name against Nango's open catalog of 1,085 providers to find the auth mode, OAuth endpoints and doc links. If the name is ambiguous or unknown, ask the user instead of guessing.
2. **Plan:** the model proposes official doc URLs. Each one is only used after a real fetch confirms it exists.
3. **Read:** fetch pages through `safeFetch`, which allows public http(s) only and re-checks every redirect hop. Private, loopback and metadata IP addresses are blocked. JavaScript-heavy docs fall back to the Jina Reader.
4. **Follow links:** up to two rounds. The model picks links from the pages already read, aimed at the remaining gaps.
5. **Probe and check managed status:** three read-only attempts. Check for an OIDC discovery document, call the authorize endpoint with a client ID that can't exist (does the provider reject unregistered apps?), and load the registration page without logging in. Then look the toolkit up in the Composio snapshot.
6. **Draft:** the model writes the guide using only the numbered sources it read, with a quote for every claim.
7. **Verify:** check every quote against its source, remove links that aren't official, and validate the result against the zod schema.
8. **Save:** store the guide in Vercel Blob at a permanent link, `/g/<id>`.

Models: Gemini (free tier) first, then DeepSeek as a backup, then Gemini Flash-Lite as a last resort. The free Gemini tier often returns 503 under load, and a live demo can't depend on it. Page text is passed to the model as untrusted data, and the prompts tell it to ignore any instructions inside pages.

## Setup

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY and/or DEEPSEEK_API_KEY
npm run dev                  # http://localhost:3000
npm test                     # unit tests: SSRF guard, quote check, catalog match, Composio snapshot, freshness, scrub, seed integrity, model-output tolerance, setup-kit links
python scripts/build-composio-snapshot.py toolkits.json auth.md   # refresh the Composio snapshot (needs gh)
npm run typecheck
npm run research -- "Calendly" "Read upcoming meetings and cancel them" external   # same agent from the terminal
```

Without `BLOB_READ_WRITE_TOKEN`, local dev saves generated guides to `./.data/guides`. Production refuses to save without Blob, because serverless disk doesn't persist. Without a model key, the starter guides still work, and the research form explains that live research isn't configured.

**Deploy (Vercel):** `vercel link`, then `vercel blob create-store <name> --access public`, then `vercel env add GEMINI_API_KEY production` (and optionally `DEEPSEEK_API_KEY`), then `vercel deploy --prod`. Research routes set `maxDuration = 300`.

## Docs

- [`docs/EVIDENCE_LOG.md`](docs/EVIDENCE_LOG.md): sources checked, setup attempts and corrections for GitHub, Slack, Gmail and Dropbox
- [`docs/EVALUATION.md`](docs/EVALUATION.md): what passed, what was corrected, what is still unverified
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md): a 5-minute demo

## Limitations

- **Search:** there is no web search by default. Discovery uses the catalog, the official domain and link following. Setting `TAVILY_API_KEY` or `BRAVE_API_KEY` adds search. Without it, an app outside the catalog that has no website can end up partial.
- **Generated vs. starter guides:** generated guides are only as good as the pages the agent reached. The quote check confirms that a quote really is on the cited page. It does not confirm the agent read every relevant page. Example: the generated Gmail "send only" guide missed the scopes page.
- **Setup attempts are unauthenticated.** No app was registered and no approval was requested. The guides never claim either.
- **Checklist progress** is stored only in each visitor's browser. The rate limit is per server instance.
- The SSRF guard checks DNS before each fetch but doesn't pin the IP address, so DNS rebinding is still possible in theory.
- Nango's catalog is used under ELv2 and read at runtime as discovery hints only. It is never presented as proof of a provider's rules.
