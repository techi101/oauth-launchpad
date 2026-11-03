/** The address the visitor used: the workers.dev mirror forwards it as x-public-origin. */
export function publicOrigin(req: Request): string {
  const pub = req.headers.get("x-public-origin");
  return pub && /^https:\/\/[a-z0-9.-]+\.workers\.dev$/.test(pub) ? pub : new URL(req.url).origin;
}
