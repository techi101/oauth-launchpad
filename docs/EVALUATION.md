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
| The route decision was made by the model without checking whether Composio already provides the app | It now reads Composio's managed OAuth directory (127 toolkits), shows a "Managed app available" or "Not Composio-managed" line, and cites the directory as source C1 | Calendly, Dropbox, Gmail and Linear: available. Xero: not listed, so the guide says bring your own app and also found Xero's 5-connection Starter-tier limit |
| Summary claims (main blocker, testing before review) often had no quote, so they showed as Unverified | The prompt now requires quotes for those fields whenever a source supports them | Calendly's main blocker and testing claims are now *Documented* |
| "Your active work" showed an empty "Estimate:" (Xero) | An empty estimate now reads "Not estimated from the pages read." The prompt asks for a labelled estimate | All 5 regenerated guides have a real estimate, e.g. "about 1-2 hours…" |
| "Agent can" listed coding steps ("exchange code for tokens") | The prompt limits it to setup and approval tasks, and "you must" to things only a person can do | E.g. "fill the registration form fields", "pick and justify the minimal scopes" |
| The phone view looked cut off | Grid children get `min-w-0` and long text wraps. The first screenshot was misleading: headless Chrome's smallest window is 512px, so a 375px frame was used instead | Lays out correctly at 375px |
| `/research` with no input showed an error | It now shows the research form | — |

The production library was regenerated with the final code: Calendly 22/22, Linear 28/28, Dropbox 24/26, Xero 27/27, Gmail send-only 21/22 quotes matched.

## Still unverified or known gaps

- **Calendly cancel scope:** fixed in the second pass (see above). The first run had disclosed the gap correctly instead of inventing an answer.
- **Generated Gmail "send only":** it didn't reach the scopes page, so it couldn't say whether `gmail.send` is sensitive or restricted, and listed that as uncertain. The starter guide has it (sensitive).
- **Review turnaround:** usually not published. Google gives "several weeks" in one place and "several months" in another, and the starter guide quotes both. Slack Marketplace states 10 business days plus up to 10 weeks. Others: "Provider does not publish a turnaround we could verify."
- **CASA assessment fee:** no official figure, so none is quoted.
- **Composio managed apps:** whether they are GitHub Apps, listed on Marketplace, or Google-verified was not confirmed.
- **Registration forms:** never seen while logged in. No app was registered and no review was submitted.
