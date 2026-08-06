import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireModerator } from "@/lib/auth/guards";
import { prisma } from "@/lib/db";
import { CATALOG_REGION_KEYS } from "@/lib/releases/catalog";

export const runtime = "nodejs";

const bodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  regions: z.array(z.enum(CATALOG_REGION_KEYS)).max(4),
});

export async function PATCH(req: Request) {
  try {
    await requireModerator();
    const body = bodySchema.parse(await req.json());
    const ids = [...new Set(body.ids)];
    const result = await prisma.release.updateMany({
      where: { id: { in: ids } },
      data: { regions: body.regions },
    });
    return NextResponse.json({ count: result.count, ids, regions: body.regions });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }
    console.error("[admin/releases/regions]", err);
    return NextResponse.json({ error: "地区更新失败" }, { status: 500 });
  }
}
