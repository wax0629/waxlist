/**
 * Three-tier roles for community features.
 * - owner: 站主 — full control, love-list, promote admins
 * - admin: 管理 — review queue, moderate, dig tool
 * - user: 普通用户 — recommend, heart
 */
export type UserRole = "owner" | "admin" | "user";

export const USER_ROLES: UserRole[] = ["owner", "admin", "user"];

export function isStaff(role: UserRole | undefined | null): boolean {
  return role === "owner" || role === "admin";
}

export function isOwner(role: UserRole | undefined | null): boolean {
  return role === "owner";
}

/** Can write owner love-list / change system owner-only settings */
export function canManageOwnerContent(
  role: UserRole | undefined | null,
): boolean {
  return role === "owner";
}

/** Can review community submissions, dig tool, moderate */
export function canModerate(role: UserRole | undefined | null): boolean {
  return role === "owner" || role === "admin";
}

/** Can submit recommendations and rate */
export function canParticipate(role: UserRole | undefined | null): boolean {
  return role === "owner" || role === "admin" || role === "user";
}

/** 评分 / 评论仍在小范围内测：站主始终可用，其他账号由后台逐个开启。 */
export function canUseCommunityInteractions(
  role: UserRole | undefined | null,
  interactionBeta: boolean | undefined | null,
): boolean {
  return role === "owner" || (canParticipate(role) && interactionBeta === true);
}
