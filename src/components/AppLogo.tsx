"use client";

import { useState } from "react";
import { logoUrl } from "@/lib/display";

const TINTS = ["bg-indigo-100 text-indigo-700", "bg-sky-100 text-sky-700", "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700", "bg-violet-100 text-violet-700", "bg-amber-100 text-amber-800"];

/** Provider logo (favicon service) with a lettered fallback, on a white rounded tile. */
export default function AppLogo({ name, domain, size = 40 }: { name: string; domain: string; size?: number }) {
  const [failed, setFailed] = useState(!domain);
  const tint = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  const box = { width: size, height: size };
  if (failed)
    return (
      <span style={box} className={`inline-flex shrink-0 items-center justify-center rounded-xl font-semibold ${tint}`} aria-hidden>
        {name.replace(/[^A-Za-z0-9]/g, "").slice(0, 1).toUpperCase()}
      </span>
    );
  return (
    <span style={box} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-line bg-white shadow-sm" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl(domain)} alt="" width={size * 0.55} height={size * 0.55} className="object-contain" onError={() => setFailed(true)} />
    </span>
  );
}
