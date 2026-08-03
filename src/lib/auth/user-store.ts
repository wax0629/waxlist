import bcrypt from "bcryptjs";
import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import type { UserRole } from "./roles";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<StoredUser, "password_hash">;

function toStored(u: {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}): StoredUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password_hash: u.passwordHash,
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
    where: { email: email.trim().toLowerCase() },
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

async function resolveSignupRole(email: string): Promise<UserRole> {
  if ((await countUsers()) === 0) return "owner";
  if (ownerEmails().has(email.trim().toLowerCase())) return "owner";
  return "user";
}

export async function createUser(opts: {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}): Promise<PublicUser> {
  const email = opts.email.trim().toLowerCase();
  if (!email || !opts.password) {
    throw new Error("邮箱与密码必填");
  }
  if (await findUserByEmail(email)) {
    throw new Error("该邮箱已注册");
  }
  if (opts.password.length < 8) {
    throw new Error("密码至少 8 位");
  }

  const role = opts.role ?? (await resolveSignupRole(email));
  const row = await prisma.user.create({
    data: {
      id: createId("usr_"),
      email,
      name: opts.name.trim() || email.split("@")[0] || "user",
      passwordHash: await bcrypt.hash(opts.password, 10),
      role,
    },
  });
  return toPublic(toStored(row));
}

export async function verifyPassword(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return toPublic(user);
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
