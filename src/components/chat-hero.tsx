"use client";

const STEPS = [
  { n: "01", t: "描述或贴链接", d: "风格 · 情绪 · 人声向 · 参考曲" },
  { n: "02", t: "策略检索", d: "多路 type beat 词 + 过滤排序" },
  { n: "03", t: "试听短名单", d: "3～5 条结果，可继续 refine" },
];

export function ChatHero({
  suggestions,
  onPick,
  disabled,
}: {
  suggestions: string[];
  onPick: (s: string) => void;
  disabled?: boolean;
}) {
  return (
    <section className="flex h-full flex-col justify-center gap-10 py-6 lg:py-10">
      <div className="max-w-xl space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[11px] font-medium text-violet-200/80">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
          Beat Hunter · 找伴奏 Beta
        </div>
        <h1 className="text-3xl font-semibold leading-[1.15] tracking-tight text-zinc-50 sm:text-4xl lg:text-[2.75rem]">
          用一句话，
          <br />
          <span className="bg-gradient-to-r from-violet-200 via-fuchsia-100 to-violet-300 bg-clip-text text-transparent">
            猎到能唱的伴奏
          </span>
        </h1>
        <p className="max-w-lg text-[15px] leading-relaxed text-zinc-500">
          先理解你的需求，再生成伴奏域检索策略并收成短名单——不是套一层 YouTube 搜索框。
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]"
          >
            <span className="font-mono text-[11px] text-violet-400/80">{s.n}</span>
            <p className="mt-2 text-[14px] font-medium text-zinc-100">{s.t}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-zinc-500">{s.d}</p>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-600">
          从这里开始
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s)}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 text-left text-[13px] text-zinc-300 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition hover:border-violet-400/30 hover:bg-violet-500/[0.08] hover:text-zinc-50 disabled:opacity-50 sm:rounded-full sm:py-2.5"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
