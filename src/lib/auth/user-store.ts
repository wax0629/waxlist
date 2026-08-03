import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import { createId } from "@/lib/id";
import type { UserRole } from "./roles";

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  /** bcrypt hash */
  password_hash: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type PublicUser = Omit<StoredUser, "password_hash">;

const globalForUsers = globalThis as unknown as {
  __beatHunterUsers?: Map<string, StoredUser>;
  __beatHunterUsersLoaded?: boolean;
};

function dataDir(): string {
  return path.join(process.cwd(), ".data", "auth");
}

function usersFile(): string {
  return path.join(dataDir(), "users.json");
}

function ensureDir() {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function getMap(): Map<string, StoredUser> {
  if (!globalForUsers.__beatHunterUsers) {
    globalForUsers.__beatHunterUsers = new Map();
  }
  return globalForUsers.__beatHunterUsers;
}

function loadAll(): void {
  if (globalForUsers.__beatHunterUsersLoaded) return;
  globalForUsers.__beatHunterUsersLoaded = true;
  const map = getMap();
  try {
    const fp = usersFile();
    if (!existsSync(fp)) return;
    const list = JSON.parse(readFileSync(fp, "utf8")) as StoredUser[];
    for (const u of list) map.set(u.id, u);
  } catch (err) {
    console.error("user store load failed", err);
  }
}

function persist(): void {
  try {
    ensureDir();
    const list = [...getMap().values()];
    writeFileSync(usersFile(), JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("user store save failed", err);
  }
}

function toPublic(u: StoredUser): PublicUser {
  const { password_hash: _, ...rest } = u;
  return rest;
}

export function listUsers(): PublicUser[] {
  loadAll();
  return [...getMap().values()].map(toPublic);
}

export function findUserByEmail(email: string): StoredUser | undefined {
  loadAll();
  const key = email.trim().toLowerCase();
  return [...getMap().values()].find((u) => u.email === key);
}

export function findUserById(id: string): StoredUser | undefined {
  loadAll();
  return getMap().get(id);
}

export function countUsers(): number {
  loadAll();
  return getMap().size;
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

/** First user ever → owner; or email listed in OWNER_EMAILS → owner; else user */
function resolveSignupRole(email: string): UserRole {
  if (countUsers() === 0) return "owner";
  if (ownerEmails().has(email.trim().toLowerCase())) return "owner";
  return "user";
}

export async function createUser(opts: {
  email: string;
  name: string;
  password: string;
  role?: UserRole;
}): Promise<PublicUser> {
  loadAll();
  const email = opts.email.trim().toLowerCase();
  if (!email || !opts.password) {
    throw new Error("邮箱与密码必填");
  }
  if (findUserByEmail(email)) {
    throw new Error("该邮箱已注册");
  }
  if (opts.password.length < 8) {
    throw new Error("密码至少 8 位");
  }

  const now = new Date().toISOString();
  const user: StoredUser = {
    id: createId("usr_"),
    email,
    name: opts.name.trim() || email.split("@")[0] || "user",
    password_hash: await bcrypt.hash(opts.password, 10),
    role: opts.role ?? resolveSignupRole(email),
    created_at: now,
    updated_at: now,
  };
  getMap().set(user.id, user);
  persist();
  return toPublic(user);
}

export async function verifyPassword(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const user = findUserByEmail(email);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return toPublic(user);
}

export function setUserRole(
  userId: string,
  role: UserRole,
  actorRole: UserRole,
): PublicUser {
  loadAll();
  if (actorRole !== "owner") {
    throw new Error("仅站主可改角色");
  }
  if (role === "owner" && actorRole !== "owner") {
    throw new Error("不可提升为站主");
  }
  const user = getMap().get(userId);
  if (!user) throw new Error("用户不存在");
  if (user.role === "owner" && role !== "owner") {
    throw new Error("不能降级站主（请先指定新站主）");
  }
  user.role = role;
  user.updated_at = new Date().toISOString();
  persist();
  return toPublic(user);
}
