import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
import { CommentSection } from "@/components/comment-section";
import { DetailHeart } from "@/components/detail-heart";
import { FriendBadgeToggle } from "@/components/friend-badge-toggle";
import { RatingPanel } from "@/components/rating-panel";
import {
  RecommendFooter,
  RecommendationsFold,
} from "@/components/recommendations-fold";
import { RecommendAgainForm } from "@/components/recommend-again-form";
import { TrackRecommendList } from "@/components/track-recommend-list";
import { auth } from "@/lib/auth";
import {
  canUseCommunityInteractions,
  isOwner,
} from "@/lib/auth/roles";
import { listComments } from "@/lib/comments/store";
import { isFavorited } from "@/lib/favorites/store";
import { getUserRating } from "@/lib/ratings/store";
import { listPublishedRecommendations } from "@/lib/recommendations/store";
import {
  displayTags,
  hasFriendTag,
} from "@/lib/releases/friend-tag";
import { formatReleasedAt } from "@/lib/releases/format";
import { getRelease } from "@/lib/releases/store";
import { publicSiteUrl, SITE_NAME } from "@/lib/site";
import { listTracksWithStats } from "@/lib/tracks/store";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const release = await getRelease(id).catch(() => null);
  if (!release || release.status !== "published") {
    return { title: "专辑未找到" };
  }
  const artists = release.artists.join(" / ");
  const title = `${release.title} · ${artists}`;
  const description =
    release.curatorial_note ||
    release.description ||
    `${artists} 的专辑，在 ${SITE_NAME} 被认真推荐。`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${publicSiteUrl()}/explore/${id}`,
      type: "music.album",
      images: release.cover_url ? [{ url: release.cover_url }] : ["/og.jpg"],
    },
  };
}

function isNeteaseLink(label: string, url: string): boolean {
  const l = label.toLowerCase();
  if (l.includes("网易") || l.includes("netease") || l.includes("163")) {
    return true;
  }
  return /music\.163\.com|163\.com/.test(url);
}

export default async function ReleaseDetailPage({ params }: Props) {
  const { id } = await params;
  const [release, session] = await Promise.all([
    getRelease(id),
    auth().catch(() => null),
  ]);
  if (!release || release.status !== "published") notFound();

  const uid = session?.user?.id;
  const interactionsEnabled = Boolean(
    session?.user &&
      canUseCommunityInteractions(
        session.user.role,
        session.user.interactionBeta,
      ),
  );
  const [favorited, recommendations, tracks, myRating, comments] =
    await Promise.all([
      uid ? isFavorited(uid, id) : Promise.resolve(false),
      listPublishedRecommendations(id),
      listTracksWithStats(id, uid),
      uid && interactionsEnabled
        ? getUserRating(id, uid)
        : Promise.resolve(null),
      listComments(id),
    ]);
  const alreadyRecd = uid
    ? recommendations.some((r) => r.user_id === uid)
    : false;

  const netease =
    release.netease_url ||
    (release.netease_id
      ? `https://music.163.com/#/album?id=${release.netease_id}`
      : null);

  const extraLinks = release.links.filter(
    (l) => !isNeteaseLink(l.label, l.url),
  );

  const tags = displayTags(release.tags);
  const owner = Boolean(session?.user && isOwner(session.user.role));

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      {/* 加宽内容区，少居中挤压；侧栏外尽量铺开 */}
      <main className="w-full min-w-0 flex-1 px-3 pt-5 pb-4 sm:px-6 sm:pt-8 md:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1500px]">
          <BackLink href="/explore" label="返回优质发行" />

          {/*
            桌面：左信息（封面+推荐紧凑叠放）| 右曲目
            不用 row-span，避免左栏被曲目高度撑开大片空白
            手机：信息 → 曲目 → 评分 → 推荐 → 评论；发布控件按互动内测权限开放
          */}
          <div className="mt-4 grid grid-cols-1 items-start gap-x-10 gap-y-3 sm:mt-6 lg:grid-cols-12 lg:gap-x-14 lg:gap-y-3 xl:gap-x-16">
            {/* 封面 + 标题 */}
            <header className="order-1 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5 lg:col-span-5">
              <div className="glass-rim relative mx-auto w-full max-w-[min(100%,320px)] shrink-0 overflow-hidden rounded-2xl sm:mx-0 sm:w-[240px] sm:max-w-none md:w-[260px] lg:w-[280px]">
                <div className="relative aspect-square bg-white/[0.04]">
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
                  {/* 封面右上角「友情」：站主可点开关，他人仅看点亮态 */}
                  <div className="absolute right-2 top-2 z-10">
                    {owner ? (
                      <FriendBadgeToggle
                        releaseId={release.id}
                        tags={release.tags}
                      />
                    ) : hasFriendTag(release.tags) ? (
                      <span
                        className="rounded-full border border-pink-200/50 bg-gradient-to-r from-[#ff6b9e] via-[#ff8fb3] to-[#f0abfc] px-2 py-0.5 text-[10px] font-semibold text-white shadow-[0_4px_12px_-2px_rgba(255,107,158,0.5)]"
                        title="友情"
                      >
                        友情
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {release.owner_loved ? (
                      <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
                        ♥ 站主爱听
                      </span>
                    ) : null}
                    <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">
                      {release.type}
                    </span>
                  </div>
                  <DetailHeart
                    releaseId={release.id}
                    initialFavorited={favorited}
                    initialOwnerLoved={release.owner_loved}
                    loggedIn={Boolean(session?.user)}
                  />
                </div>

                <h1 className="mt-2 font-display text-2xl font-semibold leading-snug tracking-tight">
                  {release.title}
                </h1>
                <p className="mt-1 text-[15px] text-white/75">
                  {release.artists.join(" / ")}
                </p>
                {formatReleasedAt(release.released_at) ? (
                  <p className="mt-1.5 text-[13px] text-white/50">
                    发行于 {formatReleasedAt(release.released_at)}
                  </p>
                ) : null}

                {tags.length ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-white/20 px-2 py-0.5 text-[11px] text-white/65"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {release.curatorial_note ? (
                  <p className="mt-2.5 text-sm leading-relaxed text-white/70">
                    {release.curatorial_note}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {netease ? (
                    <a
                      href={netease}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-btn px-3.5 py-1.5 text-[13px] font-medium"
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
                      className="glass-btn px-3.5 py-1.5 text-[13px] font-medium"
                    >
                      {l.label}
                    </a>
                  ))}
                  {netease ? (
                    <Link
                      href={`/chat?ref_url=${encodeURIComponent(netease)}`}
                      className="glass-btn px-3.5 py-1.5 text-[13px] font-medium"
                    >
                      当参考找伴奏
                    </Link>
                  ) : null}
                </div>
              </div>
            </header>

            {/* 曲目：桌面右栏；手机第二块 */}
            <aside className="order-2 min-w-0 lg:col-span-7 lg:row-span-3 lg:row-start-1 lg:col-start-6 lg:self-start lg:sticky lg:top-5">
              <section className="liquid-glass flex flex-col rounded-2xl lg:h-[min(72dvh,680px)]">
                <div className="flex shrink-0 items-baseline justify-between gap-2 border-b border-white/12 px-4 py-3 sm:px-5">
                  <h2 className="font-display text-[15px] font-semibold">
                    曲目
                    {tracks.length > 0 ? (
                      <span className="ml-2 text-[13px] font-normal text-white/45">
                        {tracks.length}
                      </span>
                    ) : null}
                  </h2>
                  <p className="text-[11px] text-white/35">点赞推荐单曲</p>
                </div>
                <div className="flex min-h-0 flex-1 flex-col px-3 py-2 sm:px-4 sm:py-3">
                  <TrackRecommendList
                    releaseId={id}
                    initialTracks={tracks}
                    loggedIn={Boolean(session?.user)}
                    embedded
                  />
                </div>
              </section>
            </aside>

            <section className="order-3 min-w-0 lg:col-span-5 lg:col-start-1">
              <h2 className="mb-1.5 font-display text-[15px] font-semibold text-white/90">
                评分
              </h2>
              <RatingPanel
                releaseId={id}
                initialAvg={release.rating_avg ?? 0}
                initialCount={release.rating_count ?? 0}
                initialMine={myRating}
                loggedIn={Boolean(session?.user)}
                canRate={interactionsEnabled}
              />
            </section>

            {/* 推荐理由 */}
            <section className="order-4 min-w-0 lg:col-span-5 lg:col-start-1">
              <h2 className="mb-1.5 font-display text-[15px] font-semibold text-white/90">
                推荐理由
                {recommendations.length > 0 ? (
                  <span className="ml-2 text-[13px] font-normal text-white/45">
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
                      <RecommendAgainForm
                        releaseId={id}
                        neteaseUrl={netease}
                      />
                    }
                  />
                }
              />
            </section>
          </div>

          <div className="mt-8 border-t border-white/10 pt-2 pb-2">
            <CommentSection
              releaseId={id}
              initialComments={comments}
              initialMineScore={myRating}
              loggedIn={Boolean(session?.user)}
              canComment={interactionsEnabled}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
