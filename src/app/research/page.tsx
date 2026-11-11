"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ResearchForm from "@/components/ResearchForm";

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
    if (started.current || !provider) return;
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

  if (!provider)
    return (
      <div className="mx-auto grid max-w-2xl gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">Live research</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Research an app</h1>
          <p className="mt-1 text-slate-600">The agent reads the provider&apos;s official docs and writes a guide for your exact use case in about a minute.</p>
        </div>
        <div className="rounded-2xl border border-line bg-subtle p-6">
          <ResearchForm />
        </div>
      </div>
    );

  const sources = events.filter((e): e is Extract<Ev, { type: "source" }> => e.type === "source");
  const amb = events.find((e): e is Extract<Ev, { type: "ambiguous" }> => e.type === "ambiguous");
  const steps = events.filter((e) => e.type === "step" || e.type === "warn" || e.type === "error" || e.type === "saved");
  const pct = state === "done" ? 100 : Math.min(95, Math.round((elapsed / 75) * 100));
  const host = (u: string) => {
    try {
      return new URL(u).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };

  return (
    <div className="grid gap-6">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/#library" className="hover:text-fg">Library</Link> <span>/</span> <span className="text-fg">Research</span>
        </nav>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Researching {provider}</h1>
            <p className="mt-1 text-slate-600">
              “{actions}” · {audience === "external" ? "External customers" : audience === "internal" ? "My organisation" : "Just me / testing"}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              state === "running" ? "bg-indigo-50 text-indigo-700" : state === "done" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            }`}
          >
            {state === "running" && <span className="h-2 w-2 animate-ping rounded-full bg-indigo-500" />}
            {state === "running" ? `Working · ${elapsed}s` : state === "done" ? "Done, opening the guide…" : `Stopped after ${elapsed}s`}
          </span>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-700 ${state === "stopped" ? "bg-rose-400" : "bg-gradient-to-r from-indigo-500 to-violet-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm" aria-live="polite">
          <h2 className="font-semibold">What the agent is doing</h2>
          <ol className="relative mt-4 ml-2.5 grid gap-3 border-l border-line pl-6">
            {steps.map((e, i) => {
              const last = i === steps.length - 1 && state === "running";
              const tone = e.type === "warn" ? "bg-amber-400" : e.type === "error" ? "bg-rose-500" : e.type === "saved" ? "bg-emerald-500" : last ? "bg-indigo-500" : "bg-indigo-200";
              return (
                <li key={i} className="relative text-sm">
                  <span className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${tone} ${last ? "animate-pulse" : ""}`} />
                  <span className={e.type === "error" ? "text-rose-700" : e.type === "warn" ? "text-amber-800" : last ? "font-medium" : "text-slate-600"}>
                    {e.type === "saved" ? "Guide saved with a permanent link" : "text" in e ? e.text : ""}
                  </span>
                </li>
              );
            })}
            {!steps.length && <li className="text-sm text-muted">Starting…</li>}
          </ol>
          {amb && (
            <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-sm">
              <p className="font-medium">{amb.text}</p>
              <ul className="mt-2 grid gap-1.5">
                {amb.candidates.map((c) => (
                  <li key={c.key || c.name}>
                    {c.key ? (
                      <a className="font-medium text-accent hover:underline" href={`/research?${new URLSearchParams({ provider: c.name, actions, audience, key: c.key })}`}>
                        {c.name} →
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
            <p className="mt-5 text-sm">
              <Link href="/#research" className="font-medium text-accent hover:underline">Try again</Link>
              <span className="text-muted"> (adding the website often helps)</span>
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Pages read</h2>
            <span className="text-sm font-semibold text-accent">{sources.length}</span>
          </div>
          <ul className="mt-4 grid gap-2 text-sm">
            {sources.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 rounded-lg p-1.5 hover:bg-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`https://www.google.com/s2/favicons?domain=${host(s.url)}&sz=32`} alt="" width={16} height={16} className="mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <a href={s.url} target="_blank" rel="noreferrer" className="line-clamp-2 hover:text-accent">{s.title}</a>
                  <span className="text-xs text-muted">
                    {host(s.url)} · {s.official ? <span className="text-emerald-700">official</span> : "other source"}
                  </span>
                </span>
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
