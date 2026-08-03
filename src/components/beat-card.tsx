import type { BeatCandidate } from "@/lib/types";

export function BeatCard({ beat }: { beat: BeatCandidate }) {
  return (
    <a
      href={beat.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md transition hover:border-violet-400/40 hover:bg-white/[0.08]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug text-zinc-100 group-hover:text-white">
          {beat.title}
        </h3>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
          {beat.source}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-zinc-400">{beat.reason}</p>
      <span className="mt-auto text-xs text-violet-300/90 group-hover:text-violet-200">
        打开源站 →
      </span>
    </a>
  );
}
