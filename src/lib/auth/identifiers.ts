/** Normalize & validate login identifiers (email / CN phone). */

export type AuthChannel = "email" | "phone";

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Keep digits; accept +86 / 86 prefix → 11-digit CN mobile. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("86") && digits.length === 13) {
    digits = digits.slice(2);
  }
  return digits;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Mainland mobile: 1[3-9]xxxxxxxxx */
const CN_MOBILE_RE = /^1[3-9]\d{9}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email) && email.length <= 254;
}

export function isValidPhone(phone: string): boolean {
  return CN_MOBILE_RE.test(phone);
}

export function parseIdentifier(
  channel: AuthChannel,
  raw: string,
): { channel: AuthChannel; target: string } {
  if (channel === "email") {
    const target = normalizeEmail(raw);
    if (!isValidEmail(target)) throw new Error("邮箱格式不正确");
    return { channel, target };
  }
  const target = normalizePhone(raw);
  if (!isValidPhone(target)) {
    throw new Error("请填写有效的中国大陆手机号");
  }
  return { channel, target };
}

/** Mask for UI / logs: a***@x.com / 138****5678 */
export function maskTarget(channel: AuthChannel, target: string): string {
  if (channel === "email") {
    const [local, domain] = target.split("@");
    if (!domain) return "***";
    const head = local.slice(0, 1) || "*";
    return `${head}***@${domain}`;
  }
  if (target.length >= 7) {
    return `${target.slice(0, 3)}****${target.slice(-4)}`;
  }
  return "***";
}
