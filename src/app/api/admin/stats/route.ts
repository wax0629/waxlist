import { NextResponse } from "next/server";
import { AuthError, requireModerator } from "@/lib/auth/guards";
import { countUsers } from "@/lib/auth/user-store";
import { prisma } from "@/lib/db";
import { countPendingReleases } from "@/lib/recommendations/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 后台概览数据（站主 / 管理） */
export async function GET() {
  try {
    await requireModerator();
    const [pending, published, users, rejected] = await Promise.all([
      countPendingReleases(),
      prisma.release.count({ where: { status: "published" } }),
      countUsers(),
      prisma.release.count({ where: { status: "rejected" } }),
    ]);
    return NextResponse.json({
      pending,
      published,
      rejected,
      users,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/stats]", err);
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}
