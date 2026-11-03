"use client";

import { useState } from "react";

export default function ShareBar({ id }: { id: string }) {
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
    <div className="flex flex-wrap gap-2 text-sm">
      <button onClick={copy} className="rounded-md border border-line bg-panel px-3 py-1.5 hover:border-accent">
        {copied ? "Link copied" : "Copy share link"}
      </button>
      <a href={`/g/${id}/md`} className="rounded-md border border-line bg-panel px-3 py-1.5 hover:border-accent">
        Download Markdown
      </a>
    </div>
  );
}
