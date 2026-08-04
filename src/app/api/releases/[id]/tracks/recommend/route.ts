import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toggleTrackRecommend } from "@/lib/tracks/store";
import { z } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
  track: z.string().min(1).max(200),
});

/** Toggle recommend (like) a track on a release. */
export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const { track } = Body.parse(await req.json());
    const result = await toggleTrackRecommend({
      releaseId: id,
      userId: session.user.id,
      trackName: track,
    });
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
