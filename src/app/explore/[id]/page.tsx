import Link from "next/link";
import { notFound } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { CommentSection } from "@/components/comment-section";
import { DetailHeart } from "@/components/detail-heart";
import { RatingPanel } from "@/components/rating-panel";
import {
  RecommendFooter,
  RecommendationsFold,
} from "@/components/recommendations-fold";
import { RecommendAgainForm } from "@/components/recommend-again-form";
import { TrackRecommendList } from "@/components/track-recommend-list";
import { auth } from "@/lib/auth";
import { listComments } from "@/lib/comments/store";
import { isFavorited } from "@/lib/favorites/store";
import { getUserRating } from "@/lib/ratings/store";
import { listPublishedRecommendations } from "@/lib/recommendations/store";
import { getRelease } from "@/lib/releases/store";
import { listTracksWithStats } from "@/lib/tracks/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function isNeteaseLink(label: string, url: string): boolean {
  const l = label.toLowerCase();
  if (l.includes("网易") || l.includes("netease") || l.includes("163")) {
    return true;
  }
  return /music\.163\.com|163\.com/.test(url);
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const release = await getRelease(id);
  if (!release || release.status !== "published") notFound();
  const session = await auth();
  const favorited = session?.user?.id
    ? await isFavorited(session.user.id, id)
    : false;
  const recommendations = await listPublishedRecommendations(id);
  const alreadyRecd = session?.user?.id
    ? recommendations.some((r) => r.user_id === session.user!.id)
    : false;
  const tracks = await listTracksWithStats(id, session?.user?.id);
  const myRating = session?.user?.id
    ? await getUserRating(id, session.user.id)
    : null;
  const comments = await listComments(id);

  const netease =
    release.netease_url ||
    (release.netease_id
      ? `https://music.163.com/#/album?id=${release.netease_id}`
      : null);

  const extraLinks = release.links.filter(
    (l) => !isNeteaseLink(l.label, l.url),
  );

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/explore"
          className="text-sm text-white/62 hover:text-white/80"
        >
          ← 返回优质发行
        </Link>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <div className="glass-rim mx-auto w-full max-w-[240px] shrink-0 overflow-hidden rounded-2xl sm:mx-0">
            <div className="aspect-square bg-white/[0.04]">
              {release.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={release.cover_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-white/45">
                  无封面
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {release.owner_loved ? (
                  <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                    ♥ 站主爱听
                  </span>
                ) : null}
                <p className="font-mono text-[10px] uppercase tracking-wider text-white/58">
                  {release.type}
                </p>
              </div>
              <DetailHeart
                releaseId={release.id}
                initialFavorited={favorited}
                initialOwnerLoved={release.owner_loved}
                loggedIn={Boolean(session?.user)}
              />
            </div>
            <h1 className="mt-2 font-display text-2xl font-semibold leading-tight">
              {release.title}
            </h1>
            <p className="mt-2 text-white/78">{release.artists.join(" / ")}</p>
            {release.tags.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {release.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/24 px-2 py-0.5 text-[11px] text-white/72"
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

            <RatingPanel
              releaseId={id}
              initialAvg={release.rating_avg ?? 0}
              initialCount={release.rating_count ?? 0}
              initialMine={myRating}
              loggedIn={Boolean(session?.user)}
            />

            <div className="mt-6 flex flex-wrap gap-2">
              {netease ? (
                <a
                  href={netease}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn px-4 py-2 text-sm font-medium"
                  title="来源：网易云音乐"
                >
                  网易云
                </a>
              ) : null}
              {extraLinks.map((l) => (
                <a
                  key={l.url}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-btn px-4 py-2 text-sm font-medium"
                >
                  {l.label}
                </a>
              ))}
              {netease ? (
                <Link
                  href={`/chat?ref_url=${encodeURIComponent(netease)}`}
                  className="glass-btn px-4 py-2 text-sm font-medium"
                >
                  当参考找伴奏
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        {/* 首推 + 折叠 + 卡片内「我也要推荐」 */}
        <section className="mt-10 border-t border-white/18 pt-8">
          <h2 className="font-display text-lg font-semibold">
            推荐
            {recommendations.length > 0 ? (
              <span className="ml-2 text-sm font-normal text-white/50">
                {recommendations.length}
              </span>
            ) : null}
          </h2>
          <RecommendationsFold
            items={recommendations}
            footer={
              <RecommendFooter
                releaseId={id}
                alreadyRecd={alreadyRecd}
                loggedIn={Boolean(session?.user)}
                loginHref={`/login?callbackUrl=/explore/${id}`}
                form={
                  <RecommendAgainForm releaseId={id} neteaseUrl={netease} />
                }
              />
            }
          />
        </section>

        {/* 曲目：最多约 10 行可视，其余滚动 */}
        <section className="mt-10 border-t border-white/18 pt-8">
          <h2 className="font-display text-lg font-semibold">
            曲目
            {tracks.length > 0 ? (
              <span className="ml-2 text-sm font-normal text-white/55">
                {tracks.length}
              </span>
            ) : null}
          </h2>
          <TrackRecommendList
            releaseId={id}
            initialTracks={tracks}
            loggedIn={Boolean(session?.user)}
          />
        </section>

        {/* 评论：可打分 + 留言 + 时间（IP 预留） */}
        <CommentSection
          releaseId={id}
          initialComments={comments}
          initialMineScore={myRating}
          loggedIn={Boolean(session?.user)}
        />

      </main>
    </div>
  );
}
