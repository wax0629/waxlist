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
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-black/25 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
      {intentSummary ? (
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/65">
            我的理解
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">
            {intentSummary}
          </p>
        </div>
      ) : null}

      {queriesUsed && queriesUsed.length > 0 ? (
        <div className={intentSummary ? "border-t border-white/[0.05]" : ""}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[12px] text-zinc-500 transition hover:bg-white/[0.03] hover:text-zinc-300"
          >
            <span>
              本轮检索词
              <span className="ml-1.5 text-zinc-600">{queriesUsed.length}</span>
            </span>
            <span className="text-[11px] text-zinc-600">{open ? "收起" : "展开"}</span>
          </button>
          {open ? (
            <ul className="flex flex-wrap gap-1.5 border-t border-white/[0.04] px-4 py-3">
              {queriesUsed.map((q) => (
                <li
                  key={q}
                  className="max-w-full truncate rounded-lg bg-white/[0.03] px-2.5 py-1 font-mono text-[11px] text-zinc-400 ring-1 ring-white/[0.05]"
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
