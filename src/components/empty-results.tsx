"use client";

export function EmptyResults({
  onRetry,
  onNewDirection,
}: {
  onRetry?: () => void;
  onNewDirection?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--ink-elevated)]/50 px-4 py-6 text-center">
      <p className="font-display text-[14px] font-semibold text-[var(--cream-soft)]">
        这轮没有合适的短名单
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--cream-muted)]">
        可以换种说法（更具体的风格/速度），或贴一条参考曲链接再试。
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-10 rounded-xl bg-[var(--gold-dim)] px-4 py-2 text-[12px] font-medium text-[var(--gold-soft)] ring-1 ring-[rgba(212,165,116,0.25)] transition hover:bg-[rgba(212,165,116,0.22)]"
          >
            用原话再试一次
          </button>
        ) : null}
        {onNewDirection ? (
          <button
            type="button"
            onClick={onNewDirection}
            className="min-h-10 rounded-xl px-4 py-2 text-[12px] text-[var(--cream-faint)] transition hover:text-[var(--cream-muted)]"
          >
            清空重来
          </button>
        ) : null}
      </div>
    </div>
  );
}
