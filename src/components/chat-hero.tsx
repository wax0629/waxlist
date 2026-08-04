"use client";

import Link from "next/link";

const STEPS = [
  { n: "01", t: "描述或贴链接", d: "风格 · 情绪 · 人声向 · 参考曲", icon: "🎧" },
  { n: "02", t: "策略检索", d: "多路 type beat 词 + 过滤排序", icon: "✨" },
  { n: "03", t: "试听短名单", d: "3～5 条结果，可继续 refine", icon: "🎵" },
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
    <section className="flex h-full flex-col justify-center gap-8 py-6 lg:gap-10 lg:py-10">
      <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <div className="mb-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#ff8fb3]">
            Beta
          </span>
          <span className="text-[11px] text-white/45">· 研发测试中</span>
        </div>
        <h1 className="max-w-md text-[22px] font-normal leading-relaxed text-white/80 sm:text-2xl">
          准备好找到{" "}
          <strong className="font-bold text-white">能开口唱的伴奏</strong>
          了吗？
          <br />
          描述气质，或贴一条参考曲链接。
        </h1>
      </div>

      {/* Soft beta / product focus notice */}
      <div className="glass-frame rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-left sm:px-5">
        <p className="text-[12px] font-medium text-white/80">
          关于当前阶段
        </p>
        <p className="mt-2 text-[12px] leading-relaxed text-white/62">
          Beat Hunter 仍在研发与内测，能力与稳定性会持续迭代，欢迎试用与反馈。
          本站现阶段以{" "}
          <Link
            href="/explore"
            className="font-medium text-[#ff8fb3] underline-offset-2 hover:underline"
          >
            优质发行
          </Link>{" "}
          的听专、荐专与口碑为主；找伴奏作为相邻能力开放体验，结果仅供试听与发现参考，商用授权请以源站为准。
        </p>
      </div>

      {/* Touri feature cards: pure transparent + border only */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="glass-frame p-5 transition hover:border-white/40">
            <div className="mb-3 text-xl opacity-80">{s.icon}</div>
            <h3 className="m-0 text-[13px] font-semibold text-white">{s.t}</h3>
            <p className="mt-1.5 text-[11px] leading-relaxed text-white/68">
              {s.d}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-white/58">
          试试这样问
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={disabled}
              onClick={() => onPick(s)}
              className="rounded-full border border-white/24 bg-transparent px-4 py-2.5 text-left text-[13px] font-medium text-white/75 transition hover:border-white/25 hover:text-white disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
