import Link from "next/link";
import { AppRail } from "@/components/app-rail";
import { listReleases } from "@/lib/releases/store";

export const dynamic = "force-dynamic";

export default function ExplorePage() {
  const items = listReleases({ status: "published" });
  const owner = items.filter((r) => r.source === "owner");
  const community = items.filter((r) => r.source === "community");

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
              中文地下发行策展与社区推荐（一期：网易云外链）。可逛、可后续打分；找伴奏仍在对话页。
            </p>
          </div>
          <div className="flex gap-2 text-sm">
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
          </div>
        </div>

        <Section title="站主爱听" items={owner} empty="站主还没放上爱听，稍后再来。" />
        <Section
          title="社区推荐"
          items={community}
          empty="还没有通过审核的社区推荐。"
        />
        {items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/40">
            暂无已发布发行。站主可登录后通过 API 写入，或替换{" "}
            <code className="text-white/55">data/releases.seed.json</code>。
          </p>
        ) : null}
      </main>
    </div>
  );
}

function Section({
  title,
  items,
  empty,
}: {
  title: string;
  items: ReturnType<typeof listReleases>;
  empty: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-lg font-semibold text-white/90">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">{empty}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((r) => (
            <li key={r.id}>
              <Link
                href={`/explore/${r.id}`}
                className="group block overflow-hidden rounded-2xl border border-white/14 bg-transparent transition hover:border-white/30"
              >
                <div className="aspect-square bg-white/[0.04]">
                  {r.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.cover_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-white/25">
                      无封面
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 p-2.5">
                  <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white">
                    {r.title}
                  </p>
                  <p className="truncate text-[11px] text-white/45">
                    {r.artists.join(" / ")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
