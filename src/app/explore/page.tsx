import Link from "next/link";
import type { Session } from "next-auth";
import { AppRail } from "@/components/app-rail";
import { ReleaseCard } from "@/components/release-card";
import { auth } from "@/lib/auth";
import { favoritedReleaseIds } from "@/lib/favorites/store";
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

function exploreHref(filter: FilterKey, sort: ReleaseSort): string {
  const p = new URLSearchParams();
  if (filter !== "all") p.set("filter", filter);
  if (sort !== "rec") p.set("sort", sort);
  const q = p.toString();
  return q ? `/explore?${q}` : "/explore";
}

function hasFriendTag(r: Release): boolean {
  return Boolean(r.tags?.some((t) => t.trim() === "友情"));
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp.filter);
  const sort = parseSort(sp.sort);

  let session: Session | null = null;
  let items: Release[] = [];
  let mine = new Set<string>();
  let loadError: string | null = null;

  try {
    session = await auth();
  } catch (err) {
    console.error("[explore] auth()", err);
  }

  try {
    items = await listReleases({ status: "published", sort });
    if (session?.user?.id) {
      mine = await favoritedReleaseIds(
        session.user.id,
        items.map((i) => i.id),
      );
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

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="w-full min-w-0 flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pb-24 md:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <header className="flex flex-wrap items-end justify-between gap-4 pr-12 sm:pr-14">
            <div className="min-w-0 max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
                Explore
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                优质发行
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                听专、荐专、红心与口碑。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={
                  session?.user
                    ? "/explore/submit"
                    : "/login?callbackUrl=/explore/submit"
                }
                className="glass-btn px-4 py-2 text-sm font-medium"
              >
                推荐专辑
              </Link>
              {session?.user ? (
                <Link
                  href={exploreHref("heart", sort)}
                  className={
                    filter === "heart"
                      ? "rounded-full border border-[#ff6b9e]/45 bg-[#ff6b9e]/15 px-4 py-2 text-sm text-[#ffb3cc]"
                      : "rounded-full border border-white/18 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
                  }
                >
                  我的红心
                  {heartCount > 0 ? (
                    <span className="ml-1.5 tabular-nums text-white/45">
                      {heartCount}
                    </span>
                  ) : null}
                </Link>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(exploreHref("heart", sort))}`}
                  className="rounded-full border border-white/18 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
                >
                  我的红心
                </Link>
              )}
            </div>
          </header>

          <div
            className="mt-6 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.12) 8%, rgba(230,242,255,0.4) 50%, rgba(200,225,255,0.12) 92%, transparent 100%)",
            }}
            aria-hidden
          />

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
            <aside className="min-w-0 lg:col-span-3 xl:col-span-2">
              <div className="lg:sticky lg:top-6 space-y-5">
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                    Browse
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">浏览</p>
                </div>

                <nav
                  className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
                  aria-label="浏览筛选"
                >
                  {browse.map((item) => {
                    const active = filter === item.key;
                    const href =
                      item.needAuth && !session?.user
                        ? `/login?callbackUrl=${encodeURIComponent(exploreHref(item.key, sort))}`
                        : exploreHref(item.key, sort);
                    return (
                      <Link
                        key={item.key}
                        href={href}
                        className={
                          active
                            ? "shrink-0 rounded-full bg-white/12 px-3.5 py-2 text-[13px] font-medium text-white ring-1 ring-white/20 lg:rounded-xl lg:px-3"
                            : "shrink-0 rounded-full border border-white/12 px-3.5 py-2 text-[13px] text-white/55 transition hover:border-white/25 hover:text-white/80 lg:rounded-xl lg:px-3"
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
                    className="shrink-0 cursor-default rounded-full border border-dashed border-white/15 px-3.5 py-2 text-[13px] text-white/40 lg:rounded-xl lg:px-3"
                  >
                    近期发行
                    <span className="ml-1.5 text-[10px] text-white/28">即将</span>
                  </span>
                  <span
                    title="分类建设中"
                    className="shrink-0 cursor-default rounded-full border border-dashed border-white/15 px-3.5 py-2 text-[13px] text-white/40 lg:rounded-xl lg:px-3"
                  >
                    UDG
                    <span className="ml-1.5 text-[10px] text-white/28">即将</span>
                  </span>
                </nav>

                {/* 排序 */}
                <div>
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/40">
                    Sort
                  </p>
                  <p className="mt-1 text-sm font-medium text-white/80">排序</p>
                  <nav
                    className="mt-2.5 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
                    aria-label="排序方式"
                  >
                    {SORT_OPTIONS.map((opt) => {
                      const active = sort === opt.key;
                      return (
                        <Link
                          key={opt.key}
                          href={exploreHref(filter, opt.key)}
                          className={
                            active
                              ? "shrink-0 rounded-full bg-[#ff6b9e]/18 px-3.5 py-2 text-[13px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35 lg:rounded-xl lg:px-3"
                              : "shrink-0 rounded-full border border-white/12 px-3.5 py-2 text-[13px] text-white/55 transition hover:border-white/25 hover:text-white/80 lg:rounded-xl lg:px-3"
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
                  </p>
                </div>
              </div>
            </aside>

            <section className="min-w-0 lg:col-span-9 xl:col-span-10">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-white/55">
                  {loadError
                    ? "加载异常"
                    : filter === "heart" && !session?.user
                      ? "登录后可查看我的红心"
                      : visible.length > 0
                        ? filter === "all"
                          ? `共 ${visible.length} 张`
                          : `${filterLabel} · ${visible.length} 张`
                        : filter === "all"
                          ? "暂无专辑"
                          : `${filterLabel} · 暂无`}
                </p>
                {/* 移动端快捷排序（桌面已在侧栏） */}
                <div className="flex flex-wrap gap-1.5 lg:hidden">
                  {SORT_OPTIONS.map((opt) => (
                    <Link
                      key={opt.key}
                      href={exploreHref(filter, opt.key)}
                      className={
                        sort === opt.key
                          ? "rounded-full bg-[#ff6b9e]/18 px-2.5 py-1 text-[11px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/35"
                          : "rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-white/50"
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
                    href={`/login?callbackUrl=${encodeURIComponent(exploreHref("heart", sort))}`}
                    className="mt-4 inline-block text-sm text-[#ff8fb3] hover:underline"
                  >
                    去登录 →
                  </Link>
                </div>
              ) : visible.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 px-4 py-16 text-center">
                  <p className="text-sm text-white/55">
                    {filter === "heart"
                      ? "还没有收藏。点专辑卡片上的红心即可加入。"
                      : filter === "all"
                        ? "暂无专辑"
                        : `暂无「${filterLabel}」专辑`}
                  </p>
                  {filter !== "all" ? (
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
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {visible.map((r) => (
                    <li key={r.id}>
                      <ReleaseCard
                        release={r}
                        loggedIn={Boolean(session?.user)}
                        initialFavorited={mine.has(r.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
