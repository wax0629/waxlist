import { NextResponse } from "next/server";
import { getSession } from "@/lib/session-store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const session = getSession(id);

  if (!session) {
    return NextResponse.json({ error: "会话不存在" }, { status: 404 });
  }

  return NextResponse.json({
    id: session.id,
    messages: session.messages,
    last_shortlist: session.last_shortlist,
    constraints: session.constraints,
    last_intent: session.last_intent,
    last_queries_used: session.last_queries_used,
    last_intent_summary: session.last_intent_summary,
    created_at: session.created_at,
    updated_at: session.updated_at,
  });
}
