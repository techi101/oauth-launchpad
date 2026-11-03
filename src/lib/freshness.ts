import type { Guide } from "./schema";

/**
 * Review cadence. Provider rules change, so every guide carries a next-review
 * date. Dates are staggered by guide id so a library never hits a single
 * "review cliff" where everything expires on the same day.
 */
const BASE_DAYS = 30;

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function freshness(g: Pick<Guide, "id" | "createdAt">, now = new Date()) {
  const verified = g.createdAt.slice(0, 10);
  const days = BASE_DAYS + (hash(g.id) % 15) - 7; // 23..37 days
  const next = new Date(`${verified}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + days);
  const nextReview = next.toISOString().slice(0, 10);
  return { verified, nextReview, due: now > next };
}

export function freshShare(guides: Pick<Guide, "id" | "createdAt">[], now = new Date()) {
  if (!guides.length) return 0;
  return guides.filter((g) => !freshness(g, now).due).length / guides.length;
}
