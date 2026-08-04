import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import { resolveNeteaseMeta } from "@/lib/netease/fetch-meta";
import { getRelease, updateRelease } from "@/lib/releases/store";

export interface TrackRow {
  name: string;
  index: number;
  recommend_count: number;
  /** Current user has liked/recommended this track */
  recommended_by_me: boolean;
}

/**
 * Ensure release has a tracklist (fetch from NetEase if empty).
 */
export async function ensureTracklist(releaseId: string): Promise<string[]> {
  const release = await getRelease(releaseId);
  if (!release) throw new Error("专辑不存在");
  if (release.tracklist?.length) return release.tracklist;

  const url =
    release.netease_url ||
    (release.netease_id
      ? `https://music.163.com/#/album?id=${release.netease_id}`
      : null);
  if (!url) return [];

  try {
    const meta = await resolveNeteaseMeta(url);
    if (meta.tracks.length) {
      await updateRelease(releaseId, { tracklist: meta.tracks });
      return meta.tracks;
    }
    console.warn(
      `[tracklist] no tracks from NetEase for ${releaseId} url=${url}`,
    );
  } catch (err) {
    console.error(
      `[tracklist] resolve failed for ${releaseId}`,
      err instanceof Error ? err.message : err,
    );
  }
  return [];
}

/** Force re-fetch tracklist from NetEase (ignore cache). */
export async function refreshTracklist(
  releaseId: string,
): Promise<string[]> {
  const release = await getRelease(releaseId);
  if (!release) throw new Error("专辑不存在");
  const url =
    release.netease_url ||
    (release.netease_id
      ? `https://music.163.com/#/album?id=${release.netease_id}`
      : null);
  if (!url) throw new Error("该专辑没有网易云链接，无法解析曲目");

  const meta = await resolveNeteaseMeta(url);
  if (!meta.tracks.length) {
    throw new Error("网易云未返回曲目");
  }
  await updateRelease(releaseId, { tracklist: meta.tracks });
  return meta.tracks;
}

export async function listTracksWithStats(
  releaseId: string,
  userId?: string | null,
): Promise<TrackRow[]> {
  const tracks = await ensureTracklist(releaseId);
  if (!tracks.length) return [];

  const groups = await prisma.trackRecommendation.groupBy({
    by: ["trackName"],
    where: { releaseId },
    _count: { _all: true },
  });
  const countMap = new Map(
    groups.map((g) => [g.trackName, g._count._all] as const),
  );

  let mine = new Set<string>();
  if (userId) {
    const rows = await prisma.trackRecommendation.findMany({
      where: { releaseId, userId },
      select: { trackName: true },
    });
    mine = new Set(rows.map((r) => r.trackName));
  }

  return tracks.map((name, index) => ({
    name,
    index,
    recommend_count: countMap.get(name) ?? 0,
    recommended_by_me: mine.has(name),
  }));
}

/** Toggle track recommend (like). Returns new state. */
export async function toggleTrackRecommend(opts: {
  releaseId: string;
  userId: string;
  trackName: string;
}): Promise<{ recommended: boolean; count: number }> {
  const trackName = opts.trackName.trim();
  if (!trackName) throw new Error("曲名无效");

  const release = await getRelease(opts.releaseId);
  if (!release || release.status !== "published") {
    throw new Error("专辑不存在或未发布");
  }

  const existing = await prisma.trackRecommendation.findUnique({
    where: {
      userId_releaseId_trackName: {
        userId: opts.userId,
        releaseId: opts.releaseId,
        trackName,
      },
    },
  });

  if (existing) {
    await prisma.trackRecommendation.delete({ where: { id: existing.id } });
  } else {
    await prisma.trackRecommendation.create({
      data: {
        id: createId("trk_"),
        releaseId: opts.releaseId,
        userId: opts.userId,
        trackName,
      },
    });
  }

  const count = await prisma.trackRecommendation.count({
    where: { releaseId: opts.releaseId, trackName },
  });

  return {
    recommended: !existing,
    count,
  };
}
