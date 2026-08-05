import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  isEmailDeliveryConfigured,
  sendMail,
} from "@/lib/auth/delivery";
import { clientKeyFromRequest, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CATEGORIES = ["bug", "feature", "vision", "other"] as const;

const Body = z.object({
  category: z.enum(CATEGORIES),
  message: z.string().trim().min(8, "请多写一点（至少 8 字）").max(4000),
  contact: z.string().trim().max(200).optional().or(z.literal("")),
  name: z.string().trim().max(80).optional().or(z.literal("")),
});

const LABELS: Record<(typeof CATEGORIES)[number], string> = {
  bug: "Bug / 问题",
  feature: "功能建议",
  vision: "愿景 / 想法",
  other: "其他",
};

/** 支持逗号分隔多个收件人 */
function feedbackInbox(): string[] {
  const explicit = process.env.FEEDBACK_TO?.trim();
  if (explicit) {
    const list = explicit
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length) return list;
  }
  const owners = process.env.OWNER_EMAILS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (owners?.length) return owners;
  // 默认：Resend 测试模式仅允许发到注册邮箱 xux9278@gmail.com
  // 若要同时收 QQ：验证域名后设 FEEDBACK_TO=xux9278@gmail.com,3106731940@qq.com
  return ["xux9278@gmail.com"];
}

export async function POST(req: Request) {
  const ip = clientKeyFromRequest(req);
  const rl = rateLimit({
    key: `feedback:${ip}`,
    limit: 5,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "提交太频繁，请稍后再试" },
      { status: 429 },
    );
  }

  if (!isEmailDeliveryConfigured()) {
    return NextResponse.json(
      {
        error:
          "反馈通道暂未开通（邮件未配置）。请直接微信联系 Wackox，或发邮件到 xux9278@gmail.com",
      },
      { status: 503 },
    );
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    const msg =
      err instanceof z.ZodError
        ? err.issues[0]?.message || "请检查填写内容"
        : "请检查填写内容";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const session = await auth().catch(() => null);
  const userLine = session?.user
    ? [
        `登录用户: ${session.user.name || "—"}`,
        `邮箱: ${session.user.email || "—"}`,
        `角色: ${session.user.role || "user"}`,
        `id: ${session.user.id || "—"}`,
      ].join("\n")
    : "登录用户: （未登录）";

  const contact = body.contact?.trim() || "（未填）";
  const name = body.name?.trim() || "（未填）";
  const cat = LABELS[body.category];
  const to = feedbackInbox();
  if (!to.length) {
    return NextResponse.json({ error: "未配置反馈收件邮箱" }, { status: 503 });
  }

  const text = [
    `【Waxlist 用户反馈】${cat}`,
    "",
    `类别: ${cat}`,
    `称呼: ${name}`,
    `联系方式: ${contact}`,
    userLine,
    `IP: ${ip}`,
    `时间: ${new Date().toISOString()}`,
    "",
    "—— 正文 ——",
    body.message,
    "",
    "— Waxlist feedback",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><body style="font-family:system-ui,sans-serif;line-height:1.55;color:#111">
  <h2 style="margin:0 0 12px">Waxlist 用户反馈 · ${escapeHtml(cat)}</h2>
  <p style="margin:0 0 8px;color:#555;font-size:13px">
    称呼：${escapeHtml(name)} · 联系：${escapeHtml(contact)}
  </p>
  <pre style="margin:0 0 16px;padding:12px;background:#f4f4f5;border-radius:8px;font-size:12px;white-space:pre-wrap">${escapeHtml(userLine)}\nIP: ${escapeHtml(ip)}</pre>
  <div style="padding:14px 16px;border-left:3px solid #ff6b9e;background:#fafafa;white-space:pre-wrap;font-size:14px">${escapeHtml(body.message)}</div>
</body></html>`;

  // 用户填了邮箱则设 reply-to，方便直接回
  const replyTo =
    contact.includes("@") && contact.includes(".")
      ? contact
      : undefined;

  try {
    await sendMail({
      to,
      subject: `[Waxlist 反馈] ${cat} · ${body.message.slice(0, 40)}${body.message.length > 40 ? "…" : ""}`,
      text,
      html,
      replyTo,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[feedback]", err);
    const msg = err instanceof Error ? err.message : "发送失败";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
