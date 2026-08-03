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
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-elevated)]/90">
      {intentSummary ? (
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--gold)]/75">
            我的理解
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--cream-soft)]">
            {intentSummary}
          </p>
        </div>
      ) : null}

      {queriesUsed && queriesUsed.length > 0 ? (
        <div className={intentSummary ? "border-t border-[var(--line)]" : ""}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-[12px] text-[var(--cream-muted)] transition hover:bg-white/[0.02] hover:text-[var(--cream-soft)]"
          >
            <span>
              本轮检索词
              <span className="ml-1.5 font-mono text-[var(--cream-faint)]">
                {queriesUsed.length}
              </span>
            </span>
            <span className="text-[11px] text-[var(--cream-faint)]">
              {open ? "收起" : "展开"}
            </span>
          </button>
          {open ? (
            <ul className="flex flex-wrap gap-1.5 border-t border-[var(--line)] px-4 py-3">
              {queriesUsed.map((q) => (
                <li
                  key={q}
                  className="max-w-full truncate rounded-lg bg-black/30 px-2.5 py-1 font-mono text-[11px] text-[var(--cream-muted)] ring-1 ring-[var(--line)]"
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
