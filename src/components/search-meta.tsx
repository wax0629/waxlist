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
    <div className="glass-panel overflow-hidden rounded-2xl">
      {intentSummary ? (
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--gold)]/80">
            我的理解
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
            {intentSummary}
          </p>
        </div>
      ) : null}

      {queriesUsed && queriesUsed.length > 0 ? (
        <div className={intentSummary ? "border-t border-white/10" : ""}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[12px] text-white/50 transition hover:bg-white/5 hover:text-white/80"
          >
            <span>
              本轮检索词
              <span className="ml-1.5 font-mono text-white/35">
                {queriesUsed.length}
              </span>
            </span>
            <span className="text-[11px] text-white/35">
              {open ? "收起" : "展开"}
            </span>
          </button>
          {open ? (
            <ul className="flex flex-wrap gap-1.5 border-t border-white/10 px-4 py-3">
              {queriesUsed.map((q) => (
                <li
                  key={q}
                  className="max-w-full truncate rounded-lg bg-white/8 px-2.5 py-1 font-mono text-[11px] text-white/65 ring-1 ring-white/10"
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
