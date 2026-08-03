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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: index * 0.05 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-violet-400/40 hover:bg-white/[0.08]"
    >
      {beat.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={beat.thumbnail}
          alt=""
          className="h-28 w-full object-cover opacity-90 transition group-hover:opacity-100"
        />
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-snug text-zinc-100 group-hover:text-white">
            {beat.title}
          </h3>
          <span
            className={
              beat.source === "youtube"
                ? "shrink-0 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300/90"
                : "shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400"
            }
          >
            {beat.source}
          </span>
        </div>
        {beat.channel_title ? (
          <p className="text-[11px] text-zinc-500">{beat.channel_title}</p>
        ) : null}
        <p className="text-xs leading-relaxed text-zinc-400">{beat.reason}</p>
        <span className="mt-auto text-xs text-violet-300/90 group-hover:text-violet-200">
          打开源站 →
        </span>
      </div>
    </motion.a>
  );
}
