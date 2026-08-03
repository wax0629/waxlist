import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listFavoriteReleases } from "@/lib/favorites/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const items = await listFavoriteReleases(session.user.id);
  return NextResponse.json({ items });
}
