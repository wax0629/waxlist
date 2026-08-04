import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveNeteaseMeta } from "@/lib/netease/fetch-meta";
import { z } from "zod";

export const runtime = "nodejs";

const Body = z.object({
  url: z.string().min(3).max(2000),
});

/** Resolve NetEase album/song URL → title, artists, cover, tracks. Login required. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { url } = Body.parse(await req.json());
    const meta = await resolveNeteaseMeta(url);
    return NextResponse.json({ meta });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "解析失败";
    const status =
      msg.includes("不存在") || msg.includes("无法从链接") ? 404 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
