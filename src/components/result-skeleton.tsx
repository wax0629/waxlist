"use client";

export function ResultSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full space-y-3" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--ink-elevated)] px-4 py-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--gold)]/40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--gold)]" />
        </span>
        <p className="text-[12px] text-[var(--gold-soft)]">{label}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--ink-elevated)]"
          >
            <div className="aspect-[16/10] animate-pulse bg-[var(--ink-2)]" />
            <div className="space-y-2 p-3.5">
              <div className="h-3 w-[80%] animate-pulse rounded bg-[var(--ink-2)]" />
              <div className="h-2.5 w-[40%] animate-pulse rounded bg-[var(--ink-2)]" />
              <div className="h-2.5 w-full animate-pulse rounded bg-[var(--ink-2)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
