import nodemailer from "nodemailer";
import type { AuthChannel } from "./identifiers";

/**
 * Deliver OTP via email or SMS.
 *
 * Email (required for channel=email — no silent fallback):
 *   1) RESEND_API_KEY → Resend API
 *   2) SMTP_HOST + SMTP_USER + SMTP_PASS → SMTP (163 / QQ / Gmail 等)
 *
 * SMS: SMS_WEBHOOK_URL, else throw (phone channel).
 */

export function isEmailDeliveryConfigured(): boolean {
  if (process.env.RESEND_API_KEY?.trim()) return true;
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  return Boolean(host && user && pass);
}

export function isSmsDeliveryConfigured(): boolean {
  return Boolean(process.env.SMS_WEBHOOK_URL?.trim());
}

export async function deliverOtp(opts: {
  channel: AuthChannel;
  target: string;
  code: string;
}): Promise<void> {
  const { channel, target, code } = opts;

  if (channel === "email") {
    await sendEmail(target, code);
    return;
  }
  await sendSms(target, code);
}

function otpEmailContent(code: string): { subject: string; text: string; html: string } {
  const subject = `Waxlist 登录验证码：${code}`;
  const text = [
    "你的 Waxlist 登录验证码是：",
    "",
    code,
    "",
    "10 分钟内有效。如非本人操作，请忽略本邮件。",
    "",
    "— Waxlist",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'PingFang SC','Helvetica Neue',sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:420px;background:#141414;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px 28px;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Waxlist</p>
          <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#fff;">登录验证码</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.65);">
            使用下面的验证码登录或注册。10 分钟内有效，请勿转发他人。
          </p>
          <p style="margin:0 0 28px;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
            ${code}
          </p>
          <p style="margin:0;font-size:12px;line-height:1.5;color:rgba(255,255,255,0.35);">
            如非本人操作，请忽略本邮件。这是系统自动发送，请勿直接回复。
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { subject, text, html };
}

async function sendEmail(to: string, code: string): Promise<void> {
  if (!isEmailDeliveryConfigured()) {
    throw new Error(
      "邮件服务未配置：请在 .env.local 设置 RESEND_API_KEY，或 SMTP_HOST / SMTP_USER / SMTP_PASS",
    );
  }

  const { subject, text, html } = otpEmailContent(code);
  const from =
    process.env.EMAIL_FROM?.trim() ||
    (process.env.RESEND_API_KEY?.trim()
      ? "Waxlist <onboarding@resend.dev>"
      : process.env.SMTP_USER?.trim() || "noreply@waxlist.local");

  if (process.env.RESEND_API_KEY?.trim()) {
    await sendViaResend({ to, from, subject, text, html });
    return;
  }

  await sendViaSmtp({ to, from, subject, text, html });
}

async function sendViaResend(opts: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const key = process.env.RESEND_API_KEY!.trim();
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: opts.from,
      to: [opts.to],
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[auth-otp:email] Resend failed", res.status, errText);

    let apiMessage = "";
    try {
      const parsed = JSON.parse(errText) as {
        message?: string;
        name?: string;
      };
      apiMessage = parsed.message || parsed.name || "";
    } catch {
      apiMessage = errText.slice(0, 200);
    }

    // Free / unverified domain: only send to the Resend account email
    const restricted =
      res.status === 403 ||
      /only send testing emails|verify a domain|not authorized|domain/i.test(
        errText,
      );

    if (restricted) {
      throw new Error(
        "Resend 测试模式：未验证域名时，收件人必须是你注册 Resend 的邮箱。" +
          "请在登录页改用该邮箱，或到 resend.com → Domains 验证域名后再发任意地址。" +
          (apiMessage ? `（${apiMessage}）` : ""),
      );
    }
    throw new Error(
      apiMessage
        ? `邮件发送失败：${apiMessage}`
        : "邮件发送失败，请稍后重试",
    );
  }

  console.info(`[auth-otp:email] sent via Resend to=${opts.to}`);
}

async function sendViaSmtp(opts: {
  to: string;
  from: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER!.trim();
  const pass = process.env.SMTP_PASS!.trim();
  const secure =
    process.env.SMTP_SECURE === "false"
      ? false
      : process.env.SMTP_SECURE === "true"
        ? true
        : port === 465;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  try {
    await transporter.sendMail({
      from: opts.from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    console.info(`[auth-otp:email] sent via SMTP host=${host} to=${opts.to}`);
  } catch (err) {
    console.error("[auth-otp:email] SMTP failed", err);
    throw new Error("邮件发送失败，请检查 SMTP 配置");
  }
}

async function sendSms(phone: string, code: string): Promise<void> {
  const webhook = process.env.SMS_WEBHOOK_URL?.trim();
  if (!webhook) {
    throw new Error(
      "短信服务未配置：请设置 SMS_WEBHOOK_URL，或使用邮箱登录",
    );
  }

  const message = `【Waxlist】验证码 ${code}，10分钟内有效。如非本人操作请忽略。`;
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      code,
      message,
      channel: "sms",
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[auth-otp:sms] webhook failed", res.status, errText);
    throw new Error("短信发送失败，请稍后重试");
  }
}
