import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/auth/roles";
import { getRelease, updateRelease } from "@/lib/releases/store";
import { z } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const release = await getRelease(id);
  if (!release) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  const session = await auth();
  const role = session?.user?.role;
  if (release.status !== "published" && !canModerate(role)) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }
  return NextResponse.json({ release });
}

const PatchBody = z.object({
  status: z.enum(["draft", "pending", "published", "rejected"]).optional(),
  title: z.string().min(1).optional(),
  curatorial_note: z.string().optional(),
  cover_url: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sort_order: z.number().optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  if (!canModerate(session.user.role)) {
    return NextResponse.json({ error: "需要管理权限" }, { status: 403 });
  }
  const { id } = await ctx.params;
  try {
    const body = PatchBody.parse(await req.json());
    const release = await updateRelease(id, {
      ...body,
      cover_url: body.cover_url,
    });
    return NextResponse.json({ release });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "更新失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
