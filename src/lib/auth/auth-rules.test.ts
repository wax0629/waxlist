import { describe, expect, it } from "vitest";
import {
  maskTarget,
  normalizeEmail,
  normalizePhone,
  parseIdentifier,
} from "./identifiers";
import {
  canManageOwnerContent,
  canModerate,
  canParticipate,
  canUseCommunityInteractions,
  isOwner,
  isStaff,
  type UserRole,
} from "./roles";

describe("login identifiers", () => {
  it("normalizes email and mainland phone input", () => {
    expect(normalizeEmail("  USER@Example.COM ")).toBe("user@example.com");
    expect(normalizePhone("+86 138-0013-8000")).toBe("13800138000");
  });

  it("parses and validates identifiers", () => {
    expect(parseIdentifier("email", " User@Example.com ")).toEqual({
      channel: "email",
      target: "user@example.com",
    });
    expect(parseIdentifier("phone", "+86 13800138000")).toEqual({
      channel: "phone",
      target: "13800138000",
    });
    expect(() => parseIdentifier("email", "not-an-email")).toThrow(
      "邮箱格式不正确",
    );
    expect(() => parseIdentifier("phone", "1234")).toThrow(
      "请填写有效的中国大陆手机号",
    );
  });

  it("masks identifiers before displaying them in logs", () => {
    expect(maskTarget("email", "user@example.com")).toBe("u***@example.com");
    expect(maskTarget("phone", "13800138000")).toBe("138****8000");
  });
});

describe("role permissions", () => {
  const cases: Array<{
    role: UserRole;
    staff: boolean;
    owner: boolean;
    ownerContent: boolean;
    moderate: boolean;
    participate: boolean;
  }> = [
    {
      role: "owner",
      staff: true,
      owner: true,
      ownerContent: true,
      moderate: true,
      participate: true,
    },
    {
      role: "admin",
      staff: true,
      owner: false,
      ownerContent: false,
      moderate: true,
      participate: true,
    },
    {
      role: "user",
      staff: false,
      owner: false,
      ownerContent: false,
      moderate: false,
      participate: true,
    },
  ];

  it.each(cases)("applies the $role permission boundary", (entry) => {
    expect(isStaff(entry.role)).toBe(entry.staff);
    expect(isOwner(entry.role)).toBe(entry.owner);
    expect(canManageOwnerContent(entry.role)).toBe(entry.ownerContent);
    expect(canModerate(entry.role)).toBe(entry.moderate);
    expect(canParticipate(entry.role)).toBe(entry.participate);
  });

  it("denies missing roles", () => {
    expect(isStaff(undefined)).toBe(false);
    expect(isOwner(null)).toBe(false);
    expect(canManageOwnerContent(undefined)).toBe(false);
    expect(canModerate(null)).toBe(false);
    expect(canParticipate(undefined)).toBe(false);
  });

  it("limits rating and comments to owners or explicitly selected beta users", () => {
    expect(canUseCommunityInteractions("owner", false)).toBe(true);
    expect(canUseCommunityInteractions("owner", true)).toBe(true);
    expect(canUseCommunityInteractions("admin", true)).toBe(true);
    expect(canUseCommunityInteractions("user", true)).toBe(true);
    expect(canUseCommunityInteractions("admin", false)).toBe(false);
    expect(canUseCommunityInteractions("user", false)).toBe(false);
    expect(canUseCommunityInteractions(undefined, true)).toBe(false);
  });
});
