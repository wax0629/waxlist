"use client";

export function ResultSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full space-y-3" aria-busy="true" aria-live="polite">
      <div className="glass flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff6b9e]/50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-gradient-to-br from-[#ff6b9e] to-[#9b51e0]" />
        </span>
        <p className="text-[12px] text-[#ffb3cc]/90">{label}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-panel overflow-hidden rounded-2xl">
            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="aspect-video animate-pulse bg-white/[0.04]" />
              <div className="space-y-2 px-2.5 py-2.5">
                <div className="h-3 w-[90%] animate-pulse rounded bg-white/10" />
                <div className="h-2.5 w-[50%] animate-pulse rounded bg-white/8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
