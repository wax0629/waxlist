"use client";

export function EmptyResults({
  onRetry,
  onNewDirection,
}: {
  onRetry?: () => void;
  onNewDirection?: () => void;
}) {
  return (
    <div className="glass-panel rounded-2xl border-dashed px-4 py-6 text-center">
      <p className="font-display text-[14px] font-semibold text-white/90">
        这轮没有合适的短名单
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">
        可以换种说法（更具体的风格/速度），或贴一条参考曲链接再试。
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="glass min-h-10 rounded-xl px-4 py-2 text-[12px] font-medium text-white/85 transition hover:bg-white/12"
          >
            用原话再试一次
          </button>
        ) : null}
        {onNewDirection ? (
          <button
            type="button"
            onClick={onNewDirection}
            className="min-h-10 rounded-xl px-4 py-2 text-[12px] text-white/40 transition hover:text-white/70"
          >
            清空重来
          </button>
        ) : null}
      </div>
    </div>
  );
}
