import bcrypt from "bcryptjs";
import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import type { AuthChannel } from "./identifiers";
import { maskTarget } from "./identifiers";
import { deliverOtp } from "./delivery";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 min
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const CODE_LEN = 6;

function generateCode(): string {
  const n = Math.floor(Math.random() * 1_000_000);
  return String(n).padStart(CODE_LEN, "0");
}

/** Only when AUTH_OTP_DEV=1 — never expose codes just because NODE_ENV=development. */
function otpDevLeak(): boolean {
  return (
    process.env.AUTH_OTP_DEV === "1" || process.env.AUTH_OTP_DEV === "true"
  );
}

/**
 * Create & send a login code. Rate-limited per target.
 * Email/SMS must actually deliver (see delivery.ts).
 * Plain code is only returned when AUTH_OTP_DEV=1 (debug).
 */
export async function requestOtp(opts: {
  channel: AuthChannel;
  target: string;
}): Promise<{
  ok: true;
  masked: string;
  channel: AuthChannel;
  delivered: true;
  dev_code?: string;
  cooldown_sec: number;
}> {
  const { channel, target } = opts;
  const recent = await prisma.authOtp.findFirst({
    where: {
      channel,
      target,
      consumedAt: null,
      createdAt: { gte: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const wait = Math.ceil(
      (recent.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000,
    );
    throw new Error(`请 ${Math.max(wait, 1)} 秒后再获取验证码`);
  }

  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 8);
  const otpId = createId("otp_");
  await prisma.authOtp.create({
    data: {
      id: otpId,
      channel,
      target,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  try {
    await deliverOtp({ channel, target, code });
  } catch (err) {
    // Failed send: invalidate this code so user can retry cleanly
    await prisma.authOtp
      .update({
        where: { id: otpId },
        data: { consumedAt: new Date() },
      })
      .catch(() => {});
    throw err;
  }

  const payload: {
    ok: true;
    masked: string;
    channel: AuthChannel;
    delivered: true;
    dev_code?: string;
    cooldown_sec: number;
  } = {
    ok: true,
    masked: maskTarget(channel, target),
    channel,
    delivered: true,
    cooldown_sec: Math.floor(RESEND_COOLDOWN_MS / 1000),
  };
  if (otpDevLeak()) {
    payload.dev_code = code;
    console.info(
      `[auth-otp] AUTH_OTP_DEV leak ${channel} ${maskTarget(channel, target)} → ${code}`,
    );
  }
  return payload;
}

/**
 * Verify code and mark consumed. Throws on failure.
 */
export async function consumeOtp(opts: {
  channel: AuthChannel;
  target: string;
  code: string;
}): Promise<void> {
  const code = opts.code.trim();
  if (!/^\d{6}$/.test(code)) {
    throw new Error("验证码为 6 位数字");
  }

  const row = await prisma.authOtp.findFirst({
    where: {
      channel: opts.channel,
      target: opts.target,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!row) {
    throw new Error("验证码无效或已过期，请重新获取");
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    throw new Error("尝试次数过多，请重新获取验证码");
  }

  const ok = await bcrypt.compare(code, row.codeHash);
  if (!ok) {
    await prisma.authOtp.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("验证码错误");
  }

  await prisma.authOtp.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
}
