"use client";

import { motion } from "framer-motion";
import type { BeatCandidate } from "@/lib/types";

/** Glass destination card on aurora background */
export function BeatCard({
  beat,
  index = 0,
  featured = false,
}: {
  beat: BeatCandidate;
  index?: number;
  featured?: boolean;
}) {
  return (
    <motion.a
      href={beat.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index, 6) * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={
        featured
          ? "group relative col-span-full flex min-h-[230px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_24px_60px_-28px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:min-h-[270px] lg:col-span-2"
          : "group relative flex min-h-[210px] flex-col overflow-hidden rounded-[1.35rem] border border-white/14 bg-white/[0.055] shadow-[0_1px_0_rgba(255,255,255,0.1)_inset,0_20px_48px_-28px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08]"
      }
    >
      <div className="absolute inset-0">
        {beat.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-violet-500/20 via-sky-500/10 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-fuchsia-400/10 mix-blend-soft-light" />
      </div>

      <div className="relative z-10 flex items-start justify-between p-3.5">
        <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
          {beat.source}
        </span>
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-slate-900 opacity-0 shadow-lg transition group-hover:opacity-100">
          试听
        </span>
      </div>

      <div className="relative z-10 mt-auto space-y-1.5 p-4 pt-16">
        <p className="truncate text-[11px] font-medium tracking-wide text-white/55">
          {beat.channel_title || "未知频道"}
        </p>
        <h3
          className={
            featured
              ? "font-display text-[1.35rem] font-semibold leading-snug tracking-tight text-white sm:text-[1.5rem]"
              : "line-clamp-2 font-display text-[15px] font-semibold leading-snug tracking-tight text-white"
          }
        >
          {beat.title}
        </h3>
        <p className="line-clamp-2 text-[12px] leading-relaxed text-white/70">
          {beat.reason || "点开试听，判断是否合拍。"}
        </p>
      </div>
    </motion.a>
  );
}
