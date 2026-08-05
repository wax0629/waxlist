import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { canModerate } from "@/lib/auth/roles";
import { countPendingReleases } from "@/lib/recommendations/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 侧栏角标：仅遗留 pending 数（轻量 1 次 count）。
 * 新专已默认上架，不再为「近 7 日新上架」多打一枪 Neon。
 */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user?.id || !canModerate(user.role)) {
      return NextResponse.json({ pending: 0, badge: 0 });
    }
    const pending = await countPendingReleases();
    return NextResponse.json({ pending, badge: pending });
  } catch (err) {
    console.error("[admin/pending-count]", err);
    return NextResponse.json({ pending: 0, badge: 0 });
  }
}
