"use client";

const STEPS = [
  { n: "01", t: "说清楚", d: "风格、情绪、人声向，或贴参考曲" },
  { n: "02", t: "策略检索", d: "多路 type beat 词 + 过滤排序" },
  { n: "03", t: "短名单", d: "3～5 条可点开试听，可再 refine" },
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
    <section className="flex flex-col items-stretch gap-8 px-1 pb-4 pt-6 sm:pt-10">
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-300/70">
          Beat Hunter · Beta
        </p>
        <h1 className="text-[1.65rem] font-semibold leading-[1.2] tracking-tight text-zinc-50 sm:text-3xl">
          用一句话，
          <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200/90 bg-clip-text text-transparent">
            猎到能唱的伴奏
          </span>
        </h1>
        <p className="mx-auto max-w-md text-[13px] leading-relaxed text-zinc-500 sm:mx-0">
          不是套一层 YouTube 搜索。先理解你的需求，再生成伴奏域检索策略，收成可试听短名单。
        </p>
      </div>

      <ol className="grid gap-2 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-3 text-left"
          >
            <span className="font-mono text-[10px] text-violet-400/70">{s.n}</span>
            <p className="mt-1 text-[13px] font-medium text-zinc-200">{s.t}</p>
            <p className="mt-0.5 text-[11px] leading-snug text-zinc-550 text-zinc-500">
              {s.d}
            </p>
          </li>
        ))}
      </ol>

      <div className="space-y-2.5">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">
          从这里开始
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s)}
              className="min-h-11 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left text-[13px] text-zinc-300 transition active:scale-[0.99] hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-zinc-100 disabled:opacity-50 sm:min-h-0 sm:rounded-full sm:py-2 sm:text-[12px]"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
