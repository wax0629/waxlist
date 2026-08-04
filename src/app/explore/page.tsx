import Link from "next/link";
import { AppRail } from "@/components/app-rail";
import { ReleaseCard } from "@/components/release-card";
import { auth } from "@/lib/auth";
import { favoritedReleaseIds } from "@/lib/favorites/store";
import { listReleases } from "@/lib/releases/store";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const session = await auth();
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
        <div className="flex flex-wrap items-end justify-between gap-4 pr-12 sm:pr-14">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/58">
              Explore
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              地下精选
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href={
                session?.user
                  ? "/explore/submit"
                  : "/login?callbackUrl=/explore/submit"
              }
              className="touri-grad rounded-full px-3 py-1.5 font-medium text-white"
            >
              推荐专辑
            </Link>
          </div>
        </div>

        {/* 玻璃分割线：标题区与专辑网格 */}
        <div
          className="mt-6 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.12) 8%, rgba(230,242,255,0.45) 50%, rgba(200,225,255,0.12) 92%, transparent 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.06)",
          }}
          aria-hidden
        />

        {items.length === 0 ? (
          <div className="mt-10 text-center">
            <p className="text-sm text-white/58">暂无专辑</p>
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
          </div>
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
