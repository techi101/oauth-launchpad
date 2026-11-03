# Evaluation record (3 Nov 2026)

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

## Still unverified or known gaps

- **Calendly cancel scope:** the generated guide says it couldn't find a scope or endpoint for cancelling meetings in the pages it read. Calendly does document a cancellation endpoint. The agent disclosed the gap correctly but didn't reach the page.
- **Generated Gmail "send only":** it didn't reach the scopes page, so it couldn't say whether `gmail.send` is sensitive or restricted, and listed that as uncertain. The starter guide has it (sensitive).
- **Review turnaround:** usually not published. Google gives "several weeks" in one place and "several months" in another, and the starter guide quotes both. Slack Marketplace states 10 business days plus up to 10 weeks. Others: "Provider does not publish a turnaround we could verify."
- **CASA assessment fee:** no official figure, so none is quoted.
- **Composio managed apps:** whether they are GitHub Apps, listed on Marketplace, or Google-verified was not confirmed.
- **Registration forms:** never seen while logged in. No app was registered and no review was submitted.
