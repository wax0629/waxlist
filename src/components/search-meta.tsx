"use client";

import { useState } from "react";
import type { SearchIntent } from "@/lib/types";
import {
  buildActiveLabels,
  buildRefineChips,
  type IntentActionChip,
} from "@/lib/agent/intent";

export function SearchMeta({
  intentSummary,
  queriesUsed,
  intent,
  onRefine,
  disabled,
}: {
  intentSummary?: string;
  queriesUsed?: string[];
  intent?: SearchIntent;
  onRefine?: (message: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!intentSummary && (!queriesUsed || queriesUsed.length === 0) && !intent) {
    return null;
  }

  const active = intent ? buildActiveLabels(intent) : [];
  const actions: IntentActionChip[] = intent ? buildRefineChips(intent) : [];

  return (
    <div className="glass-frame overflow-hidden rounded-2xl">
      {intentSummary ? (
        <div className="px-4 py-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-white/40">
            我的理解
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/80">
            {intentSummary}
          </p>
          {active.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {active.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/70"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {onRefine && actions.length > 0 ? (
        <div
          className={
            intentSummary ? "border-t border-white/10 px-4 py-3" : "px-4 py-3"
          }
        >
          <p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/35">
            点选修正 · 再搜
          </p>
          <div className="flex flex-wrap gap-1.5">
            {actions.map((chip) => (
              <button
                key={chip.id}
                type="button"
                disabled={disabled}
                onClick={() => onRefine(chip.message)}
                className="rounded-full border border-white/18 bg-transparent px-2.5 py-1 text-[11px] font-medium text-white/75 transition hover:border-[#ff6b9e]/50 hover:text-white disabled:opacity-40"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {queriesUsed && queriesUsed.length > 0 ? (
        <div className="border-t border-white/10">
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
                  className="max-w-full truncate rounded-lg border border-white/10 px-2.5 py-1 font-mono text-[11px] text-white/65"
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
