import Link from "next/link";
import { notFound } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { getRelease } from "@/lib/releases/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const release = await getRelease(id);
  if (!release || release.status !== "published") notFound();

  const netease =
    release.netease_url ||
    (release.netease_id
      ? `https://music.163.com/#/album?id=${release.netease_id}`
      : null);

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/explore"
          className="text-sm text-white/45 hover:text-white/80"
        >
          ← 返回精选
        </Link>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <div className="mx-auto w-full max-w-[240px] shrink-0 overflow-hidden rounded-2xl border border-white/15 sm:mx-0">
            <div className="aspect-square bg-white/[0.04]">
              {release.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/25">
                  无封面
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
              {release.source === "owner" ? "站主爱听" : "社区推荐"} ·{" "}
              {release.type}
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">
              {release.title}
            </h1>
            <p className="mt-2 text-white/60">{release.artists.join(" / ")}</p>
            {release.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {release.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/12 px-2 py-0.5 text-[11px] text-white/55"
                  >
                    {t}
                  </span>
                ))}
              </div>
            ) : null}

            {release.curatorial_note ? (
              <p className="mt-5 text-sm leading-relaxed text-white/75">
                {release.curatorial_note}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-2">
              {netease ? (
                <a
                  href={netease}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 hover:border-white/40"
                >
                  在网易云打开
                </a>
              ) : null}
              {release.links.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 hover:border-white/30"
                >
                  {l.label}
                </a>
              ))}
              {netease ? (
                <Link
                  href={`/chat?ref_url=${encodeURIComponent(netease)}`}
                  className="touri-grad rounded-full px-4 py-2 text-sm font-medium text-white"
                >
                  当参考找伴奏
                </Link>
              ) : null}
            </div>

            <p className="mt-8 text-xs text-white/35">
              评分 / 用户再推将陆续开放。外链版权归原平台与权利人。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
