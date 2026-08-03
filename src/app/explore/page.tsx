import Link from "next/link";
import { AppRail } from "@/components/app-rail";
import { ReleaseCard } from "@/components/release-card";
import { auth } from "@/lib/auth";
import { favoritedReleaseIds } from "@/lib/favorites/store";
import { listReleases } from "@/lib/releases/store";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const session = await auth();
  const isOwner = session?.user?.role === "owner";
  const items = await listReleases({ status: "published" });
  const mine = session?.user?.id
    ? await favoritedReleaseIds(
        session.user.id,
        items.map((i) => i.id),
      )
    : new Set<string>();

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
              Explore
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              地下精选
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/50">
              人人可点红心，收藏进自己的列表。站主点过的专会显示「站主爱听」标签并靠前。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            {session?.user ? (
              <Link
                href="/favorites"
                className="rounded-full border border-rose-400/40 px-3 py-1.5 text-rose-200/90 hover:border-rose-300/60"
              >
                ♥ 我的红心
              </Link>
            ) : null}
            {isOwner ? (
              <Link
                href="/owner/releases"
                className="rounded-full border border-white/20 px-3 py-1.5 text-white/80 hover:border-white/40"
              >
                添加专辑
              </Link>
            ) : null}
            {session?.user ? (
              <span className="rounded-full border border-white/15 px-3 py-1.5 text-white/60">
                {session.user.name || session.user.email}
                {session.user.role === "owner"
                  ? " · 站主"
                  : session.user.role === "admin"
                    ? " · 管理"
                    : ""}
              </span>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:border-white/30 hover:text-white"
                >
                  登录
                </Link>
                <Link
                  href="/register"
                  className="rounded-full border border-white/15 px-3 py-1.5 text-white/70 hover:border-white/30 hover:text-white"
                >
                  注册
                </Link>
              </>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-white/40">
            还没有已发布专辑。
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((r) => (
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
      </main>
    </div>
  );
}
