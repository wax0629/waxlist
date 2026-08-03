"use client";

export function ResultSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full max-w-[95%] space-y-3" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400/50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
        </span>
        <p className="text-[12px] text-violet-200/80">{label}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025]"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="aspect-[16/10] animate-pulse bg-zinc-800/80" />
            <div className="space-y-2 p-3.5">
              <div className="h-3 w-4/5 animate-pulse rounded bg-zinc-800/90" />
              <div className="h-2.5 w-2/5 animate-pulse rounded bg-zinc-800/70" />
              <div className="h-2.5 w-full animate-pulse rounded bg-zinc-800/50" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
