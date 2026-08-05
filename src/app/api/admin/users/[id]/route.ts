import { NextResponse } from "next/server";
import { z } from "zod";
import { AuthError, requireOwner } from "@/lib/auth/guards";
import type { UserRole } from "@/lib/auth/roles";
import { setUserRole } from "@/lib/auth/user-store";

export const runtime = "nodejs";

const bodySchema = z.object({
  role: z.enum(["user", "admin", "owner"]),
});

type Ctx = { params: Promise<{ id: string }> };

/** 改角色（仅站主） */
export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const actor = await requireOwner();
    const { id } = await ctx.params;
    const json = await req.json();
    const body = bodySchema.parse(json);

    if (id === actor.id && body.role !== "owner") {
      return NextResponse.json(
        { error: "不能取消自己的站主身份" },
        { status: 400 },
      );
    }

    const user = await setUserRole(
      id,
      body.role as UserRole,
      actor.role as UserRole,
    );
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "操作失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
