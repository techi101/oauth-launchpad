"use client";

import { useState } from "react";
import Icon from "./Icon";

const btn = "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:text-fg";

export default function ShareBar({ id, recheck }: { id: string; recheck?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${location.origin}/g/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      prompt("Copy this link", url);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={copy} className={btn}>
        <Icon name={copied ? "check" : "link"} /> {copied ? "Link copied" : "Share"}
      </button>
      <a href={`/g/${id}/md`} className={btn}>
        <Icon name="download" /> Markdown
      </a>
      {recheck && (
        <a href={recheck} className={btn}>
          <Icon name="refresh" /> Re-check
        </a>
      )}
    </div>
  );
}
