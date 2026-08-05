import { NextResponse } from "next/server";
import { AuthError, requireOwner } from "@/lib/auth/guards";
import { listUsers } from "@/lib/auth/user-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 用户列表（仅站主） */
export async function GET() {
  try {
    await requireOwner();
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "加载失败" }, { status: 500 });
  }
}
