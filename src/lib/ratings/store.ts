import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import { getRelease, updateRelease } from "@/lib/releases/store";

export async function getUserRating(
  releaseId: string,
  userId: string,
): Promise<number | null> {
  const row = await prisma.rating.findUnique({
    where: {
      userId_releaseId: { userId, releaseId },
    },
  });
  return row?.score ?? null;
}

async function recomputeAggregates(releaseId: string): Promise<{
  avg: number | null;
  count: number;
}> {
  const agg = await prisma.rating.aggregate({
    where: { releaseId },
    _avg: { score: true },
    _count: { _all: true },
  });
  const count = agg._count._all;
  const avg =
    count > 0 && agg._avg.score != null
      ? Math.round(agg._avg.score * 10) / 10
      : null;
  await prisma.release.update({
    where: { id: releaseId },
    data: {
      ratingAvg: avg,
      ratingCount: count,
    },
  });
  return { avg, count };
}

/**
 * Upsert user score 1–10 for a published release.
 */
export async function setRating(opts: {
  releaseId: string;
  userId: string;
  score: number;
}): Promise<{ score: number; rating_avg: number | null; rating_count: number }> {
  const score = Math.round(opts.score);
  if (score < 1 || score > 10) {
    throw new Error("评分须为 1–10 的整数");
  }

  const release = await getRelease(opts.releaseId);
  if (!release || release.status !== "published") {
    throw new Error("专辑不存在或未发布");
  }

  await prisma.rating.upsert({
    where: {
      userId_releaseId: {
        userId: opts.userId,
        releaseId: opts.releaseId,
      },
    },
    create: {
      id: createId("rtg_"),
      releaseId: opts.releaseId,
      userId: opts.userId,
      score,
    },
    update: { score },
  });

  const { avg, count } = await recomputeAggregates(opts.releaseId);
  return {
    score,
    rating_avg: avg,
    rating_count: count,
  };
}

/** Remove own rating (optional). */
export async function clearRating(opts: {
  releaseId: string;
  userId: string;
}): Promise<{ rating_avg: number | null; rating_count: number }> {
  await prisma.rating.deleteMany({
    where: { releaseId: opts.releaseId, userId: opts.userId },
  });
  const { avg, count } = await recomputeAggregates(opts.releaseId);
  return { rating_avg: avg, rating_count: count };
}
