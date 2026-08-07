import Link from "next/link";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
import { FeedbackForm } from "@/components/feedback-form";
import packageJson from "../../../package.json";

/** 与 package.json 同步；展示用 v 前缀 */
const APP_VERSION = `v${packageJson.version}`;
const RELEASE_STAGE = "内测";

const PILLARS = [
  {
    key: "find",
    label: "find",
    title: "发现",
    desc: "从散落的发行里捞出值得打开的一张，而不是再刷一遍脸熟的歌。",
  },
  {
    key: "rec",
    label: "rec",
    title: "推出去",
    desc: "不只说「好听」——说清楚为什么是这张、适合什么心情、卡在哪一句。",
  },
  {
    key: "heart",
    label: "heart",
    title: "放进心里",
    desc: "红心、站主爱听与友情标记，让好专留下可回看的痕迹。",
  },
] as const;

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="w-full min-w-0 flex-1 px-3 pt-5 pb-16 sm:px-6 sm:pt-8 md:px-8 md:pb-28 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-6">
            <BackLink href="/explore" label="返回优质发行" />
          </div>

          {/* —— Hero —— */}
          <header className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-[#ff6b9e]/[0.06] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div
              className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#9B51E0]/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#FF6B9E]/15 blur-3xl"
              aria-hidden
            />

            <div className="relative flex flex-wrap items-start justify-between gap-6 pr-2 sm:pr-4">
              <div className="min-w-0 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
                    About
                  </p>
                  <span className="rounded-full border border-[#ff6b9e]/45 bg-[#ff6b9e]/18 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.08em] text-[#ffc2d6]">
                    {RELEASE_STAGE}
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/[0.06] px-2.5 py-0.5 font-mono text-[10px] tabular-nums tracking-wide text-white/75">
                    {APP_VERSION}
                  </span>
                </div>
                <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                  关于 Waxlist
                </h1>
                <p className="mt-4 text-[15px] leading-relaxed text-white/88 sm:text-base">
                  歌荒的时候，总希望有人把「这张真的值得听」递到面前。
                  <br className="hidden sm:block" />
                  Waxlist
                  为此而建：听专、荐专与红心——让好发行被看见。
                </p>
                <p className="mt-3 font-mono text-[12px] tracking-[0.14em] text-white/65">
                  find · rec · heart
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5">
                <Link
                  href="/explore"
                  className="glass-btn px-5 py-2.5 font-display text-[13px] font-semibold"
                >
                  打开优质发行 →
                </Link>
                <Link
                  href="/explore/submit"
                  className="rounded-full border border-white/28 bg-white/[0.06] px-5 py-2.5 text-[13px] font-medium text-white/90 transition hover:border-white/40 hover:bg-white/[0.1] hover:text-white"
                >
                  推一张专
                </Link>
              </div>
            </div>
          </header>

          {/* —— Version / stage —— */}
          <section className="mt-6 rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
                  Version
                </p>
                <h2 className="mt-1 font-display text-lg font-semibold text-white">
                  版本信息
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-white/75">
                  当前为<strong className="font-medium text-white/90">内测阶段</strong>
                  ，功能与界面会持续调整；欢迎反馈问题与想听的专。正式公开前不保证接口与数据格式长期稳定。
                </p>
              </div>
              <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:text-sm">
                <div>
                  <dt className="text-[11px] text-white/45">阶段</dt>
                  <dd className="mt-0.5 font-medium text-[#ffc2d6]">
                    {RELEASE_STAGE}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-white/45">版本号</dt>
                  <dd className="mt-0.5 font-mono tabular-nums text-white">
                    {APP_VERSION}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-white/45">主线</dt>
                  <dd className="mt-0.5 text-white/85">优质发行</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-white/45">找伴奏</dt>
                  <dd className="mt-0.5 text-white/85">
                    Beat Hunter · Beta
                  </dd>
                </div>
              </dl>
            </div>
          </section>

          {/* —— Pillars —— */}
          <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {PILLARS.map((p) => (
              <div
                key={p.key}
                className="rounded-2xl border border-white/12 bg-white/[0.035] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#ff9fbc]">
                  {p.label}
                </p>
                <h2 className="mt-1.5 font-display text-lg font-semibold text-white">
                  {p.title}
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                  {p.desc}
                </p>
              </div>
            ))}
          </section>

          <div
            className="mt-10 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.12) 8%, rgba(230,242,255,0.4) 50%, rgba(200,225,255,0.12) 92%, transparent 100%)",
            }}
            aria-hidden
          />

          {/* —— Story grid —— */}
          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
            <div className="min-w-0 space-y-8 lg:col-span-7 xl:col-span-8">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-6 sm:py-7">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
                  Story
                </p>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-white">
                  名字与初心
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/88">
                  <p>
                    站主网名是{" "}
                    <strong className="font-medium text-white">Wackox</strong>
                    ——有点「奇怪的 X」的意思，缩写正好是{" "}
                    <strong className="font-medium text-white">WAX</strong>。
                    在黑胶与厂牌语境里，wax 也常指唱片、那层被刻下纹路的蜡：
                    不是一闪而过的单曲流，而是一张可以反复翻开的「片」。于是有了{" "}
                    <strong className="font-medium text-white">Waxlist</strong>
                    ——wax + list：一份好发行的清单，一块慢慢攒起来的听单。
                  </p>
                  <p>
                    做这个站的起点很朴素。很多时候不是不爱听，而是不知道下一张该听什么——
                    算法还在推脸熟的歌，扎实、有态度的发行却散落各处。我们想在歌荒时仍能遇见{" "}
                    <strong className="font-medium text-white">优质发行</strong>
                    ：有人推、有人愿意写下为什么推、有人点红心——让「好听」留下痕迹。
                    也对创作者开放：独立音乐人可以把作品递上来，让更多人听到、留下一句认真的话。
                    它首先是交流与发现的场，不是排行榜竞赛。
                  </p>
                  <p>
                    初期会以{" "}
                    <strong className="font-medium text-white">UDG</strong>{" "}
                    与相近的独立 / 自发行听众为入口——那里好专多、也容易散落，
                    也是站主最熟悉的土壤。先把「推得准、听得进、留得下」做扎实。
                    店招仍是「优质发行」，不把圈层写进招牌：UDG 是起点，不是天花板。
                    用户与内容长起来后，收录会自然铺向更多风格与形态，并逐步建立分类与索引——
                    分类是导航，不是围墙。
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-6 sm:px-6 sm:py-7">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
                  Roadmap
                </p>
                <h2 className="mt-1.5 font-display text-xl font-semibold text-white">
                  现在与往后
                </h2>
                <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-white/88">
                  <p>
                    主线是{" "}
                    <strong className="font-medium text-white">优质发行</strong>
                    ：浏览封面与详情、红心与「站主爱听」、荐专；评分和评论公开可读，发布仅向小范围内测账号开放。一期优先网易云外链。
                    还有专辑盲盒，随手开一张今天的专。find · rec ·
                    heart，比堆数量更重要。
                  </p>
                  <p>
                    往后会随大家怎么用而长，包括但不限于：近期发行收集、荐专
                    Agent、分类索引与听单沉淀、创作者侧更清晰的上架与反馈。
                    先把「一张专被认真推上来」做踏实。
                  </p>
                  <p className="text-white/82">
                    站内另有找伴奏{" "}
                    <Link
                      href="/chat"
                      className="font-medium text-white underline-offset-2 transition hover:text-[#ff9fbc] hover:underline"
                    >
                      Beat Hunter
                    </Link>
                    <span className="ml-1.5 rounded-full border border-[#ff6b9e]/40 bg-[#ff6b9e]/15 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#ffc2d6]">
                      Beta
                    </span>
                    ——仍在研发测试，与听专任务分开，不抢主线；结果仅供试听参考。
                  </p>
                </div>

                <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {[
                    "内测阶段：小范围邀请，攒下第一批真推与真听",
                    "公开上线后：稳定迭代，版本成熟再推生产",
                    "分类与索引逐步补上，不急着铺满",
                    "交流群将在用户到一定规模后开放",
                  ].map((line) => (
                    <li
                      key={line}
                      className="flex gap-2.5 rounded-xl border border-white/12 bg-black/25 px-3.5 py-3 text-[13px] leading-snug text-white/85"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff9fbc]"
                        aria-hidden
                      />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>

              <FeedbackForm />

              <section className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5 sm:px-6">
                <h2 className="font-display text-base font-semibold text-white">
                  合规说明
                </h2>
                <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-white/75">
                  <li className="flex gap-2">
                    <span className="text-white/45">·</span>
                    外链与结果仅供试听与发现参考，商用授权以源站为准。
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white/45">·</span>
                    链出官方页面，不提供未授权下载或绕过平台防护。
                  </li>
                  <li className="flex gap-2">
                    <span className="text-white/45">·</span>
                    第三方服务受其条款与配额约束。
                  </li>
                </ul>
              </section>
            </div>

            {/* —— Side: host + contact —— */}
            <aside className="min-w-0 space-y-5 lg:col-span-5 xl:col-span-4">
              <div className="lg:sticky lg:top-6 space-y-5">
                <section className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
                    Host
                  </p>
                  <h2 className="mt-1.5 font-display text-xl font-semibold text-white">
                    关于站主
                  </h2>
                  <div className="mt-4 space-y-3.5 text-[14px] leading-relaxed text-white/88">
                    <p>
                      我是说唱爱好者，从高中一头扎进这片声音到现在也有六七年——
                      写过、录过、混过，仍会为一段干净的 808 或一句扎心的词兴奋很久。
                      同时也是很「沉」的 UDG 与独立发行听众：喜欢没被打磨得太圆的棱角，
                      也珍惜一张专被认真做完的完整感。
                    </p>
                    <p>
                      听得多了，更懂推荐有多难——不是安利一句「好听」，
                      而是说清楚为什么是这张。站主爱听、审核、那一点点策展上的固执，
                      都来自同一处：希望这里攒下的，是自己也会反复打开的东西。
                    </p>
                  </div>
                </section>

                <section className="rounded-2xl border border-[#ff6b9e]/35 bg-[#ff6b9e]/[0.09] px-5 py-5">
                  <h2 className="font-display text-lg font-semibold text-white">
                    让更多同好看见
                  </h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-white/80">
                    如果 Waxlist 帮你遇见了一张好专，欢迎在 GitHub
                    点一个 Star。这个小动作会让项目更容易被更多独立音乐听众发现。
                  </p>
                  <a
                    href="https://github.com/wax0629/waxlist"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-black transition hover:bg-[#ffe3ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    在 GitHub 上支持 Waxlist ↗
                  </a>
                </section>

                <section className="rounded-2xl border border-[#ff6b9e]/30 bg-[#ff6b9e]/[0.08] px-5 py-5">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[#ffc2d6]">
                    Contact
                  </p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-white">
                    联系
                  </h2>
                  <ul className="mt-4 space-y-3">
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-black/25 px-3.5 py-3">
                      <span className="text-[12px] text-white/65">微信</span>
                      <span className="font-mono text-[13px] text-white">
                        Wackox
                      </span>
                    </li>
                    <li className="flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-black/25 px-3.5 py-3">
                      <span className="text-[12px] text-white/65">邮箱</span>
                      <a
                        href="mailto:xux9278@gmail.com"
                        className="truncate font-mono text-[13px] text-[#ff9fbc] underline-offset-2 hover:underline"
                      >
                        xux9278@gmail.com
                      </a>
                    </li>
                  </ul>
                  <p className="mt-3.5 text-[12px] leading-relaxed text-white/75">
                    合作、反馈、荐专，或聊聊最近在听什么，都欢迎打招呼；做歌需要混音也可以联系我。
                    用户到一定规模后会考虑建交流群，入口会在本页或站内同步。
                  </p>
                </section>

                <div className="rounded-2xl border border-dashed border-white/22 px-5 py-5 text-center">
                  <p className="text-[13px] text-white/80">
                    内测 / 想一起听专荐专？
                  </p>
                  <p className="mt-1 text-[12px] text-white/65">
                    加微信备注「Waxlist」即可
                  </p>
                  <Link
                    href="/explore"
                    className="mt-4 inline-flex text-sm font-medium text-[#ff9fbc] transition hover:text-[#ffc2d6] hover:underline"
                  >
                    先去逛逛优质发行 →
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
