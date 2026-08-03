"use client";

import { useState } from "react";

export function SearchMeta({
  intentSummary,
  queriesUsed,
}: {
  intentSummary?: string;
  queriesUsed?: string[];
}) {
  const [open, setOpen] = useState(false);
  if (!intentSummary && (!queriesUsed || queriesUsed.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/25 px-3 py-2.5 text-xs text-zinc-400 backdrop-blur-sm">
      {intentSummary ? (
        <p className="leading-relaxed text-zinc-300">
          <span className="mr-1.5 font-medium text-violet-300/90">我的理解</span>
          {intentSummary}
        </p>
      ) : null}

      {queriesUsed && queriesUsed.length > 0 ? (
        <div className={intentSummary ? "mt-2" : ""}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left text-[11px] text-zinc-500 transition hover:text-zinc-300"
          >
            <span>本轮检索词（{queriesUsed.length}）</span>
            <span className="text-zinc-600">{open ? "收起" : "展开"}</span>
          </button>
          {open ? (
            <ul className="mt-1.5 space-y-1 border-t border-white/5 pt-1.5 font-mono text-[11px] leading-snug text-zinc-500">
              {queriesUsed.map((q) => (
                <li key={q} className="truncate" title={q}>
                  · {q}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
