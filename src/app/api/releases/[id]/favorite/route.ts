import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  isFavorited,
  toggleFavorite,
} from "@/lib/favorites/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Toggle personal favorite (any logged-in user). Owner toggle also drives 站主爱听 badge. */
export async function POST(_req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "请先登录（若刚同步过数据库，请退出后重新登录）" },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  try {
    const result = await toggleFavorite(
      session.user.id,
      id,
      session.user.role ?? "user",
    );
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "操作失败";
    const status = msg.includes("重新登录") ? 401 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  const { id } = await ctx.params;
  if (!session?.user?.id) {
    return NextResponse.json({ favorited: false });
  }
  const favorited = await isFavorited(session.user.id, id);
  return NextResponse.json({ favorited });
}
