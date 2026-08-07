import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canUseCommunityInteractions } from "@/lib/auth/roles";
import { getUserRating, setRating } from "@/lib/ratings/store";
import { z } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
  score: z.number().int().min(1).max(10),
});

/** Get current user's rating for this release. */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  const { id } = await ctx.params;
  if (!session?.user?.id) {
    return NextResponse.json({ score: null });
  }
  const score = await getUserRating(id, session.user.id);
  return NextResponse.json({ score });
}

/** Set / update score 1–10. */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (
    !canUseCommunityInteractions(
      session.user.role,
      session.user.interactionBeta,
    )
  ) {
    return NextResponse.json(
      { error: "评分功能暂未向当前账号开放" },
      { status: 403 },
    );
  }
  const { id } = await ctx.params;
  try {
    const { score } = Body.parse(await req.json());
    const result = await setRating({
      releaseId: id,
      userId: session.user.id,
      score,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "评分失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
