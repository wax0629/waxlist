import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import { getRelease } from "@/lib/releases/store";
import { setRating } from "@/lib/ratings/store";

export interface CommentPublic {
  id: string;
  user_id: string;
  user_name: string;
  body: string;
  score?: number;
  ip_masked?: string;
  created_at: string;
}

export async function listComments(
  releaseId: string,
): Promise<CommentPublic[]> {
  const rows = await prisma.releaseComment.findMany({
    where: { releaseId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    user_id: r.userId,
    user_name: r.user.name,
    body: r.body,
    score: r.score ?? undefined,
    ip_masked: r.ipMasked ?? undefined,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function createComment(opts: {
  releaseId: string;
  userId: string;
  body: string;
  score?: number | null;
  ipMasked?: string | null;
}): Promise<CommentPublic> {
  const body = opts.body.trim();
  if (body.length < 2) throw new Error("评论至少 2 个字");
  if (body.length > 2000) throw new Error("评论过长");

  const release = await getRelease(opts.releaseId);
  if (!release || release.status !== "published") {
    throw new Error("专辑不存在或未发布");
  }

  let score: number | null = null;
  if (opts.score != null) {
    const s = Math.round(opts.score);
    if (s < 1 || s > 10) throw new Error("评分须为 1–10");
    score = s;
    await setRating({
      releaseId: opts.releaseId,
      userId: opts.userId,
      score: s,
    });
  }

  const row = await prisma.releaseComment.create({
    data: {
      id: createId("cmt_"),
      releaseId: opts.releaseId,
      userId: opts.userId,
      body,
      score,
      ipMasked: opts.ipMasked ?? null,
    },
    include: { user: { select: { name: true } } },
  });

  return {
    id: row.id,
    user_id: row.userId,
    user_name: row.user.name,
    body: row.body,
    score: row.score ?? undefined,
    ip_masked: row.ipMasked ?? undefined,
    created_at: row.createdAt.toISOString(),
  };
}
