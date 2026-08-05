import { createId } from "@/lib/id";
import type { UserRole } from "@/lib/auth/roles";
import { isOwner } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { resolveNeteaseMeta } from "@/lib/netease/fetch-meta";
import { parseNeteaseUrl } from "@/lib/netease/parse";
import { mergeFriendFlag } from "@/lib/releases/friend-tag";
import {
  createRelease,
  findByNeteaseId,
  getRelease,
  updateRelease,
} from "@/lib/releases/store";
import type {
  PendingReleaseRow,
  RecommendationPublic,
} from "./types";

function mapRec(r: {
  id: string;
  releaseId: string;
  userId: string;
  reason: string;
  tracks: string | null;
  isFirst: boolean;
  status: string;
  createdAt: Date;
  user: { name: string };
}): RecommendationPublic {
  return {
    id: r.id,
    release_id: r.releaseId,
    user_id: r.userId,
    user_name: r.user.name,
    reason: r.reason,
    tracks: r.tracks ?? undefined,
    is_first: r.isFirst,
    status: r.status as RecommendationPublic["status"],
    created_at: r.createdAt.toISOString(),
  };
}

export async function listPublishedRecommendations(
  releaseId: string,
): Promise<RecommendationPublic[]> {
  const rows = await prisma.recommendation.findMany({
    where: { releaseId, status: "published" },
    orderBy: [{ isFirst: "desc" }, { createdAt: "asc" }],
    include: { user: { select: { name: true } } },
  });
  return rows.map(mapRec);
}

export async function listPendingReleases(): Promise<PendingReleaseRow[]> {
  const releases = await prisma.release.findMany({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
    include: {
      recommendations: {
        where: { status: "pending" },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
      _count: { select: { recommendations: true } },
    },
  });

  return releases.map((r) => {
    const recs = r.recommendations.map((rec) => ({
      user_name: rec.user.name,
      reason: rec.reason,
      tracks: rec.tracks ?? undefined,
      created_at: rec.createdAt.toISOString(),
    }));
    const first = recs[0];
    return {
      release_id: r.id,
      title: r.title,
      artists: r.artists,
      cover_url: r.coverUrl ?? undefined,
      netease_url: r.neteaseUrl ?? undefined,
      type: r.type,
      status: r.status,
      created_at: r.createdAt.toISOString(),
      first_reason: first?.reason,
      first_user_name: first?.user_name,
      first_tracks: first?.tracks,
      rec_count: r._count.recommendations,
      recommendations: recs,
    };
  });
}

export async function countPendingReleases(): Promise<number> {
  return prisma.release.count({ where: { status: "pending" } });
}

/** 近 N 天新上架（供管理浏览 / 事后下架） */
export async function countRecentPublished(days = 7): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return prisma.release.count({
    where: { status: "published", createdAt: { gte: since } },
  });
}

/**
 * 管理侧：待审（遗留）+ 近期已上架社区专辑，便于事后下架。
 */
export async function listModerationFeed(opts?: {
  recentDays?: number;
  limit?: number;
}): Promise<PendingReleaseRow[]> {
  const recentDays = opts?.recentDays ?? 14;
  const limit = opts?.limit ?? 40;
  const since = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

  const pending = await listPendingReleases();

  const published = await prisma.release.findMany({
    where: {
      status: "published",
      createdAt: { gte: since },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      recommendations: {
        where: { status: "published" },
        orderBy: [{ isFirst: "desc" }, { createdAt: "asc" }],
        take: 5,
        include: { user: { select: { name: true } } },
      },
      _count: { select: { recommendations: true } },
    },
  });

  const publishedRows: PendingReleaseRow[] = published.map((r) => {
    const recs = r.recommendations.map((rec) => ({
      user_name: rec.user.name,
      reason: rec.reason,
      tracks: rec.tracks ?? undefined,
      created_at: rec.createdAt.toISOString(),
    }));
    const first = recs[0];
    return {
      release_id: r.id,
      title: r.title,
      artists: r.artists,
      cover_url: r.coverUrl ?? undefined,
      netease_url: r.neteaseUrl ?? undefined,
      type: r.type,
      status: r.status,
      created_at: r.createdAt.toISOString(),
      first_reason: first?.reason,
      first_user_name: first?.user_name,
      first_tracks: first?.tracks,
      rec_count: r._count.recommendations,
      recommendations: recs,
    };
  });

  // 待审在前，再按时间并集去重
  const seen = new Set(pending.map((p) => p.release_id));
  const rest = publishedRows.filter((p) => !seen.has(p.release_id));
  return [...pending, ...rest];
}

/**
 * Submit a recommendation (same form for everyone).
 * - 默认立即上架；管理事后可下架
 * - 曾被拒绝的专辑仍不可再推
 * - Existing published → rec published immediately
 * - Existing pending → rec stays pending with the release
 * - Owner: skip review — new/pending releases go live, rec always published
 */
export async function submitRecommendation(opts: {
  userId: string;
  /** Session role; owner skips moderation */
  role?: UserRole | null;
  reason: string;
  tracks?: string;
  /** Recommend existing release */
  releaseId?: string;
  /** Or create/link by NetEase + metadata */
  netease_url?: string;
  title?: string;
  artists?: string[];
  cover_url?: string;
  type?: "single" | "ep" | "album" | "other";
  tags?: string[];
  /** Owner-only: attach pink「友情」badge (e.g. mixing clients). */
  friend?: boolean;
}): Promise<{
  release_id: string;
  recommendation_id: string;
  is_new_release: boolean;
  status: "pending" | "published";
}> {
  const reason = opts.reason.trim();
  if (reason.length < 4) {
    throw new Error("推荐理由至少 4 个字");
  }

  // 正常荐专默认上架；友情标签仍仅站主
  const wantFriend = Boolean(opts.friend) && isOwner(opts.role);
  let releaseId = opts.releaseId;
  let isNew = false;
  const recStatus: "published" = "published";
  let releaseNeedsPublish = false;

  if (releaseId) {
    const existing = await getRelease(releaseId);
    if (!existing) throw new Error("专辑不存在");
    if (existing.status === "rejected") {
      throw new Error("该专辑已被拒绝，无法继续推荐");
    }
    if (existing.status !== "published") {
      releaseNeedsPublish = true;
    }
    if (wantFriend) {
      await updateRelease(existing.id, {
        tags: mergeFriendFlag(existing.tags, true),
      });
    }
  } else {
    // New submission via NetEase + fields (auto-fill from NetEase if missing)
    const url = opts.netease_url?.trim();
    if (!url) throw new Error("请填写网易云链接");
    const parsed = parseNeteaseUrl(url);

    let title = opts.title?.trim();
    let artists = (opts.artists ?? []).map((a) => a.trim()).filter(Boolean);
    let cover = opts.cover_url?.trim() || undefined;
    let type = opts.type;
    let neteaseUrl = parsed.url || url;
    let neteaseId = parsed.id;
    let tracklist: string[] = [];
    let releasedAt: string | undefined;

    try {
      const meta = await resolveNeteaseMeta(url);
      title = title || meta.title;
      if (!artists.length) artists = meta.artists;
      cover = cover || meta.cover_url;
      type = type || meta.type;
      neteaseUrl = meta.netease_url || neteaseUrl;
      neteaseId = meta.netease_id || neteaseId;
      tracklist = meta.tracks ?? [];
      releasedAt = meta.publish_time;
    } catch {
      // keep manual fields; validate below
    }

    if (!title) throw new Error("请填写标题，或粘贴可解析的网易云链接");
    if (!artists.length) throw new Error("请填写艺人，或粘贴可解析的网易云链接");

    if (neteaseId) {
      const dup = await findByNeteaseId(neteaseId);
      if (dup) {
        if (dup.status === "rejected") {
          throw new Error("该专辑曾被拒绝");
        }
        releaseId = dup.id;
        const patch: {
          tracklist?: string[];
          tags?: string[];
          released_at?: string;
        } = {};
        if (tracklist.length && !(dup.tracklist && dup.tracklist.length)) {
          patch.tracklist = tracklist;
        }
        if (wantFriend) {
          patch.tags = mergeFriendFlag(dup.tags, true);
        }
        if (releasedAt && !dup.released_at) {
          patch.released_at = releasedAt;
        }
        if (Object.keys(patch).length) {
          await updateRelease(dup.id, patch);
        }
        if (dup.status !== "published") {
          releaseNeedsPublish = true;
        }
      }
    }

    if (!releaseId) {
      const releaseType =
        type ??
        (parsed.kind === "song" ? "single" : "album");
      const tags = wantFriend
        ? mergeFriendFlag(opts.tags, true)
        : opts.tags ?? [];
      const created = await createRelease({
        title,
        artists,
        type: releaseType,
        netease_id: neteaseId,
        netease_url: neteaseUrl,
        cover_url: cover,
        tags,
        source: "community",
        status: "published",
        created_by: opts.userId,
        links: [{ label: "网易云", url: neteaseUrl }],
        tracklist,
        released_at: releasedAt,
      });
      releaseId = created.id;
      isNew = true;
    }
  }

  const priorCount = await prisma.recommendation.count({
    where: { releaseId: releaseId! },
  });
  const isFirst = priorCount === 0;

  // Prevent duplicate rec from same user on same release
  const mine = await prisma.recommendation.findFirst({
    where: { releaseId: releaseId!, userId: opts.userId },
  });
  if (mine) {
    throw new Error("你已经推荐过这张专辑了");
  }

  if (releaseNeedsPublish) {
    await updateRelease(releaseId!, { status: "published" });
    await prisma.recommendation.updateMany({
      where: { releaseId: releaseId!, status: "pending" },
      data: { status: "published" },
    });
  }

  const rec = await prisma.recommendation.create({
    data: {
      id: createId("rec_"),
      releaseId: releaseId!,
      userId: opts.userId,
      reason,
      tracks: opts.tracks?.trim() || null,
      isFirst,
      status: recStatus,
    },
  });

  // Selected tracks → also count as track-level recommends when published
  if (recStatus === "published" && opts.tracks?.trim()) {
    const names = opts.tracks
      .split(/[\n,，]/)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const trackName of names) {
      await prisma.trackRecommendation.upsert({
        where: {
          userId_releaseId_trackName: {
            userId: opts.userId,
            releaseId: releaseId!,
            trackName,
          },
        },
        create: {
          id: createId("trk_"),
          releaseId: releaseId!,
          userId: opts.userId,
          trackName,
        },
        update: {},
      });
    }
  }

  return {
    release_id: releaseId!,
    recommendation_id: rec.id,
    is_new_release: isNew,
    status: recStatus,
  };
}

/**
 * 管理操作：
 * - approve：遗留 pending → 上架
 * - reject / takedown：下架（published 或 pending → rejected），禁止再推
 */
export async function moderateRelease(
  releaseId: string,
  action: "approve" | "reject" | "takedown",
): Promise<void> {
  const release = await getRelease(releaseId);
  if (!release) throw new Error("专辑不存在");

  if (action === "approve") {
    if (release.status !== "pending") {
      throw new Error("仅遗留的待审条目需要通过");
    }
    await updateRelease(releaseId, { status: "published" });
    await prisma.recommendation.updateMany({
      where: { releaseId, status: "pending" },
      data: { status: "published" },
    });
    const recs = await prisma.recommendation.findMany({
      where: { releaseId, status: "published" },
      select: { userId: true, tracks: true },
    });
    for (const r of recs) {
      if (!r.tracks?.trim()) continue;
      for (const trackName of r.tracks
        .split(/[\n,，]/)
        .map((s) => s.trim())
        .filter(Boolean)) {
        await prisma.trackRecommendation.upsert({
          where: {
            userId_releaseId_trackName: {
              userId: r.userId,
              releaseId,
              trackName,
            },
          },
          create: {
            id: createId("trk_"),
            releaseId,
            userId: r.userId,
            trackName,
          },
          update: {},
        });
      }
    }
    return;
  }

  // reject / takedown
  if (release.status === "rejected") {
    throw new Error("已下架");
  }
  await updateRelease(releaseId, { status: "rejected" });
  await prisma.recommendation.updateMany({
    where: { releaseId, status: { in: ["pending", "published"] } },
    data: { status: "rejected" },
  });
}
