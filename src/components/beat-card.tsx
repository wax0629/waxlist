"use client";

import { motion } from "framer-motion";
import type { BeatCandidate } from "@/lib/types";

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
      transition={{ duration: 0.32, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] shadow-xl shadow-black/40 ring-1 ring-white/[0.03] backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/25 hover:bg-white/[0.055] hover:shadow-violet-950/20"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-zinc-900/80">
        {beat.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beat.thumbnail}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-950/50 to-zinc-900 text-xs text-zinc-600">
            No cover
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span
          className={
            beat.source === "youtube"
              ? "absolute right-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-300/95 backdrop-blur-sm"
              : "absolute right-2 top-2 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-400 backdrop-blur-sm"
          }
        >
          {beat.source}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-100 transition group-hover:text-white">
          {beat.title}
        </h3>
        {beat.channel_title ? (
          <p className="truncate text-[11px] text-zinc-500">{beat.channel_title}</p>
        ) : null}
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
          {beat.reason}
        </p>
        <span className="mt-auto pt-2 text-[11px] font-medium text-violet-300/80 transition group-hover:text-violet-200">
          打开源站 →
        </span>
      </div>
    </motion.a>
  );
}
