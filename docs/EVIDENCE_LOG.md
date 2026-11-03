# Evidence log

Research date: 2026-11-03. All official pages fetched that day with WebFetch or curl (raw `.md` exports for Slack and GitHub docs where available). Nothing was logged into or submitted.

Labels: **official** = provider docs; **secondary** = integration platform or third party; **observation** = our own unauthenticated request.

---

## GitHub

### Sources checked

| URL | Type | Supports |
|---|---|---|
| https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps | official | "In general, GitHub Apps are preferred over OAuth apps"; fine-grained permissions; OAuth apps "have lower rate limits and do not scale"; org app policies don't apply to GitHub Apps. |
| https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions | official | Restrictions "enabled by default" for new orgs; members can request owner approval. |
| https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app | official | Form fields; up to 100 OAuth apps per owner; up to 10 callback URLs; "Expire user access tokens" enabled by default; no review step described. |
| https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app | official | Name unique, max 34 chars; up to 10 callback URLs; "Only on this account" vs "Any account"; OAuth-during-install option. No review described. |
| https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app | official | User token limited to permissions both user and app have; 8 h expiry; refresh token 6 months. |
| https://docs.github.com/en/apps/using-github-apps/requesting-a-github-app-from-your-organization-owner | official | Members request; GitHub emails org owner; owner decides and can change repos. |
| https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps | official | `repo` = full access to public and private repos; no read-only private repo scope. |
| https://docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps | official | Marketplace is a way to share; paid plans need publisher verification; only org-owned apps can sell. Does not state outright that listing is optional. |
| https://docs.composio.dev/toolkits/managed-auth | secondary | GITHUB listed under Composio-managed OAuth. |
| https://docs.composio.dev/docs/authentication/custom-app-vs-managed-app | secondary | Managed shows Composio's name and shares quota. |

### Attempts

- `curl -sI https://github.com/settings/applications/new` -> `302 Found`, `Location: https://github.com/login?return_to=...applications%2Fnew`.
- `curl -sI https://github.com/settings/apps/new` -> `302 Found`, `Location: https://github.com/login?return_to=...apps%2Fnew`.
- Stopped at login. Proves the forms need a GitHub session. Does not prove current field layout.

### Corrections vs common assumptions

- "OAuth Apps allow one callback URL and tokens never expire": current docs say up to 10 callback URLs and expiring user tokens are on by default for new OAuth Apps.
- "No provider review" is *inferred*: GitHub docs describe no review step, but no page says "there is no review" in so many words.
- "Marketplace listing is optional" is *inferred* from docs describing it as a way to share; the page does not use the word optional.

---

## Slack

### Sources checked

| URL | Type | Supports |
|---|---|---|
| https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps | official | For commercially distributed non-Marketplace apps created on or after 29 May 2025, and new installs of existing ones: conversations.history/replies at 1 request/minute, limit max/default 15. Marketplace and internal customer-built apps unaffected. Existing installs "will not be impacted". API ToS: Marketplace is "the only appropriate channel" for commercial distribution; unlisted apps "are for development and testing". Slack does not charge for Marketplace inclusion. |
| https://docs.slack.dev/apis/web-api/rate-limits | official | chat.postMessage about 1 message/second/channel with bursts. Page does not mention the non-Marketplace exception. |
| https://docs.slack.dev/reference/methods/conversations.history | official | Scopes `channels:history` etc.; still lists Tier 3 (50+/min) and limit under 1000. |
| https://docs.slack.dev/distribution | official | Default install is single workspace; OAuth needed for others; "Activate Public Distribution"; unlisted for pilots; Marketplace apps reviewed; some workspaces allow only admin installs or only Marketplace apps. |
| https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide | official | Needs 10+ active workspaces (used in past 28 days); preliminary review up to 10 business days; functional review up to 10 weeks new / 6 weeks resubmissions; cannot be accelerated; demo video and test credentials required. |
| https://docs.slack.dev/authentication/installing-with-oauth | official | `scope` -> bot token (xoxb), `user_scope` -> user token (xoxp); oauth.v2.access. |
| https://docs.slack.dev/reference/scopes/channels.history, .../chat.write | official | channels:history = public channels the app was added to; chat:write supports bot tokens. |
| https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace | official | "Only allow pre-approved apps"; members can request; requests go to owners or app managers. |
| https://docs.composio.dev/toolkits/managed-auth | secondary | SLACK listed under Composio-managed OAuth. |
| Web search summary (dev.to write-up and search engine summary) | secondary | Claimed existing installs lose limits on 3 March 2026. **Not used**: not found on any official page; current changelog says the opposite. |

Note: the old URL https://docs.slack.com/changelog/2025/05/29/... returned 404; the live page is on docs.slack.dev.

### Attempts

- `curl -sI https://api.slack.com/apps` -> `200 OK`. Full GET title "Slack API: Applications | Slack", page asks to "sign in to your Slack account".
- `curl -sI https://api.slack.com/apps/new` -> `301`, `location: https://api.slack.com/apps?new_app=1`.
- Stopped at sign-in prompt. Proves the dashboard is live and needs a session. A 200 here does not mean open access.

### Corrections vs common assumptions

- "Distributed apps just work at normal rate limits": not for new unlisted commercial apps reading history since 29 May 2025 (1/min, 15 objects).
- "Marketplace is purely optional": technically you can distribute unlisted, but Slack's API terms now call the Marketplace the only appropriate channel for commercial distribution, and it is the only way out of the history limits.
- "Marketplace review takes a few days": Slack publishes up to 10 business days plus up to 10 weeks, and requires 10 active workspaces before you can submit.
- Conflict kept in the guide: method reference page still shows Tier 3; changelog wins as the more specific statement.

---

## Gmail / Google

### Sources checked

| URL | Type | Supports |
|---|---|---|
| https://developers.google.com/workspace/gmail/api/auth/scopes | official | gmail.readonly Restricted; gmail.compose Restricted ("Manage drafts and send emails"); gmail.send Sensitive; gmail.modify and gmail.metadata Restricted. |
| https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification | official | Security assessment by Google-empanelled assessors (CASA) when restricted data accessed from or through a server; at least every 12 months after LOA approval; "can potentially take several weeks"; brand verification first, "typically takes 2-3 business days"; permitted app types; exceptions (personal use, internal use, testing). |
| https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification | official | Per-scope justification, unlisted YouTube demo; "can take up to 10 days to complete". |
| https://developers.google.com/identity/protocols/oauth2/production-readiness/brand-verification | official | Search Console domain verification; public homepage; privacy policy on same domain; automated check minutes, manual 2-3 business days. |
| https://developers.google.com/identity/protocols/oauth2 | official | External + Testing -> refresh token expiring in 7 days (unless only name/email/profile); 100 refresh tokens per account per client; Gmail-scope tokens revoked on password change. |
| https://support.google.com/cloud/answer/15549945 | official | Testing limited to 100 test users; test user consumes quota once added; Internal vs External. |
| https://support.google.com/cloud/answer/7454865 | official | Unverified apps limited to 100 new users; verification "might require several months" depending on data sensitivity. |
| https://support.google.com/cloud/answer/13464321 | official | Sensitive/restricted need verification; restricted need annual assessment. No timelines. |
| https://support.google.com/cloud/answer/9110914 | official | Restricted apps re-verify annually. No fees or times stated. |
| https://developers.google.com/workspace/gmail/api/policy | official | Permitted Gmail app types (incl. productivity enhancement); no humans reading data without consent; no training general AI/ML models. |
| https://appdefensealliance.dev/casa | official (framework owner) | Risk-based multi-tier approach. No fees, durations or tiers on that page. |
| Web search results (gmass.co, switchlabs.dev, Nylas, mailing lists) | secondary | Developer pays assessor; fee estimates vary widely. **Not quoted** in the guide. |
| https://docs.composio.dev/toolkits/managed-auth | secondary | GMAIL listed under Composio-managed OAuth. |

### Attempts

- `curl -sI https://console.cloud.google.com/auth/clients` -> `302 Found` to `https://accounts.google.com/ServiceLogin?service=cloudconsole&...&continue=https://console.cloud.google.com/auth/clients`.
- `curl -sI https://console.cloud.google.com/auth/audience` -> same pattern.
- Stopped at Google sign-in. Proves the pages exist and need a session. Does not prove scope verification behaviour or review time.

### Corrections vs common assumptions

- "gmail.compose is sensitive like gmail.send": it is Restricted, so drafting replies alone triggers the full restricted path.
- "CASA always required": only when restricted data is accessed from or through a server (and no exception applies). An agent backend reading mail does trigger it.
- "Verification takes N weeks" with a single number: Google publishes only "several weeks" (restricted), "up to 10 days" (sensitive), "2-3 business days" (manual brand). We do not invent an end-to-end figure.
- CASA cost: no official figure found; left unverified.

---

## Dropbox (log only, no guide)

### Sources checked

| URL | Type | Supports |
|---|---|---|
| https://www.dropbox.com/developers/reference/developer-guide | official | 301 redirects to docs.dropboxapi.com (below). |
| https://docs.dropboxapi.com/dropbox-api/docs/developer-resources/developer-guide | official | New apps in development status can link "up to 500 total Dropbox users"; once an app links 50 users, "you will have two weeks to apply for and receive production status approval"; otherwise linking more users is "frozen"; "Simply unlinking all of your users will not unfreeze your app"; request "will not be reviewed until your app has linked with at least 50 Dropbox users". |
| https://www.dropbox.com/developers/support | official | "We respond to nearly all production requests within a few business days." Same 50-user and two-week wording. Apps can't be renamed once in production. |
| https://docs.composio.dev/toolkits/managed-auth | secondary | DROPBOX listed under Composio-managed OAuth. |
| docs.unified.to Dropbox skill page (search result) | secondary | Repeats the two-week warning. Not relied on. |

### Attempts

- `curl -sI https://www.dropbox.com/developers/apps/create` -> `302 Found`, `Location: /login?cont=https%3A%2F%2Fwww.dropbox.com%2Fdevelopers%2Fapps%2Fcreate`.
- `curl -sI https://www.dropbox.com/developers/apps` -> `302` to `/login?cont=...`.
- Stopped at login.

### Key distinction

- **Usage-triggered deadline:** the two-week window starts when the app links its 50th user. That is a policy deadline the developer controls by growth, not a review time.
- **Review-time statement:** "nearly all production requests within a few business days" (support page) and "reviewed soon after linking 50 Dropbox users" (guide). This is a soft response target, not a guarantee, and it does not promise approval inside the two weeks.
- Wording tension: the guide says linking is frozen "until you submit an application" in one sentence and "the only way to unfreeze your app is to apply for and receive production status" in another. Treat approval, not submission, as what unfreezes.
- Correction vs common assumption: you cannot apply early to beat the clock; requests are not reviewed until 50 users are linked.
