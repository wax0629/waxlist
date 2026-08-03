"use client";

import { motion } from "framer-motion";
import type { BeatCandidate } from "@/lib/types";

/** Card IA: cover → source → title (2 lines) → channel → reason (2 lines) → CTA */
export function BeatCard({
  beat,
  index = 0,
}: {
  beat: BeatCandidate;
  index?: number;
}) {
  return (
    <motion.a
      href={beat.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: Math.min(index, 5) * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] shadow-xl shadow-black/40 ring-1 ring-white/[0.03] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-white/[0.055] active:scale-[0.99] sm:active:scale-100"
    >
      {/* Cover — fixed ratio for grid rhythm */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-900">
        {beat.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-950/40 to-zinc-900 text-[11px] text-zinc-600">
            暂无封面
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
        <span
          className={
            beat.source === "youtube"
              ? "absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-300 backdrop-blur-sm"
              : "absolute left-2 top-2 rounded-md bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-400 backdrop-blur-sm"
          }
        >
          {beat.source}
        </span>
        <span className="absolute bottom-2 right-2 rounded-md bg-violet-500/90 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 max-sm:opacity-100 max-sm:bg-black/50">
          试听
        </span>
      </div>

      {/* Body — fixed information order */}
      <div className="flex min-h-[7.5rem] flex-1 flex-col gap-1 p-3 sm:p-3.5">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug text-zinc-100 group-hover:text-white">
          {beat.title}
        </h3>
        <p className="truncate text-[11px] text-zinc-500">
          {beat.channel_title || "未知频道"}
        </p>
        <p className="mt-1 line-clamp-2 min-h-[2rem] text-[11px] leading-relaxed text-zinc-500">
          {beat.reason || "可点开试听，判断是否合拍。"}
        </p>
        <span className="mt-auto pt-2 text-[11px] font-medium text-violet-300/85 group-hover:text-violet-200">
          在源站打开 →
        </span>
      </div>
    </motion.a>
  );
}
