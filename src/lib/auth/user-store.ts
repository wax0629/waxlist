import bcrypt from "bcryptjs";
import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import type { UserRole } from "./roles";
import { isValidEmail, normalizeEmail } from "./identifiers";

export interface StoredUser {
  id: string;
  email?: string;
  phone?: string;
  name: string;
  password_hash?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<StoredUser, "password_hash">;

function toStored(u: {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  passwordHash: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): StoredUser {
  return {
    id: u.id,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    name: u.name,
    password_hash: u.passwordHash ?? undefined,
    role: u.role as UserRole,
    created_at: u.createdAt.toISOString(),
    updated_at: u.updatedAt.toISOString(),
  };
}

function toPublic(u: StoredUser): PublicUser {
  const { password_hash: _, ...rest } = u;
  return rest;
}

export async function listUsers(): Promise<PublicUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map((u) => toPublic(toStored(u)));
}

export async function findUserByEmail(
  email: string,
): Promise<StoredUser | undefined> {
  const row = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  return row ? toStored(row) : undefined;
}

export async function findUserByPhone(
  phone: string,
): Promise<StoredUser | undefined> {
  const row = await prisma.user.findUnique({
    where: { phone: phone.trim() },
  });
  return row ? toStored(row) : undefined;
}

export async function findUserById(
  id: string,
): Promise<StoredUser | undefined> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toStored(row) : undefined;
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

function ownerEmails(): Set<string> {
  const raw = process.env.OWNER_EMAILS ?? process.env.OWNER_EMAIL ?? "";
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function ownerPhones(): Set<string> {
  const raw = process.env.OWNER_PHONES ?? process.env.OWNER_PHONE ?? "";
  return new Set(
    raw
      .split(/[,;\s]+/)
      .map((s) => s.replace(/\D/g, ""))
      .map((s) => (s.startsWith("86") && s.length === 13 ? s.slice(2) : s))
      .filter(Boolean),
  );
}

async function resolveSignupRole(opts: {
  email?: string;
  phone?: string;
}): Promise<UserRole> {
  if ((await countUsers()) === 0) return "owner";
  if (opts.email && ownerEmails().has(opts.email.trim().toLowerCase())) {
    return "owner";
  }
  if (opts.phone && ownerPhones().has(opts.phone.trim())) {
    return "owner";
  }
  return "user";
}

function defaultName(opts: {
  name?: string;
  email?: string;
  phone?: string;
}): string {
  const n = opts.name?.trim();
  if (n) return n.slice(0, 40);
  if (opts.email) return opts.email.split("@")[0] || "user";
  if (opts.phone) return `用户${opts.phone.slice(-4)}`;
  return "user";
}

function assertPassword(password: string) {
  if (!password || password.length < 8) {
    throw new Error("密码至少 8 位");
  }
  if (password.length > 72) {
    throw new Error("密码过长");
  }
}

/**
 * If email is in OWNER_EMAILS, ensure role is owner (on login / register).
 */
export async function syncOwnerRoleFromEnv(
  user: StoredUser,
): Promise<StoredUser> {
  const shouldBeOwner =
    (user.email && ownerEmails().has(user.email.toLowerCase())) ||
    (user.phone && ownerPhones().has(user.phone));
  if (!shouldBeOwner || user.role === "owner") {
    return user;
  }
  const row = await prisma.user.update({
    where: { id: user.id },
    data: { role: "owner" },
  });
  return toStored(row);
}

/**
 * Register with email + password.
 * If the email already exists but has no password (legacy OTP account),
 * set password once so they can log in normally.
 */
export async function registerWithPassword(opts: {
  email: string;
  password: string;
  name?: string;
}): Promise<PublicUser> {
  const email = normalizeEmail(opts.email);
  if (!isValidEmail(email)) {
    throw new Error("邮箱格式不正确");
  }
  assertPassword(opts.password);

  const existing = await findUserByEmail(email);
  const hash = await bcrypt.hash(opts.password, 10);

  if (existing) {
    if (existing.password_hash) {
      throw new Error("该邮箱已注册，请直接登录");
    }
    // Legacy OTP-only account: attach password
    const row = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: hash,
        name: opts.name?.trim()
          ? opts.name.trim().slice(0, 40)
          : existing.name,
      },
    });
    const synced = await syncOwnerRoleFromEnv(toStored(row));
    return toPublic(synced);
  }

  const role = await resolveSignupRole({ email });
  const row = await prisma.user.create({
    data: {
      id: createId("usr_"),
      email,
      phone: null,
      name: defaultName({ name: opts.name, email }),
      passwordHash: hash,
      role,
    },
  });
  return toPublic(toStored(row));
}

/**
 * Login with email + password. Syncs OWNER_EMAILS on success.
 */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!user.password_hash) {
    // Distinguish in authorize via special handling — return null for wrong creds
    // Callers that need a message can check hasPassword
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  const synced = await syncOwnerRoleFromEnv(user);
  return toPublic(synced);
}

export async function accountNeedsPasswordSetup(
  email: string,
): Promise<boolean> {
  const user = await findUserByEmail(email);
  return Boolean(user && !user.password_hash);
}

export async function setUserRole(
  userId: string,
  role: UserRole,
  actorRole: UserRole,
): Promise<PublicUser> {
  if (actorRole !== "owner") {
    throw new Error("仅站主可改角色");
  }
  const user = await findUserById(userId);
  if (!user) throw new Error("用户不存在");
  if (user.role === "owner" && role !== "owner") {
    throw new Error("不能降级站主（请先指定新站主）");
  }
  const row = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
  return toPublic(toStored(row));
}
