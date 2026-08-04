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
      className="glass-rim group flex w-full flex-col overflow-hidden rounded-2xl bg-transparent transition duration-300 hover:-translate-y-0.5 hover:border-white/50"
    >
      {/* YouTube-style 16:9 thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute left-2 top-2 flex items-start justify-between gap-2">
          <span className="rounded-full border border-white/28 bg-black/50 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
            {beat.source}
          </span>
        </div>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-slate-900 opacity-0 shadow-lg transition group-hover:opacity-100">
          试听
        </span>
      </div>

      {/* Meta under thumb — like YT title/channel */}
      <div className="space-y-1 px-2.5 py-2.5">
        <h3 className="line-clamp-2 font-display text-[13px] font-semibold leading-snug tracking-tight text-white">
          {beat.title}
        </h3>
        <p className="truncate text-[11px] text-white/70">
          {beat.channel_title || "未知频道"}
        </p>
        <p className="line-clamp-2 text-[11px] leading-relaxed text-white/75">
          {beat.reason || "点开试听，判断是否合拍。"}
        </p>
      </div>
    </motion.a>
  );
}
