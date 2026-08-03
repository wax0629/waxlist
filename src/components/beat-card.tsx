"use client";

import { motion } from "framer-motion";
import type { BeatCandidate } from "@/lib/types";

/**
 * Destination-card style (travel-dashboard inspired):
 * large cover, overlay title, soft glass footer with reason.
 */
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
          ? "group relative col-span-full flex min-h-[220px] overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--ink-elevated)] shadow-[0_24px_60px_-30px_rgba(0,0,0,0.85)] sm:min-h-[260px] lg:col-span-2"
          : "group relative flex min-h-[200px] flex-col overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-[var(--ink-elevated)] shadow-[0_20px_50px_-32px_rgba(0,0,0,0.9)] transition duration-300 hover:-translate-y-1 hover:border-[rgba(212,165,116,0.32)]"
      }
    >
      {/* Full-bleed media */}
      <div className="absolute inset-0">
        {beat.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--ink-elevated)] to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-transparent opacity-80" />
      </div>

      {/* Top badges */}
      <div className="relative z-10 flex items-start justify-between p-3.5">
        <span className="rounded-full bg-black/45 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--gold-soft)] backdrop-blur-md ring-1 ring-white/10">
          {beat.source}
        </span>
        <span className="rounded-full bg-[var(--gold)]/95 px-2.5 py-1 text-[10px] font-bold text-[var(--ink)] opacity-0 shadow-lg transition group-hover:opacity-100">
          试听
        </span>
      </div>

      {/* Bottom content — destination-style overlay */}
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
        <p className="line-clamp-2 text-[12px] leading-relaxed text-white/65">
          {beat.reason || "点开试听，判断是否合拍。"}
        </p>
      </div>
    </motion.a>
  );
}
