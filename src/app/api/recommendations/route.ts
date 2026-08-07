import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/auth/roles";
import { CATALOG_REGION_KEYS } from "@/lib/releases/catalog";
import {
  listModerationFeed,
  submitRecommendation,
} from "@/lib/recommendations/store";
import { z } from "zod";

export const runtime = "nodejs";

const SubmitBody = z.object({
  reason: z.string().max(2000).optional().default(""),
  tracks: z.string().max(2000).optional(),
  release_id: z.string().optional(),
  netease_url: z.string().optional(),
  title: z.string().optional(),
  artists: z.array(z.string()).optional(),
  cover_url: z.string().optional(),
  type: z.enum(["single", "ep", "album", "other"]).optional(),
  tags: z.array(z.string()).optional(),
  regions: z.array(z.enum(CATALOG_REGION_KEYS)).max(4).optional(),
  /** Owner-only: pink「友情」badge */
  friend: z.boolean().optional(),
  /** UDG style / section classification; available to all submitters. */
  udg: z.boolean().optional(),
});

/** Submit a recommendation (login required). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  try {
    const body = SubmitBody.parse(await req.json());
    const result = await submitRecommendation({
      userId: session.user.id,
      role: session.user.role,
      reason: body.reason,
      tracks: body.tracks,
      releaseId: body.release_id,
      netease_url: body.netease_url,
      title: body.title,
      artists: body.artists,
      cover_url: body.cover_url,
      type: body.type,
      tags: body.tags,
      regions: body.regions,
      friend: body.friend,
      udg: body.udg,
    });
    return NextResponse.json(
      {
        ...result,
        message: result.is_new_release
          ? "推荐已发布，专辑已上架"
          : "推荐已发布",
      },
      { status: 201 },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "提交失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** 管理侧：遗留待审 + 近期上架（事后下架） */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "需要管理权限" }, { status: 403 });
  }
  const url = new URL(req.url);
  const queue = url.searchParams.get("queue");
  if (queue !== "pending" && queue !== "moderation") {
    return NextResponse.json(
      { error: "请使用 ?queue=moderation 或 ?queue=pending" },
      { status: 400 },
    );
  }
  const items = await listModerationFeed();
  return NextResponse.json({ items });
}
