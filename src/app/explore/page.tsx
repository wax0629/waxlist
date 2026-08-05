import Link from "next/link";
import { Suspense } from "react";
import type { Session } from "next-auth";
import { AppRail } from "@/components/app-rail";
import { ExploreSearchBar } from "@/components/explore-search-bar";
import { ReleaseCard } from "@/components/release-card";
import { UserMenu } from "@/components/user-menu";
import { auth } from "@/lib/auth";
import { favoritedReleaseIds } from "@/lib/favorites/store";
import { userRatingsForReleases } from "@/lib/ratings/store";
import {
  listReleases,
  type ReleaseSort,
} from "@/lib/releases/store";
import type { Release } from "@/lib/releases/types";

export const dynamic = "force-dynamic";

type FilterKey = "all" | "heart" | "loved" | "friend";

const SORT_OPTIONS: { key: ReleaseSort; label: string }[] = [
  { key: "rec", label: "推荐先后" },
  { key: "released", label: "发行时间" },
  { key: "rating", label: "评分" },
];

function parseFilter(raw: string | string[] | undefined): FilterKey {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "heart" || v === "loved" || v === "friend") return v;
  return "all";
}

function parseSort(raw: string | string[] | undefined): ReleaseSort {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "released" || v === "rating" || v === "rec") return v;
  return "rec";
}

function parseQuery(raw: string | string[] | undefined): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return (v ?? "").trim();
}

function exploreHref(
  filter: FilterKey,
  sort: ReleaseSort,
  q?: string,
): string {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("filter", filter);
  if (sort !== "rec") p.set("sort", sort);
  const qq = q?.trim();
  if (qq) p.set("q", qq);
  const s = p.toString();
  return s ? `/explore?${s}` : "/explore";
}

function hasFriendTag(r: Release): boolean {
  return Boolean(r.tags?.some((t) => t.trim() === "友情"));
}

function matchesQuery(r: Release, q: string): boolean {
  if (!q) return true;
  const n = q.toLowerCase();
  if (r.title.toLowerCase().includes(n)) return true;
  if (r.artists.some((a) => a.toLowerCase().includes(n))) return true;
  if (r.tags?.some((t) => t.toLowerCase().includes(n))) return true;
  return false;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp.filter);
  const sort = parseSort(sp.sort);
  const q = parseQuery(sp.q);

  let session: Session | null = null;
  let items: Release[] = [];
  let mine = new Set<string>();
  let myScores = new Map<string, number>();
  let loadError: string | null = null;

  try {
    // auth 与列表并行，少一轮串行等待（Neon 跨区时尤其明显）
    const [sessionResult, listResult] = await Promise.all([
      auth().catch((err) => {
        console.error("[explore] auth()", err);
        return null;
      }),
      listReleases({ status: "published", sort }),
    ]);
    session = sessionResult as Session | null;
    items = listResult;
    if (session?.user?.id) {
      const ids = items.map((i) => i.id);
      const [fav, scores] = await Promise.all([
        favoritedReleaseIds(session.user.id, ids),
        userRatingsForReleases(session.user.id, ids),
      ]);
      mine = fav;
      myScores = scores;
    }
  } catch (err) {
    console.error("[explore] database", err);
    loadError =
      "数据库连接失败。请检查环境变量 DATABASE_URL，并对生产库执行 prisma db push。";
  }

  const heartCount = mine.size;
  const lovedCount = items.filter((r) => r.owner_loved).length;
  const friendCount = items.filter(hasFriendTag).length;

  let visible = items;
  if (filter === "heart") {
    visible = items.filter((r) => mine.has(r.id));
  } else if (filter === "loved") {
    visible = items.filter((r) => r.owner_loved);
  } else if (filter === "friend") {
    visible = items.filter(hasFriendTag);
  }
  if (q) {
    visible = visible.filter((r) => matchesQuery(r, q));
  }

  const browse: {
    key: FilterKey;
    label: string;
    count?: number;
    needAuth?: boolean;
  }[] = [
    { key: "all", label: "全部", count: items.length },
    {
      key: "heart",
      label: "我的红心",
      count: session?.user ? heartCount : undefined,
      needAuth: true,
    },
    { key: "loved", label: "站主爱听", count: lovedCount },
    { key: "friend", label: "友情", count: friendCount },
  ];

  const filterLabel =
    browse.find((b) => b.key === filter)?.label ?? "全部";
  const sortLabel =
    SORT_OPTIONS.find((s) => s.key === sort)?.label ?? "推荐先后";

  const submitHref = session?.user
    ? "/explore/submit"
    : "/login?callbackUrl=/explore/submit";

  return (
    <div className="flex min-h-dvh flex-1 flex-col text-white md:flex-row">
      <AppRail />
      {/* 网页端 main 底部明确留白，列表最后一行下方能看出空 */}
      <main className="w-full min-w-0 flex-1 px-3 pb-16 sm:px-6 md:px-8 md:pb-28 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          {/* 吸顶：左完整标题文案 + 右搜索；顶部与屏幕多留一点空 */}
          <div
            className="sticky z-30 -mx-3 px-3 pt-5 pb-1.5 sm:-mx-6 sm:px-6 sm:pt-7 sm:pb-2 md:-mx-8 md:px-8 md:pt-8 lg:-mx-10 lg:px-10 xl:-mx-12 xl:px-12"
            style={{ top: "env(safe-area-inset-top, 0px)" }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 -top-[env(safe-area-inset-top,0px)] bottom-0 -z-10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.28) 55%, rgba(5,5,5,0) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                maskImage:
                  "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)",
                WebkitMaskImage:
                  "linear-gradient(180deg, #000 0%, #000 72%, transparent 100%)",
              }}
              aria-hidden
            />

            <div className="flex items-center gap-3 sm:gap-5 lg:gap-8">
              <header className="min-w-0 shrink-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 sm:text-[11px]">
                  Explore
                </p>
                <h1 className="mt-0.5 font-display text-[1.35rem] font-semibold tracking-tight sm:mt-1 sm:text-3xl">
                  优质发行
                </h1>
                <p className="mt-1 hidden text-sm leading-relaxed text-white/55 sm:mt-2 sm:block">
                  听专、荐专、红心与口碑。
                </p>
              </header>
              {/* 搜索略靠左；与登录/头像拉开间距 */}
              <div className="flex min-w-0 flex-1 items-center justify-end gap-4 sm:gap-5 lg:gap-6">
                <div className="min-w-0 w-full max-w-md md:max-w-lg lg:max-w-xl lg:mr-2 xl:mr-4">
                  <Suspense
                    fallback={
                      <div className="glass-search-input h-11 w-full animate-pulse rounded-2xl sm:h-12" />
                    }
                  >
                    <ExploreSearchBar initialQuery={q} />
                  </Suspense>
                </div>
                <div className="shrink-0">
                  <UserMenu />
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-2 h-px w-full sm:mt-2.5"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.12) 8%, rgba(230,242,255,0.4) 50%, rgba(200,225,255,0.12) 92%, transparent 100%)",
            }}
            aria-hidden
          />

          <div className="mt-3 grid grid-cols-1 gap-4 sm:mt-4 sm:gap-6 lg:grid-cols-12 lg:gap-8 xl:gap-10">
            <aside className="min-w-0 lg:col-span-3 xl:col-span-2">
              <div className="space-y-3 lg:sticky lg:top-24 lg:space-y-5">
                {/* 操作：玻璃按钮，放在「浏览」上方 */}
                <div className="flex gap-2 lg:flex-col">
                  <Link
                    href="/explore/today"
                    className="glass-btn min-w-0 flex-1 touch-manipulation px-3.5 py-2 text-[13px] font-medium lg:w-full lg:flex-none lg:rounded-xl lg:px-3"
                  >
                    专辑盲盒
                  </Link>
                  <Link
                    href={submitHref}
                    className="glass-btn min-w-0 flex-1 touch-manipulation px-3.5 py-2 text-[13px] font-medium lg:w-full lg:flex-none lg:rounded-xl lg:px-3"
                  >
                    推荐专辑
                  </Link>
                </div>

                <div className="hidden lg:block">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                    Browse
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">浏览</p>
                </div>

                <nav
                  className="scrollbar-none -mx-3 flex gap-2 overflow-x-auto px-3 pb-0.5 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0"
                  aria-label="浏览筛选"
                >
                  {browse.map((item) => {
                    const active = filter === item.key;
                    const href =
                      item.needAuth && !session?.user
                        ? `/login?callbackUrl=${encodeURIComponent(exploreHref(item.key, sort, q))}`
                        : exploreHref(item.key, sort, q);
                    return (
                      <Link
                        key={item.key}
                        href={href}
                        className={
                          active
                            ? "shrink-0 touch-manipulation rounded-full bg-white/12 px-3.5 py-2 text-[13px] font-medium text-white ring-1 ring-white/20 lg:rounded-xl lg:px-3"
                            : "shrink-0 touch-manipulation rounded-full border border-white/12 px-3.5 py-2 text-[13px] text-white/55 transition active:bg-white/8 hover:border-white/25 hover:text-white/80 lg:rounded-xl lg:px-3"
                        }
                      >
                        {item.label}
                        {typeof item.count === "number" ? (
                          <span
                            className={
                              active
                                ? "ml-1.5 tabular-nums text-white/50"
                                : "ml-1.5 tabular-nums text-white/35"
                            }
                          >
                            {item.count}
                          </span>
                        ) : null}
                      </Link>
                    );
                  })}
                  <span
                    title="分类建设中"
                    className="hidden shrink-0 cursor-default rounded-full border border-dashed border-white/15 px-3.5 py-2 text-[13px] text-white/40 lg:inline-flex lg:rounded-xl lg:px-3"
                  >
                    近期发行
                    <span className="ml-1.5 text-[10px] text-white/28">即将</span>
                  </span>
                  <span
                    title="分类建设中"
                    className="hidden shrink-0 cursor-default rounded-full border border-dashed border-white/15 px-3.5 py-2 text-[13px] text-white/40 lg:inline-flex lg:rounded-xl lg:px-3"
                  >
                    UDG
                    <span className="ml-1.5 text-[10px] text-white/28">即将</span>
                  </span>
                </nav>

                {/* 排序：桌面侧栏；手机在列表上方 chips */}
                <div className="hidden lg:block">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                    Sort
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">排序</p>
                  <nav
                    className="mt-2.5 flex flex-col gap-2"
                    aria-label="排序方式"
                  >
                    {SORT_OPTIONS.map((opt) => {
                      const active = sort === opt.key;
                      return (
                        <Link
                          key={opt.key}
                          href={exploreHref(filter, opt.key, q)}
                          className={
                            active
                              ? "rounded-xl bg-[#ff6b9e]/18 px-3 py-2 text-[13px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                              : "rounded-xl border border-white/12 px-3 py-2 text-[13px] text-white/55 transition hover:border-white/25 hover:text-white/80"
                          }
                        >
                          {opt.label}
                        </Link>
                      );
                    })}
                  </nav>
                </div>

                <div className="hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5 lg:block">
                  <p className="text-[12px] font-medium text-white/70">
                    在架一览
                  </p>
                  <ul className="mt-2.5 space-y-1.5 text-[12px] text-white/50">
                    <li className="flex justify-between gap-2">
                      <span>全部</span>
                      <span className="tabular-nums text-white/70">
                        {items.length}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>我的红心</span>
                      <span className="tabular-nums text-white/70">
                        {session?.user ? heartCount : "—"}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>站主爱听</span>
                      <span className="tabular-nums text-white/70">
                        {lovedCount}
                      </span>
                    </li>
                    <li className="flex justify-between gap-2">
                      <span>友情</span>
                      <span className="tabular-nums text-white/70">
                        {friendCount}
                      </span>
                    </li>
                  </ul>
                  <p className="mt-3 text-[11px] leading-relaxed text-white/35">
                    当前：{filterLabel}
                    {sort !== "rec" ? ` · ${sortLabel}` : ""}
                    {q ? ` · 「${q}」` : ""}
                  </p>
                </div>
              </div>
            </aside>

            <section className="min-w-0 lg:col-span-9 xl:col-span-10">
              {/* 有结果时不写「共 N 张」；仅异常/空态提示 + 移动端排序 */}
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-2.5">
                {loadError ||
                (filter === "heart" && !session?.user) ||
                visible.length === 0 ? (
                  <p className="text-[13px] text-white/55 sm:text-sm">
                    {loadError
                      ? "加载异常"
                      : filter === "heart" && !session?.user
                        ? "登录后可查看我的红心"
                        : q
                          ? `「${q}」无匹配`
                          : filter === "all"
                            ? "暂无专辑"
                            : `${filterLabel} · 暂无`}
                  </p>
                ) : (
                  <span className="hidden lg:block" aria-hidden />
                )}
                {/* 移动端快捷排序 */}
                <div className="scrollbar-none ml-auto flex max-w-full gap-1.5 overflow-x-auto lg:hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <Link
                      key={opt.key}
                      href={exploreHref(filter, opt.key, q)}
                      className={
                        sort === opt.key
                          ? "shrink-0 touch-manipulation rounded-full bg-[#ff6b9e]/18 px-2.5 py-1.5 text-[11px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                          : "shrink-0 touch-manipulation rounded-full border border-white/12 px-2.5 py-1.5 text-[11px] text-white/50"
                      }
                    >
                      {opt.label}
                    </Link>
                  ))}
                </div>
              </div>

              {loadError ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-8 text-center">
                  <p className="text-sm text-rose-100/90">{loadError}</p>
                </div>
              ) : filter === "heart" && !session?.user ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-16 text-center">
                  <p className="text-sm text-white/55">登录后可查看收藏的专辑</p>
                  <Link
                    href={`/login?callbackUrl=${encodeURIComponent(exploreHref("heart", sort, q))}`}
                    className="mt-4 inline-block text-sm text-[#ff8fb3] hover:underline"
                  >
                    去登录 →
                  </Link>
                </div>
              ) : visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-16 text-center">
                  <p className="text-sm text-white/55">
                    {q
                      ? `没有匹配「${q}」的专辑`
                      : filter === "heart"
                        ? "还没有收藏。点专辑卡片上的红心即可加入。"
                        : filter === "all"
                          ? "暂无专辑"
                          : `暂无「${filterLabel}」专辑`}
                  </p>
                  {q ? (
                    <Link
                      href={exploreHref(filter, sort)}
                      className="mt-4 inline-block text-sm text-[#ff8fb3] hover:underline"
                    >
                      清除搜索 →
                    </Link>
                  ) : filter !== "all" ? (
                    <Link
                      href={exploreHref("all", sort)}
                      className="mt-4 inline-block text-sm text-[#ff8fb3] hover:underline"
                    >
                      查看全部 →
                    </Link>
                  ) : (
                    <Link
                      href={
                        session?.user
                          ? "/explore/submit"
                          : "/login?callbackUrl=/explore/submit"
                      }
                      className="mt-4 inline-block text-sm text-[#ff8fb3] hover:underline"
                    >
                      去推荐 →
                    </Link>
                  )}
                </div>
              ) : (
                <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visible.map((r) => (
                    <li key={r.id}>
                      <ReleaseCard
                        release={r}
                        loggedIn={Boolean(session?.user)}
                        initialFavorited={mine.has(r.id)}
                        initialMineScore={myScores.get(r.id) ?? null}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          {/* 列表下方再垫一截，网页端滚到底更明显 */}
          <div className="h-10 md:h-20" aria-hidden />
        </div>
      </main>
    </div>
  );
}
