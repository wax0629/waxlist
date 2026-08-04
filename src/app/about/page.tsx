import Link from "next/link";
import { AppRail } from "@/components/app-rail";

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-1 text-[var(--cream)]">
      <AppRail />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-[#ff8fb3]">
          Beta
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white">
          关于 Waxlist
        </h1>
        <div className="mt-8 space-y-5 text-[15px] leading-relaxed text-white/78">
          <p>
            <strong className="font-medium text-white/85">Waxlist</strong>{" "}
            是听专、荐专与口碑沉淀的社区（一期偏中文地下发行 / 网易云外链）：红心、站主爱听、1–10 评分与推荐理由。
          </p>
          <p>
            站内找伴奏模块仍叫{" "}
            <strong className="font-medium text-white/85">Beat Hunter</strong>
            ：帮歌手与说唱人用自然语言或参考曲链接，快速收成可试听的伴奏短名单。
          </p>
          <h2 className="pt-2 font-display text-lg font-semibold text-white">
            Beat Hunter 如何工作
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>理解你的风格、速度、人声向与避开项</li>
            <li>生成多路伴奏域检索词（type beat / instrumental）</li>
            <li>检索并过滤排序，给出 3～5 条可点开结果与理由</li>
            <li>支持多轮 refine 收窄</li>
          </ol>
          <h2 className="pt-2 font-display text-lg font-semibold text-white">
            合规说明
          </h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>结果仅供试听与发现参考，商用授权以源站为准。</li>
            <li>我们链出官方页面，不提供未授权下载或绕过平台防护。</li>
            <li>第三方 API（如 YouTube、大模型）受其服务条款与配额约束。</li>
          </ul>
          <p className="pt-6">
            <Link
              href="/explore"
              className="touri-grad inline-flex items-center rounded-full px-5 py-2.5 font-display text-[13px] font-semibold text-white shadow-[0_10px_28px_-10px_rgba(155,81,224,0.55)]"
            >
              打开精选 →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
