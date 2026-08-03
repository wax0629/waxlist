import Link from "next/link";
import { redirect } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { ReleaseCard } from "@/components/release-card";
import { auth } from "@/lib/auth";
import { listFavoriteReleases } from "@/lib/favorites/store";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/favorites");
  }

  const items = await listFavoriteReleases(session.user.id);
  const ids = new Set(items.map((i) => i.id));

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/explore"
          className="text-sm text-white/45 hover:text-white/80"
        >
          ← 返回精选
        </Link>
        <h1 className="mt-4 font-display text-2xl font-semibold">我的红心</h1>
        <p className="mt-2 text-sm text-white/50">
          你点过 ♥ 的专辑。站主点过的仍会带「站主爱听」标签。
        </p>

        {items.length === 0 ? (
          <p className="mt-12 text-center text-sm text-white/40">
            还没有收藏。去{" "}
            <Link href="/explore" className="text-white/70 underline">
              精选
            </Link>{" "}
            点红心吧。
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {items.map((r) => (
              <li key={r.id}>
                <ReleaseCard
                  release={r}
                  loggedIn
                  initialFavorited={ids.has(r.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
