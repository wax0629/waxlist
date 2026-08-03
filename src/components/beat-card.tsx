"use client";

import { motion } from "framer-motion";
import type { BeatCandidate } from "@/lib/types";

/** Unified glass result card — same size/style for every pick */
export function BeatCard({
  beat,
  index = 0,
}: {
  beat: BeatCandidate;
  index?: number;
  /** @deprecated ignored — all cards use one style */
  featured?: boolean;
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
      className="group relative flex min-h-[168px] flex-col overflow-hidden rounded-2xl border border-white/14 bg-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition duration-300 hover:-translate-y-0.5 hover:border-white/28 sm:min-h-[180px]"
    >
      <div className="absolute inset-0">
        {beat.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#ff6b9e]/25 via-[#9b51e0]/15 to-transparent" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#a94f28]/12 via-transparent to-[#9b51e0]/12 mix-blend-soft-light" />
      </div>

      <div className="relative z-10 flex items-start justify-between p-3">
        <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-md">
          {beat.source}
        </span>
        <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-900 opacity-0 shadow-lg transition group-hover:opacity-100">
          试听
        </span>
      </div>

      <div className="relative z-10 mt-auto space-y-1 p-3 pt-10">
        <p className="truncate text-[10px] font-medium tracking-wide text-white/55">
          {beat.channel_title || "未知频道"}
        </p>
        <h3 className="line-clamp-2 font-display text-[13px] font-semibold leading-snug tracking-tight text-white">
          {beat.title}
        </h3>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-white/65">
          {beat.reason || "点开试听，判断是否合拍。"}
        </p>
      </div>
    </motion.a>
  );
}
