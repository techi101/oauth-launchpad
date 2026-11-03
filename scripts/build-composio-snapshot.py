"""Build data/composio-toolkits.json: a compact, dated snapshot of Composio's OAuth toolkits.

Sources (all public):
- https://docs.composio.dev/data/toolkits.json  (the file behind docs.composio.dev/toolkits/managed-auth)
- https://composio.dev/auth                     (index of Composio's own "create your own OAuth app" guides; read via Jina Reader)
- GitHub issues in ComposioHQ/composio          (demand / pain signal: title mentions per toolkit, via `gh api`)

Run:  python scripts/build-composio-snapshot.py <path-to-toolkits.json> <path-to-auth.md>
"""
import ast
import datetime
import json
import re
import subprocess
import sys


def as_list(v):
    if isinstance(v, list):
        return v
    if not v:
        return []
    try:
        return ast.literal_eval(v)
    except Exception:
        return []


toolkits = json.load(open(sys.argv[1], encoding="utf8"))
auth_md = open(sys.argv[2], encoding="utf8").read()
guide_slugs = sorted(set(re.findall(r"composio\.dev/auth/([a-z0-9_-]+)", auth_md)))

# Recent issue titles (open + closed) for demand signal.
titles = []
for page in range(1, 11):
    out = subprocess.run(
        ["gh", "api", f"repos/ComposioHQ/composio/issues?state=all&per_page=100&page={page}", "--jq", ".[] | [.number, .title, .html_url] | @json"],
        capture_output=True, text=True, encoding="utf8",
    ).stdout
    rows = [json.loads(l) for l in out.splitlines() if l.strip()]
    if not rows:
        break
    titles += rows

out = []
for t in toolkits:
    schemes = [s.upper() for s in as_list(t.get("authSchemes"))]
    if not any("OAUTH" in s for s in schemes):
        continue
    managed = as_list(t.get("composioManagedAuthSchemes"))
    details = as_list(t.get("authConfigDetails"))
    oauth = next((d for d in details if "OAUTH" in str(d.get("mode", "")).upper()), {})
    creation = (oauth.get("fields") or {}).get("auth_config_creation") or {}
    fields = {f["name"]: f for f in (creation.get("required") or []) + (creation.get("optional") or [])}
    redirect = (fields.get("oauth_redirect_uri") or {}).get("default") or ""
    scopes = (fields.get("scopes") or {}).get("default") or ""
    name = t["name"].strip()
    pat = re.compile(r"\b" + re.escape(name.lower()) + r"\b") if len(name) >= 3 else None
    issues = [r for r in titles if pat and pat.search(r[1].lower())] if pat else []
    out.append({
        "slug": t["slug"],
        "name": name,
        "category": t.get("category") or "",
        "managed": bool(managed),
        "toolCount": int(t.get("toolCount") or 0),
        "requiredFields": [f["name"] for f in (creation.get("required") or [])],
        "optionalFields": [f["name"] for f in (creation.get("optional") or [])],
        "defaultRedirect": redirect,
        "defaultScopes": [s.strip() for s in re.split(r"[ ,]+", scopes) if s.strip()][:60],
        "composioGuide": f"https://composio.dev/auth/{t['slug']}" if t["slug"] in guide_slugs else "",
        "issues": [{"number": n, "title": ti[:140], "url": u} for n, ti, u in issues[:8]],
        "issueCount": len(issues),
    })

out.sort(key=lambda x: x["name"].lower())
legacy = sum(1 for x in out if "/api/v1/auth-apps/add" in x["defaultRedirect"])
v3 = sum(1 for x in out if "/api/v3/toolkits/auth/callback" in x["defaultRedirect"])
snapshot = {
    "retrieved": datetime.date.today().isoformat(),
    "sources": {
        "toolkits": "https://docs.composio.dev/data/toolkits.json",
        "managedDirectory": "https://docs.composio.dev/toolkits/managed-auth",
        "guides": "https://composio.dev/auth",
        "issues": "https://github.com/ComposioHQ/composio/issues",
    },
    "stats": {
        "oauthToolkits": len(out),
        "managed": sum(x["managed"] for x in out),
        "bringYourOwn": sum(not x["managed"] for x in out),
        "composioGuides": len(guide_slugs),
        "byoWithoutGuide": sum((not x["managed"]) and not x["composioGuide"] for x in out),
        "defaultRedirectLegacyV1": legacy,
        "defaultRedirectV3": v3,
        "issuesScanned": len(titles),
    },
    "toolkits": out,
}
json.dump(snapshot, open("data/composio-toolkits.json", "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
print(json.dumps(snapshot["stats"], indent=1))
