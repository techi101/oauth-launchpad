import { promises as fs } from "node:fs";
import path from "node:path";
import { Guide, type Guide as GuideT } from "./schema";
import { SEEDS } from "./seeds";

/**
 * Generated guides are stored durably in Vercel Blob (BLOB_READ_WRITE_TOKEN).
 * Without a token (local dev only) they go to ./.data/guides. Serverless disk
 * is never used in production because it does not persist.
 */

const LOCAL_DIR = path.join(process.cwd(), ".data", "guides");
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

export function storageMode(): "blob" | "local" | "none" {
  if (hasBlob()) return "blob";
  if (process.env.VERCEL) return "none";
  return "local";
}

export async function saveGuide(g: GuideT): Promise<void> {
  const body = JSON.stringify(Guide.parse(g));
  const mode = storageMode();
  if (mode === "blob") {
    const { put } = await import("@vercel/blob");
    await put(`guides/${g.id}.json`, body, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return;
  }
  if (mode === "none") throw new Error("No durable storage configured (set BLOB_READ_WRITE_TOKEN)");
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(path.join(LOCAL_DIR, `${g.id}.json`), body, "utf8");
}

export async function getGuide(id: string): Promise<GuideT | null> {
  if (!/^[a-z0-9-]{1,80}$/.test(id)) return null;
  const seed = SEEDS.find((s) => s.id === id);
  if (seed) return seed;
  const mode = storageMode();
  try {
    if (mode === "blob") {
      const { head } = await import("@vercel/blob");
      const meta = await head(`guides/${id}.json`);
      const res = await fetch(meta.url, { cache: "no-store" });
      if (!res.ok) return null;
      return Guide.parse(await res.json());
    }
    if (mode === "local") {
      const raw = await fs.readFile(path.join(LOCAL_DIR, `${id}.json`), "utf8");
      return Guide.parse(JSON.parse(raw));
    }
  } catch {
    return null;
  }
  return null;
}

export type GuideCard = {
  id: string;
  name: string;
  actions: string;
  audience: GuideT["useCase"]["audience"];
  difficulty: GuideT["summary"]["difficulty"];
  route: GuideT["summary"]["route"];
  reviewWait: string;
  kind: GuideT["kind"];
  status: GuideT["status"];
  createdAt: string;
};

export const toCard = (g: GuideT): GuideCard => ({
  id: g.id,
  name: g.provider.name,
  actions: g.useCase.actions,
  audience: g.useCase.audience,
  difficulty: g.summary.difficulty,
  route: g.summary.route,
  reviewWait: g.timing.reviewWait.text,
  kind: g.kind,
  status: g.status,
  createdAt: g.createdAt,
});

/** Recent generated guides (newest first), as cards. */
export async function listGenerated(limit = 24): Promise<GuideCard[]> {
  const mode = storageMode();
  const out: GuideT[] = [];
  try {
    if (mode === "blob") {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: "guides/", limit: 100 });
      const recent = blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)).slice(0, limit);
      const got = await Promise.all(
        recent.map(async (b) => {
          try {
            const r = await fetch(b.url, { cache: "no-store" });
            return Guide.parse(await r.json());
          } catch {
            return null;
          }
        }),
      );
      out.push(...(got.filter(Boolean) as GuideT[]));
    } else if (mode === "local") {
      const files = await fs.readdir(LOCAL_DIR).catch(() => [] as string[]);
      for (const f of files.filter((f) => f.endsWith(".json"))) {
        try {
          out.push(Guide.parse(JSON.parse(await fs.readFile(path.join(LOCAL_DIR, f), "utf8"))));
        } catch {
          /* skip invalid */
        }
      }
      out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  } catch {
    return [];
  }
  return out.slice(0, limit).map(toCard);
}
