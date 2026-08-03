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
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-black/30 shadow-inner shadow-black/20 backdrop-blur-md">
      {intentSummary ? (
        <div className="px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-300/70">
            我的理解
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-300">
            {intentSummary}
          </p>
        </div>
      ) : null}

      {queriesUsed && queriesUsed.length > 0 ? (
        <div className={intentSummary ? "border-t border-white/[0.05]" : ""}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[11px] text-zinc-500 transition hover:bg-white/[0.03] hover:text-zinc-300"
          >
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1 w-1 rounded-full bg-violet-400/60" />
              本轮检索词
              <span className="text-zinc-600">· {queriesUsed.length}</span>
            </span>
            <span className="text-[10px] text-zinc-600">{open ? "收起" : "展开"}</span>
          </button>
          {open ? (
            <ul className="space-y-1 border-t border-white/[0.04] px-3.5 py-2.5 font-mono text-[10.5px] leading-relaxed text-zinc-500">
              {queriesUsed.map((q) => (
                <li
                  key={q}
                  className="truncate rounded-md bg-white/[0.02] px-2 py-1 text-zinc-400"
                  title={q}
                >
                  {q}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
