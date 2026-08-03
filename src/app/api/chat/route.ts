import { NextResponse } from "next/server";
import { appendTurn, runAgentTurn } from "@/lib/agent/orchestrator";
import { logEvent } from "@/lib/logger";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";
import { getOrCreateSession, saveSession } from "@/lib/session-store";

export const runtime = "nodejs";

interface ChatBody {
  session_id?: string | null;
  message?: string;
  ref_url?: string;
}

export async function POST(req: Request) {
  const ip = clientKeyFromRequest(req);
  const rl = rateLimit({
    key: `chat:${ip}`,
    limit: Number(process.env.RATE_LIMIT_PER_MIN || 20),
    windowMs: 60_000,
  });
  if (!rl.ok) {
    logEvent("rate_limited", { ip }, "warn");
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

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
  const wantDebug =
    process.env.NODE_ENV !== "production" ||
    new URL(req.url).searchParams.get("debug") === "1";

  try {
    const result = await runAgentTurn(session, userText, refUrl);
    appendTurn(session, userText, result);
    saveSession(session);

    return NextResponse.json({
      session_id: session.id,
      assistant_message: result.assistant_message,
      candidates: result.candidates,
      status: result.status,
      warnings: result.warnings,
      intent: result.intent,
      intent_summary: result.intent_summary,
      queries_used: result.queries_used,
      ...(wantDebug && result.debug ? { debug: result.debug } : {}),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "服务错误";
    logEvent("chat_error", { error: msg, ip }, "error");
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
