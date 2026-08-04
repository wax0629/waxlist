import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listTracksWithStats,
  refreshTracklist,
} from "@/lib/tracks/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** Get tracks + recommend stats (auto-ensures tracklist). */
export async function GET(_req: Request, ctx: Ctx) {
  const session = await auth();
  const { id } = await ctx.params;
  try {
    const tracks = await listTracksWithStats(id, session?.user?.id);
    return NextResponse.json({ tracks });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "加载失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** Force refresh tracklist from NetEase. */
export async function POST(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const names = await refreshTracklist(id);
    const session = await auth();
    const tracks = await listTracksWithStats(id, session?.user?.id);
    return NextResponse.json({
      ok: true,
      count: names.length,
      tracks,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "解析失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
