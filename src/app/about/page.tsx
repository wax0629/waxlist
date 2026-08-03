import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col text-zinc-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <p className="text-xs font-medium uppercase tracking-wider text-violet-300/80">
          Beta
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
          关于 Beat Hunter
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400">
          <p>
            Beat Hunter 帮助<strong className="text-zinc-200">歌手与说唱人</strong>
            用自然语言或参考曲链接，快速收成可试听的伴奏短名单——而不是在 YouTube
            上自己猜关键词、翻噪音结果。
          </p>
          <p>
            当前阶段聚焦 <strong className="text-zinc-200">找伴奏 Agent</strong>
            。同站「地下精选」为后续模块，会认真单独建设，本 Beta 不包含。
          </p>
          <h2 className="pt-2 text-base font-medium text-zinc-200">如何工作</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>理解你的风格、速度、人声向与避开项</li>
            <li>生成多路伴奏域检索词（type beat / instrumental）</li>
            <li>检索并过滤排序，给出 3～5 条可点开结果与理由</li>
            <li>支持多轮 refine 收窄</li>
          </ol>
          <h2 className="pt-2 text-base font-medium text-zinc-200">合规说明</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>结果仅供试听与发现参考，商用授权以源站为准。</li>
            <li>我们链出官方页面，不提供未授权下载或绕过平台防护。</li>
            <li>第三方 API（如 YouTube、大模型）受其服务条款与配额约束。</li>
          </ul>
          <p className="pt-4">
            <Link
              href="/chat"
              className="text-violet-300 underline-offset-2 hover:text-violet-200 hover:underline"
            >
              开始找伴奏 →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
