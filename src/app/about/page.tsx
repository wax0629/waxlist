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
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
          这里放产品设想与站点说明。设计初心、关于站主等会陆续补全。
        </p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-white/78">
          {/* —— 产品是什么 —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              产品是什么
            </h2>
            <p>
              <strong className="font-medium text-white/90">Waxlist</strong>{" "}
              是听专、荐专与口碑沉淀的社区：浏览发行、红心收藏、评分与推荐理由，让「好专」被看见、被记住。
            </p>
            <p>
              站内另有找伴奏模块{" "}
              <strong className="font-medium text-white/90">Beat Hunter</strong>
              ：用自然语言或参考曲，快速收成可试听的 type beat 短名单——创作侧工具，与听专社区同站、任务分开。
            </p>
          </section>

          {/* —— 优质发行 —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              优质发行
            </h2>
            <p>
              主入口叫{" "}
              <strong className="font-medium text-white/90">优质发行</strong>
              （路径{" "}
              <code className="rounded bg-white/8 px-1.5 py-0.5 text-[13px] text-white/85">
                /explore
              </code>
              ）：不绑死某个圈层标签，强调「值得听、值得推」的发行本身。
            </p>
            <ul className="list-disc space-y-2 pl-5 text-white/72">
              <li>浏览封面列表与详情（曲目、推荐理由、评分）</li>
              <li>登录后红心 →「我的红心」；站主红心显示「站主爱听」</li>
              <li>人人可荐专：普通用户新专进审核，站主直上；再推即时展示</li>
              <li>一期优先网易云外链与可解析元数据，后续可扩其它来源</li>
            </ul>
          </section>

          {/* —— 现在的设想 —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              现在的设想
            </h2>
            <p className="text-white/72">
              以下是当前阶段的产品设想（会随实践调整，不是永久宣言）：
            </p>
            <ul className="list-disc space-y-2 pl-5 text-white/72">
              <li>
                <strong className="font-medium text-white/85">冷启动听众</strong>
                ：初期用户可能以地下 / 独立 / 自发行向听众居多——这是起点，不是天花板。
              </li>
              <li>
                <strong className="font-medium text-white/85">不靠圈层店招</strong>
                ：店招用「优质发行」，风格与场景用内容、标签和口碑自然呈现。
              </li>
              <li>
                <strong className="font-medium text-white/85">dig · rec · heart</strong>
                ：挖到一张、愿意推、愿意心——比堆数量更重要。
              </li>
              <li>
                <strong className="font-medium text-white/85">一站两页</strong>
                ：听专社区与找伴奏工具任务分离；需要时再弱连接（例如把某张专当参考去找伴奏）。
              </li>
              <li>
                <strong className="font-medium text-white/85">质量优先</strong>
                ：策展感 + 社区推荐 + 审核，而不是无边界的大库。
              </li>
            </ul>
          </section>

          {/* —— 设计初心（占位） —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              设计初心
            </h2>
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-white/55">
              待补充。想写清楚：为什么做 Waxlist、想解决什么听专/荐专上的难受、视觉与交互上在意什么。
            </p>
          </section>

          {/* —— 关于站主（占位） —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              关于站主
            </h2>
            <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 text-white/55">
              待补充。可放一点关于你的介绍、在听什么、如何联系，或站主爱听背后的审美。
            </p>
          </section>

          {/* —— Beat Hunter —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              Beat Hunter 如何工作
            </h2>
            <ol className="list-decimal space-y-2 pl-5 text-white/72">
              <li>理解你的风格、速度、人声向与避开项</li>
              <li>生成多路伴奏域检索词（type beat / instrumental）</li>
              <li>检索并过滤排序，给出 3～5 条可点开结果与理由</li>
              <li>支持多轮 refine 收窄</li>
            </ol>
          </section>

          {/* —— 合规 —— */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-white">
              合规说明
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-white/72">
              <li>结果与外链仅供试听与发现参考，商用授权以源站为准。</li>
              <li>我们链出官方页面，不提供未授权下载或绕过平台防护。</li>
              <li>第三方 API（如 YouTube、大模型）受其服务条款与配额约束。</li>
            </ul>
          </section>

          <p className="pt-2">
            <Link
              href="/explore"
              className="glass-btn px-5 py-2.5 font-display text-[13px] font-semibold"
            >
              打开优质发行 →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
