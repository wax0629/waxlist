"use client";

export function EmptyResults({
  onRetry,
  onNewDirection,
}: {
  onRetry?: () => void;
  onNewDirection?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center">
      <p className="text-[13px] font-medium text-zinc-300">这轮没有合适的短名单</p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500">
        可以换种说法（更具体的风格/速度），或贴一条参考曲链接再试。
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-10 rounded-xl bg-white/[0.06] px-4 py-2 text-[12px] font-medium text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/[0.1]"
          >
            用原话再试一次
          </button>
        ) : null}
        {onNewDirection ? (
          <button
            type="button"
            onClick={onNewDirection}
            className="min-h-10 rounded-xl px-4 py-2 text-[12px] text-zinc-500 transition hover:text-zinc-300"
          >
            清空重来
          </button>
        ) : null}
      </div>
    </div>
  );
}
