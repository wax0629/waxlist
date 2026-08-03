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
    <section className="flex h-full flex-col justify-center gap-10 py-6 lg:py-12">
      <div className="max-w-xl space-y-5">
        <div className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium tracking-wide text-sky-100/90">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-cyan-300 to-violet-300 shadow-[0_0_12px_rgba(165,180,252,0.9)]" />
          Beat Hunter · 找伴奏 Beta
        </div>
        <h1 className="font-display text-[2rem] font-semibold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.85rem]">
          用一句话，
          <br />
          <span className="gold-gradient-text">猎到能唱的伴奏</span>
        </h1>
        <p className="max-w-lg text-[15px] leading-[1.7] text-white/55">
          先理解你的需求，再生成伴奏域检索策略并收成短名单——不是套一层 YouTube
          搜索框。
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3 lg:max-w-3xl">
        {STEPS.map((s) => (
          <li key={s.n} className="glass-panel rounded-2xl p-4">
            <span className="font-mono text-[11px] text-sky-200/70">{s.n}</span>
            <p className="mt-2 font-display text-[15px] font-semibold tracking-tight text-white/95">
              {s.t}
            </p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">
              {s.d}
            </p>
          </li>
        ))}
      </ol>

      <div className="space-y-3">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
          Start here
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s)}
              className="glass rounded-2xl px-4 py-3 text-left text-[13px] text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white disabled:opacity-50 sm:rounded-full sm:py-2.5"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
