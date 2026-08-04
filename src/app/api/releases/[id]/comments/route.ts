import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createComment, listComments } from "@/lib/comments/store";
import { z } from "zod";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  try {
    const items = await listComments(id);
    return NextResponse.json({ items });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "加载失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

const Body = z.object({
  body: z.string().min(2).max(2000),
  score: z.number().int().min(1).max(10).optional().nullable(),
});

export async function POST(req: Request, ctx: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const { id } = await ctx.params;
  try {
    const body = Body.parse(await req.json());
    // IP 展示后续再做；预留字段
    const comment = await createComment({
      releaseId: id,
      userId: session.user.id,
      body: body.body,
      score: body.score,
      ipMasked: null,
    });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "发表失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
