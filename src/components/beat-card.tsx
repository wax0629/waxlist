"use client";

import { motion } from "framer-motion";
import type { BeatCandidate } from "@/lib/types";

export function BeatCard({
  beat,
  index = 0,
  compact = false,
}: {
  beat: BeatCandidate;
  index?: number;
  compact?: boolean;
}) {
  return (
    <motion.a
      href={beat.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 6) * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={
        compact
          ? "group flex gap-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-elevated)] p-2 pr-3 transition hover:border-[rgba(212,165,116,0.3)]"
          : "group flex flex-col overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-[var(--ink-elevated)] shadow-[0_1px_0_rgba(243,238,230,0.04)_inset,0_24px_48px_-28px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(212,165,116,0.28)]"
      }
    >
      {compact ? (
        <>
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-black">
            {beat.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={beat.thumbnail}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <h3 className="line-clamp-2 font-display text-[13px] font-semibold leading-snug text-[var(--cream)]">
              {beat.title}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-[var(--cream-faint)]">
              {beat.channel_title || "未知频道"}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
            {beat.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={beat.thumbnail}
                alt=""
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] text-[var(--cream-faint)]">
                暂无封面
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-black/25" />
            <span className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-[var(--gold-soft)] backdrop-blur-md ring-1 ring-[var(--line)]">
              {beat.source}
            </span>
            <span className="absolute bottom-3 right-3 rounded-full bg-[var(--gold)] px-3 py-1 text-[11px] font-semibold text-[var(--ink)] opacity-0 shadow-lg transition group-hover:opacity-100">
              试听 →
            </span>
          </div>
          <div className="flex min-h-[8rem] flex-1 flex-col gap-1.5 p-4">
            <h3 className="line-clamp-2 min-h-[2.6rem] font-display text-[15px] font-semibold leading-snug tracking-tight text-[var(--cream)]">
              {beat.title}
            </h3>
            <p className="truncate text-[12px] text-[var(--cream-faint)]">
              {beat.channel_title || "未知频道"}
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-[var(--cream-muted)]">
              {beat.reason || "可点开试听，判断是否合拍。"}
            </p>
            <span className="mt-auto pt-3 text-[12px] font-medium text-[var(--gold)]">
              在源站打开 →
            </span>
          </div>
        </>
      )}
    </motion.a>
  );
}
