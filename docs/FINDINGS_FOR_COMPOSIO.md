# Findings for Composio (from building OAuth Launchpad, 3 Nov 2026)

These came from Composio's public toolkit data (`docs.composio.dev/data/toolkits.json`, the file behind the managed-OAuth directory), the composio.dev/auth guide index, the docs, and the last 1,000 issues in ComposioHQ/composio. The snapshot and the script that builds it are in `data/composio-toolkits.json` and `scripts/build-composio-snapshot.py`.

## 1. Most OAuth toolkits leave registration to the developer

- 402 toolkits have an OAuth scheme. 127 are Composio-managed and **275 are bring-your-own-app**.
- composio.dev/auth has 63 own-app walkthroughs, so **259 bring-your-own toolkits have no walkthrough at all**.
- The walkthroughs that exist cover creating the app, not getting it approved. For example, the Google guide doesn't mention restricted scopes, CASA or the 7-day refresh-token limit in Testing mode.

That gap is the reason for this library. `/coverage` ranks the 275 and shows how.

## 2. The redirect URI default doesn't match the docs

- The docs say: register `https://backend.composio.dev/api/v3/toolkits/auth/callback` (white-labelling page).
- In the toolkit data, **382 of the 402 OAuth auth configs default their "Redirect URI" field to the legacy `https://backend.composio.dev/api/v1/auth-apps/add`**. The other 20 have no default. None defaults to v3.
- The docs call v1 a supported legacy callback, so this is not necessarily broken. But a developer who follows the docs (registers v3) and leaves the form default (v1) gets `invalid redirect_uri`. Issue #2999 (Xero) is that failure.
- Every guide's "On Composio" section now tells the developer to register one URI and put the same one in the auth config.
- **Suggested fix:** default the field to v3, or show the field with a "must match your provider registration" note.

## 3. Default scope lists are long, and that has a review cost

Some auth configs request dozens of scopes by default. Xero's default list has 31, including broad accounting, files and projects scopes.

- Every extra scope appears on the consent screen.
- On providers with tiered review, extra scopes can push an app into a heavier review. Google's sensitive and restricted scopes are one example; Xero is moving to granular scopes for apps created after 2 March 2026.

The guides tell developers to trim the list to what their tools need. Composio could show a "minimal scopes for these tools" preset.

## 4. "ACTIVE" doesn't mean a connection works

Issues #4190 (X: client-not-enrolled while ACTIVE) and #4120 (invalid keys still marked ACTIVE) show that connection status alone can't be trusted. Each guide ends with "verify with one real call after connecting". A post-connect test call in Composio would catch these.

## 5. The managed app can't always request the scopes a toolkit's tools need

Examples: Calendly #4392 (derived scopes refused, which blocks 37 of 52 tools), Zoom #4253, Outlook To Do #5033, LinkedIn #4138.

For a developer, that turns "managed is available" into "managed is available for some tools". The guide says so where the issue list shows it. A per-tool "works with managed auth" flag would remove the guesswork.

## 6. Keep docs fresh with staggered reviews

Issue #4331 notes 62 KB guides all expiring on the same day. Here, each guide gets a review date staggered between 23 and 37 days by its id, a "Re-check now" link that re-runs the agent, and a freshness share on `/coverage`, which counts as a supply-health metric.

## What's not verified

- Whether existing connected accounts must reconnect when a toolkit moves from managed to custom auth. The docs don't say.
- Composio's internal connection-failure data per toolkit. That would be the best demand signal for ranking and only Composio has it.
- Whether the v1 default actually fails for each provider. That depends on what the developer registers.
