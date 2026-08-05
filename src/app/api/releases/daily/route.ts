import { NextResponse } from "next/server";
import { getDailyPick } from "@/lib/releases/daily-pick";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 专辑盲盒：加权随机；exclude=id1,id2 尽量不重复本轮已开 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const excludeRaw = url.searchParams.get("exclude") ?? "";
  const excludeIds = excludeRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 80);

  try {
    const pick = await getDailyPick({ excludeIds });
    if (!pick) {
      return NextResponse.json(
        { error: "暂时没有可展示的专辑" },
        { status: 404 },
      );
    }
    return NextResponse.json(pick);
  } catch (err) {
    console.error("[daily pick]", err);
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}
