// Mirror of the Vercel deployment on a workers.dev address, for networks that block *.vercel.app.
const ORIGIN = "https://oauth-launchpad-omega.vercel.app";
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = ORIGIN + url.pathname + url.search;
    const headers = new Headers(request.headers);
    headers.set("x-public-origin", url.origin);
    const ip = request.headers.get("cf-connecting-ip");
    if (ip) headers.set("x-forwarded-for", ip);
    headers.delete("host");
    const res = await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    });
    const out = new Headers(res.headers);
    const loc = out.get("location");
    if (loc && loc.startsWith(ORIGIN)) out.set("location", url.origin + loc.slice(ORIGIN.length));
    return new Response(res.body, { status: res.status, headers: out });
  },
};
