"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type Ev =
  | { type: "step"; text: string }
  | { type: "source"; title: string; url: string; official: boolean }
  | { type: "warn"; text: string }
  | { type: "ambiguous"; text: string; candidates: { key: string; name: string; docs?: string }[] }
  | { type: "saved"; id: string }
  | { type: "error"; text: string };

function Runner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [events, setEvents] = useState<Ev[]>([]);
  const [state, setState] = useState<"running" | "done" | "stopped">("running");
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(false);
  const provider = sp.get("provider") ?? "";
  const actions = sp.get("actions") ?? "";
  const audience = sp.get("audience") ?? "external";
  const catalogKey = sp.get("key") ?? undefined;
  const base = sp.get("base") ?? undefined;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    (async () => {
      try {
        const res = await fetch("/api/research", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ provider, actions, audience, catalogKey, baseGuideId: base }),
        });
        if (!res.ok || !res.body) {
          const j = await res.json().catch(() => ({}));
          setEvents((e) => [...e, { type: "error", text: j.error ?? `Request failed (${res.status})` }]);
          setState("stopped");
          return;
        }
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buf = "";
        let savedId = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const l of lines) {
            if (!l.trim()) continue;
            const ev = JSON.parse(l) as Ev;
            if (ev.type === "saved") savedId = ev.id;
            setEvents((e) => [...e, ev]);
          }
        }
        if (savedId) {
          setState("done");
          router.push(`/g/${savedId}?fresh=1`);
        } else setState("stopped");
      } catch (e) {
        setEvents((x) => [...x, { type: "error", text: `Connection lost: ${(e as Error).message}` }]);
        setState("stopped");
      } finally {
        clearInterval(timer);
      }
    })();
    return () => clearInterval(timer);
  }, [provider, actions, audience, catalogKey, base, router]);

  const sources = events.filter((e): e is Extract<Ev, { type: "source" }> => e.type === "source");
  const amb = events.find((e): e is Extract<Ev, { type: "ambiguous" }> => e.type === "ambiguous");

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted">
          <Link href="/" className="underline">Guides</Link> / Research
        </p>
        <h1 className="mt-1 text-2xl font-semibold">Researching {provider}</h1>
        <p className="text-sm text-muted">
          For: {actions} · {audience === "external" ? "External customers" : audience === "internal" ? "Own organisation" : "Testing"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <section className="rounded-lg border border-line bg-panel p-5" aria-live="polite">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Agent activity</h2>
            <span className="text-xs text-muted">
              {state === "running" ? `Running · ${elapsed}s` : state === "done" ? "Done, opening guide…" : `Stopped · ${elapsed}s`}
            </span>
          </div>
          <ol className="mt-3 grid gap-2 text-sm">
            {events
              .filter((e) => e.type === "step" || e.type === "warn" || e.type === "error" || e.type === "saved")
              .map((e, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden className={e.type === "warn" ? "text-amber-600" : e.type === "error" ? "text-rose-600" : "text-accent"}>
                    {e.type === "warn" ? "!" : e.type === "error" ? "×" : "•"}
                  </span>
                  <span className={e.type === "error" ? "text-rose-700 dark:text-rose-300" : ""}>
                    {e.type === "saved" ? "Guide saved with a permanent link" : "text" in e ? e.text : ""}
                  </span>
                </li>
              ))}
            {state === "running" && <li className="animate-pulse text-muted">Working…</li>}
          </ol>
          {amb && (
            <div className="mt-4 rounded-md border border-line p-3 text-sm">
              <p className="font-medium">{amb.text}</p>
              <ul className="mt-2 grid gap-1">
                {amb.candidates.map((c) => (
                  <li key={c.key || c.name}>
                    {c.key ? (
                      <a
                        className="text-accent underline"
                        href={`/research?${new URLSearchParams({ provider: c.name, actions, audience, key: c.key })}`}
                      >
                        {c.name}
                      </a>
                    ) : (
                      c.name
                    )}
                    {c.docs && <span className="ml-2 text-xs text-muted">{c.docs}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {state === "stopped" && (
            <p className="mt-4 text-sm">
              <Link href="/#research" className="text-accent underline">Try again</Link> (adding the website often helps)
            </p>
          )}
        </section>

        <section className="rounded-lg border border-line bg-panel p-5">
          <h2 className="font-semibold">Pages read ({sources.length})</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {sources.map((s, i) => (
              <li key={i} className="break-words">
                <span className={`mr-1 rounded px-1 text-[11px] ${s.official ? "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200" : "bg-zinc-200 dark:bg-zinc-800"}`}>
                  {s.official ? "official" : "other"}
                </span>
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
            {!sources.length && <li className="text-muted">None yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense>
      <Runner />
    </Suspense>
  );
}
