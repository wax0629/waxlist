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
          ? "group flex gap-3 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] p-2 pr-3 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition hover:border-violet-400/25 hover:bg-white/[0.05]"
          : "group flex flex-col overflow-hidden rounded-[1.25rem] border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-white/[0.02] shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_20px_40px_-24px_rgba(0,0,0,0.8)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/20 hover:shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_24px_48px_-20px_rgba(91,33,182,0.35)]"
      }
    >
      {compact ? (
        <>
          <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-900">
            {beat.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={beat.thumbnail}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : null}
            <span className="absolute left-1 top-1 rounded bg-black/60 px-1 py-0.5 text-[8px] font-bold uppercase text-red-300">
              {beat.source}
            </span>
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-100">
              {beat.title}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-zinc-500">
              {beat.channel_title || "未知频道"}
            </p>
            <p className="mt-1 line-clamp-1 text-[11px] text-zinc-500">
              {beat.reason}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-950">
            {beat.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={beat.thumbnail}
                alt=""
                className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.045]"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[11px] text-zinc-600">
                暂无封面
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/30" />
            <span className="absolute left-3 top-3 rounded-lg bg-black/55 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300/95 backdrop-blur-md ring-1 ring-white/10">
              {beat.source}
            </span>
            <span className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-zinc-900 opacity-0 shadow-lg transition group-hover:opacity-100">
              试听 →
            </span>
          </div>
          <div className="flex min-h-[8rem] flex-1 flex-col gap-1.5 p-4">
            <h3 className="line-clamp-2 min-h-[2.6rem] text-[14px] font-semibold leading-snug tracking-tight text-zinc-50">
              {beat.title}
            </h3>
            <p className="truncate text-[12px] text-zinc-500">
              {beat.channel_title || "未知频道"}
            </p>
            <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-zinc-400">
              {beat.reason || "可点开试听，判断是否合拍。"}
            </p>
            <span className="mt-auto pt-3 text-[12px] font-medium text-violet-300/90">
              在源站打开 →
            </span>
          </div>
        </>
      )}
    </motion.a>
  );
}
