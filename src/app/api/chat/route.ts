import { NextResponse } from "next/server";
import { appendTurn, runTurn } from "@/lib/agent/run-turn";
import { getOrCreateSession, saveSession } from "@/lib/session-store";

export const runtime = "nodejs";

interface ChatBody {
  session_id?: string | null;
  message?: string;
  ref_url?: string;
}

export async function POST(req: Request) {
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "无效 JSON" }, { status: 400 });
  }

  const message = (body.message ?? "").trim();
  const refUrl = body.ref_url?.trim() || undefined;

  if (!message && !refUrl) {
    return NextResponse.json(
      { error: "请提供 message 或 ref_url" },
      { status: 400 },
    );
  }

  const userText = message || `参考：${refUrl}`;
  const session = getOrCreateSession(body.session_id);

  try {
    const result = await runTurn(session, userText, refUrl);
    appendTurn(session, userText, result);
    saveSession(session);

    return NextResponse.json({
      session_id: session.id,
      assistant_message: result.assistant_message,
      candidates: result.candidates,
      status: result.status,
      warnings: result.warnings,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "服务错误";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
