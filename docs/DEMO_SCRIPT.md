# Demo script (about 5 minutes)

**0. The library (30 s).** On the home page, the *Compare* table shows 21 apps hardest first: effort, route, your work, the provider's wait and the main blocker. Filter *High*: Google Drive, Google Calendar, Instagram, Spotify (250k MAU rule), Gmail. Open Spotify and point at the green *Reviewed* banner: what a person checked and corrected.

**1. The problem (30 s).** On the home page, read the headline. "Before your agent can act in Gmail for your users, you register an OAuth app once. Users then click Allow. Some providers add a review that can take weeks. This tells you which case you're in."

**2. A starter guide: Gmail (90 s).** Open **Gmail**.
- *Next action* box: the one thing to do now.
- *Route*: register your own app. Composio's managed app works, but users see Composio's name and share its quota.
- *Effort and timing*: your work and Google's wait are shown separately. Google's wait is quoted ("several weeks" and "several months" both appear in Google's docs).
- *Permissions*: drafting replies needs `gmail.compose`, which is **restricted**, so it triggers CASA. Sending only would be `gmail.send`, which is sensitive.
- *Checklist*: tick a step, then refresh. Progress stays in this browser only. Each step shows an owner (You, Agent, Org admin, Provider).
- *Evidence*: click a `[g-scopes]` citation, then the setup attempt ("redirected to sign-in, stopped here; this proves X, not Y").
- Click **Copy share link** and **Download Markdown**.
- Open the Slack guide, *Let the agent start it*: change the app name, click **Open prefilled Slack registration**. Slack's own create-app page opens with the scopes and redirect URI already filled in.

**3. Same app, different use case (30 s).** Scroll to *Different use case?* and enter "Send emails only", "Just me / testing". Or open the saved one from *Recently generated*. The guide now says `gmail.send`, a 100 test-user cap and 7-day refresh tokens, with no CASA requirement.

**4. Live generation for an unfamiliar app (2 min).** Let the reviewer pick the app, for example "Calendly", "Read upcoming meetings and cancel them", "External customers". Point at each real event: the catalog hint, official domains, each page read (tagged *official* or *other*), the gaps it's investigating, the OAuth metadata probe, then "Evidence check: N of N quoted claims matched their source". The guide opens at a permanent link.

**4b. Composio fit (60 s).** On the Xero guide, scroll to **On Composio**: it's bring-your-own, so check the redirect URI warning (the form defaults to v1, the docs say v3, issue #2999), the 31 default scopes to trim, the session snippet, and "verify with one real call". Then open **/coverage**: 275 bring-your-own toolkits, 259 with no walkthrough, the ranked next 100, and the method. Mention `/llms.txt` for agents.

**5. Honesty (30 s).** Type a made-up name such as "Flurbix": the agent asks for the website instead of inventing a guide. On any generated guide, show the *Uncertain* section and the *Research log*.

If a run fails because the model provider is overloaded, the UI says so and keeps the partial result. That behaviour is intentional.
