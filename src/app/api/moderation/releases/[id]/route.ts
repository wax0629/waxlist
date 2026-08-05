import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/auth/roles";
import { moderateRelease } from "@/lib/recommendations/store";
import { z } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const Body = z.object({
  action: z.enum(["approve", "reject", "takedown"]),
});

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id || !canModerate(session.user.role)) {
    return NextResponse.json({ error: "需要管理权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const { action } = Body.parse(await req.json());
    await moderateRelease(id, action);
    return NextResponse.json({ ok: true, action });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
