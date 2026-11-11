# Evaluation record (3 Nov 2026, second review pass included)

## Spec checks

| Check | Result | How |
|---|---|---|
| Three starter guides render and can be searched | Pass | `/g/github`, `/g/slack` and `/g/gmail` return 200 on production. Search on the home page filters cards on the client. |
| Starter guides are internally consistent | Pass | `npm test`: schema validation, no dangling source IDs, every source is https, Markdown export works |
| Live research works for apps not in the library | Pass | Calendly, Zoho, Dropbox, Mercury and Gmail (new use case) ran locally. Linear ran on **production** in 82 s, was saved to Blob, and `/g/linear-mw0scugj` returns 200 |
| Guide changes with use case and audience | Pass | Gmail starter (read + draft, external): restricted scopes, CASA security assessment. Generated Gmail (send only, personal): `gmail.send`, test-user cap of 100, 7-day refresh tokens in testing mode, unverified-app screen |
| Ambiguous or unknown apps handled honestly | Pass | "Flurbix" (made up): the agent stopped, asked for the website and wrote no guide. A name with several catalog products shows a picker. "Zoho" listed sibling products and used the use case to pick Zoho CRM. |
| Partial results when the model fails | Pass | With all Gemini models returning 503, the guide was saved as **Partial** with only the official pages it read, route "unresolved" and nothing invented |
| Claims checked against sources | Pass | Quotes matched their sources: Calendly 25/25, Zoho 22/22, Dropbox 24/25 (1 downgraded to Unverified), Gmail 26/26, Mercury 16/16, Linear 23/23 |
| Share links work outside the research session | Pass | `/g/<id>` is rendered on the server from Blob. The Markdown download is at `/g/<id>/md` |
| Checklist progress | Pass (by design) | Stored in `localStorage` per guide. It never writes to the shared guide |
| No secrets in the bundle or repo | Pass | Keys are read only in server modules (`llm.ts`, `store.ts`). `.env*` is gitignored, and `git grep` finds no key patterns |
| Build and types | Pass | `next build` and `tsc --noEmit` both clean |

## Manual cross-checks against official sources

| Claim | Source checked | Verdict |
|---|---|---|
| Slack: new non-Marketplace apps get 1 request/min and max 15 objects on `conversations.history`/`replies`, existing installs not affected | docs.slack.dev changelog, 29 May 2025 | Confirmed word for word. The starter guide flags a conflict with the method page, which still says Tier 3 |
| Gmail: `gmail.compose` and `gmail.readonly` are restricted, `gmail.send` is sensitive | developers.google.com Gmail scopes page | Confirmed |
| Dropbox: no review until 50 linked users, then two weeks before new links freeze | Dropbox developer guide (starter-guide research and the generated guide, done independently) | Both found and quoted it. The generated guide correctly calls it a policy deadline, not a review time |

## What was corrected during the build

- **Probe wording:** the registration probe called any 3xx redirect "sign-in required". Calendly's portal redirected to a docs page, not a login. Now only a redirect to a login, auth or account address counts as a login wall.
- **Unparseable model output:** the model sometimes returned plain strings, or numbers where objects were expected, and the whole guide failed to parse. Parsing is now tolerant: plain strings are wrapped with no quote (so they can never count as *Documented*) and bad list items are dropped.
- **Wrong "Partial" label:** Dropbox was marked Partial because the model answered "OAuth: unclear", even though Nango lists it as OAuth2 and it quoted OAuth steps. OAuth support now also counts when the catalog says OAuth2, official pages were read, and at least 3 claims are documented. The log records when this rule applied.
- **Weak first draft:** the first Calendly draft (Flash-Lite) had one scope and no blockers. Stronger models are now tried first, and the prompt requires every scope the actions need and 2–5 blockers. The redo had both scopes, 5 blockers and 25/25 quotes matched.
- **OAuth-support rule too narrow:** an adapted Gmail run on production (send only, testing) came out "Unresolved" because the rule only counted quotes in four fields. It now counts verified quotes anywhere in the guide. The rerun says register your own app, with `gmail.send` marked sensitive. The bad run was removed from the library.
- **Model outages:** the free Gemini tier returned 503 on long requests for minutes at a time. Added retries across models, a pause between tries, and the DeepSeek backup.

## Second review pass (same day)

| Found | Fix | Result |
|---|---|---|
| The Calendly guide missed the cancel endpoint. Links were only followed when they matched OAuth words, so "cancel" links were never considered | Words from the requested actions now also count when choosing links and when picking which parts of a page the model sees | The rerun read Calendly's *Cancel Event* and *Create Scheduled Event Cancellation* pages and listed `scheduled_events:read` and `scheduled_events:write` |
| The route decision was made by the model without checking whether Composio already provides the app | It now checks a dated snapshot of Composio's managed OAuth data (127 toolkits; not a live call), shows a "Managed app available" or "Not Composio-managed" line, and cites the directory as source C1 | Calendly, Dropbox, Gmail and Linear: available. Xero: not listed, so the guide says bring your own app and also found Xero's 5-connection Starter-tier limit |
| Summary claims (main blocker, testing before review) often had no quote, so they showed as Unverified | The prompt now requires quotes for those fields whenever a source supports them | Calendly's main blocker and testing claims are now *Documented* |
| "Your active work" showed an empty "Estimate:" (Xero) | An empty estimate now reads "Not estimated from the pages read." The prompt asks for a labelled estimate | All 5 regenerated guides have a real estimate, e.g. "about 1-2 hours…" |
| "Agent can" listed coding steps ("exchange code for tokens") | The prompt limits it to setup and approval tasks, and "you must" to things only a person can do | E.g. "fill the registration form fields", "pick and justify the minimal scopes" |
| The phone view looked cut off | Grid children get `min-w-0` and long text wraps. The first screenshot was misleading: headless Chrome's smallest window is 512px, so a 375px frame was used instead | Lays out correctly at 375px |
| `/research` with no input showed an error | It now shows the research form | — |

The production library was regenerated with the final code: Calendly 22/22, Linear 28/28, Dropbox 24/26, Xero 27/27, Gmail send-only 21/22 quotes matched.

## Third pass: research into Composio and this space

The research covered Composio's docs, pricing, toolkit data, GitHub issues and job posts, plus competitors (Nango, verapli, Unified.to, Pipedream, Arcade, Scalekit, Paragon). Before building on them, I re-checked these claims myself:
- the v3 and v1 redirect URIs (white-labelling docs)
- the 63 own-app guides (composio.dev/auth)
- issue #4392 (open)
- the Hobby plan's limit of 20,000 calls on managed apps (pricing page)
- the toolkit API needs a key (401), so the public `toolkits.json` is used instead

| Added | Why (brief / role) |
|---|---|
| "On Composio" section on every guide | The developer's real path runs through a Composio auth config. The redirect URI and scope details come from Composio's data, not the model |
| `/coverage` ranking of 275 bring-your-own toolkits | Answers "which 100?" with a stated method. The APM role is measured on supply and supply health |
| Authorize probe with a made-up client ID | More setup actually attempted. Dropbox redirected to `authorize_error` and Xero to an error page, so registration is required. A false positive (matching `client_id` inside Calendly's redirect URL) was caught and fixed |
| JSON, `llms.txt`, guide index API | Guides that agents can read |
| Staggered review dates and re-check link | Composio's own KB has a "review cliff" (#4331) |
| Cloudflare Worker mirror | The user's network couldn't open `*.vercel.app`. The reviewers' network might not either |
| Scrub step | Two production guides showed `[object Object]` in "Uncertain". Junk list items are now dropped before saving and hidden in older guides |

The production library was regenerated after this pass: Calendly, Gmail (send only), Xero, Linear and Dropbox. Duplicates were removed.

## Still unverified or known gaps

- **Calendly cancel scope:** fixed in the second pass (see above). The first run had disclosed the gap correctly instead of inventing an answer.
- **Generated Gmail "send only":** it didn't reach the scopes page, so it couldn't say whether `gmail.send` is sensitive or restricted, and listed that as uncertain. The starter guide has it (sensitive).
- **Review turnaround:** usually not published. Google gives "several weeks" in one place and "several months" in another, and the starter guide quotes both. Slack Marketplace states 10 business days plus up to 10 weeks. Others: "Provider does not publish a turnaround we could verify."
- **CASA assessment fee:** no official figure, so none is quoted.
- **Composio managed apps:** whether they are GitHub Apps, listed on Marketplace, or Google-verified was not confirmed.
- **Registration forms:** never seen while logged in. No app was registered and no review was submitted.

## Third pass (11 Nov 2026): live reliability, library review, setup kit

### Live failures found and fixed

| Found on production | Cause | Fix | Check |
|---|---|---|---|
| Zoom and HubSpot guides fell back to **Partial** | The model returned `nextAction` (and sometimes other text fields) as an object, and one field failed the whole guide | Text fields flatten objects/arrays; a required field that is empty drops only that item | New unit test; Zoom rerun on production in 59 s, complete, 6/6 source notes found on the live pages |
| Shopify run ended in 11 s with "model unavailable" | The *plan* step's answer had an unexpected shape (string URLs, string booleans) and the parse error was reported as an outage | Tolerant plan parsing plus one automatic retry; an empty plan is treated as a failure, not a guide | New unit test; Shopify rerun complete, 26/27 quotes matched |

### Library: 18 agent guides reviewed by hand

Every library guide was generated live on production (`POST /api/research`, external-customer use case), then a reviewer checked its 5 most important claims (main blocker, review requirement, testing before review, key scopes, deadlines/costs) against the provider's official pages, opening the pages fresh rather than trusting the agent's notes. Corrections were applied with the official URL and a verbatim quote as a new source, and each guide shows a "Reviewed" banner with its notes. Result: **90 key claims checked, 74 right as the agent wrote them, 16 corrected or marked unconfirmed.** No guide was excluded.

What the review caught (the agent's quote check alone could not, because the quotes were real but the conclusion was wrong or incomplete):

| App | Correction |
|---|---|
| Spotify | Missed the real blocker: since 15 May 2025 extended quota is only for registered organisations with 250k+ monthly active users; development mode allows 5 allowlisted users. Spotify does publish a review time (up to six weeks). Difficulty raised to high |
| Google Drive | `drive.readonly` and `drive.metadata.readonly` are **Restricted**, not Sensitive / Non-sensitive; restricted data on servers needs a security assessment. A Portuguese limits page was removed |
| LinkedIn | Member posting is the self-serve *Share on LinkedIn* product (`w_member_social`); the vetted Community Management API is for company Pages. `liteprofile` replaced by OpenID Connect `openid profile`. Difficulty lowered to medium |
| Asana | Review is needed for any workspace outside your organisation, not only the App Directory |
| Jira | Atlassian review is optional for 3LO apps (enable sharing; unreviewed apps show a warning); 10–15 business days applies to Marketplace listings |
| Microsoft Outlook | Blocker cited an Entra External ID line that does not apply; delegated `Mail.Send` / `Mail.Read` do not need admin consent by default |
| Salesforce | Added `refresh_token` scope so the agent keeps working after the access token expires |
| X | Added `offline.access` (without it, no refresh token and 2-hour tokens); developer access is self-serve at the console, not an application |
| Strava | The athlete limit is published: 1 athlete by default, 10 on request, review beyond that |
| Instagram, Shopify, QuickBooks, Xero, Zoom, Google Calendar, HubSpot | Smaller fixes: testing-before-review wording, Shopify's $19 App Store fee and 1 Jan 2027 delisting for non-expiring tokens, Xero tier prices, English source URLs, evidence labels raised or lowered to match what the page says |

Still unconfirmed and shown as such: Discord's verification threshold (two official pages disagree: 100 servers vs 10,000 users), most providers' review turnaround, and Zoom's pre-review testing rules.

### Setup kit ("Let the agent start it")

- Slack: a manifest link (`api.slack.com/apps?new_app=1&manifest_json=…`, format from Slack's manifest docs) carrying the guide's exact bot scopes and the redirect URI. Unit test decodes the manifest and checks scopes and redirect.
- GitHub: a GitHub App registration link with URL parameters (`github.com/settings/apps/new?name=…&callback_urls[]=…&contents=read&issues=write`, format from GitHub's docs). Unit test checks every parameter.
- All other providers: a paste-ready registration packet. The agent never signs in or clicks Create.
- Not yet done: a signed-in run that actually creates the Slack and GitHub apps from these links (needs the developer's own login).
