import { auth } from "./index";
import {
  canManageOwnerContent,
  canModerate,
  canParticipate,
  type UserRole,
} from "./roles";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function getSessionUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();
  if (!user?.id) throw new AuthError("请先登录", 401);
  return user;
}

export async function requireParticipant() {
  const user = await requireUser();
  if (!canParticipate(user.role as UserRole)) {
    throw new AuthError("无权限", 403);
  }
  return user;
}

export async function requireModerator() {
  const user = await requireUser();
  if (!canModerate(user.role as UserRole)) {
    throw new AuthError("需要管理员或站主权限", 403);
  }
  return user;
}

export async function requireOwner() {
  const user = await requireUser();
  if (!canManageOwnerContent(user.role as UserRole)) {
    throw new AuthError("需要站主权限", 403);
  }
  return user;
}
