import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  recommendation: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    updateMany: vi.fn(),
  },
  trackRecommendation: {
    upsert: vi.fn(),
  },
  resolveNeteaseMeta: vi.fn(),
  createRelease: vi.fn(),
  findByNeteaseId: vi.fn(),
  getRelease: vi.fn(),
  updateRelease: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    recommendation: mocks.recommendation,
    trackRecommendation: mocks.trackRecommendation,
  },
}));

vi.mock("@/lib/netease/fetch-meta", () => ({
  resolveNeteaseMeta: mocks.resolveNeteaseMeta,
}));

vi.mock("@/lib/releases/store", () => ({
  createRelease: mocks.createRelease,
  findByNeteaseId: mocks.findByNeteaseId,
  getRelease: mocks.getRelease,
  updateRelease: mocks.updateRelease,
}));

import { submitRecommendation } from "./store";

describe("recommendation publishing", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.recommendation.count.mockResolvedValue(0);
    mocks.recommendation.findFirst.mockResolvedValue(null);
    mocks.recommendation.create.mockResolvedValue({ id: "rec-created" });
    mocks.recommendation.updateMany.mockResolvedValue({ count: 0 });
    mocks.findByNeteaseId.mockResolvedValue(undefined);
    mocks.resolveNeteaseMeta.mockRejectedValue(new Error("offline"));
  });

  it("publishes a new ordinary-user submission immediately", async () => {
    mocks.createRelease.mockResolvedValue({ id: "release-new" });

    const result = await submitRecommendation({
      userId: "user-1",
      role: "user",
      reason: "这张专辑值得完整听完",
      netease_url: "https://music.163.com/album?id=123",
      title: "Test Album",
      artists: ["Test Artist"],
      regions: ["jp"],
    });

    expect(mocks.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "community",
        status: "published",
        created_by: "user-1",
        regions: ["jp"],
      }),
    );
    expect(mocks.recommendation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        releaseId: "release-new",
        userId: "user-1",
        status: "published",
      }),
    });
    expect(result).toEqual({
      release_id: "release-new",
      recommendation_id: "rec-created",
      is_new_release: true,
      status: "published",
    });
  });

  it("lets an ordinary user classify a submission as UDG", async () => {
    mocks.createRelease.mockResolvedValue({ id: "release-udg" });

    await submitRecommendation({
      userId: "user-udg",
      role: "user",
      netease_url: "https://music.163.com/album?id=789",
      title: "UDG Album",
      artists: ["Test Artist"],
      tags: ["udg", "independent"],
      udg: true,
    });

    expect(mocks.createRelease).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["independent", "UDG"],
      }),
    );
  });

  it("publishes when the optional recommendation reason is empty", async () => {
    mocks.createRelease.mockResolvedValue({ id: "release-without-reason" });

    const result = await submitRecommendation({
      userId: "user-without-reason",
      role: "user",
      netease_url: "https://music.163.com/album?id=456",
      title: "Quiet Recommendation",
      artists: ["Test Artist"],
    });

    expect(mocks.recommendation.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        releaseId: "release-without-reason",
        reason: "",
        status: "published",
      }),
    });
    expect(result.status).toBe("published");
  });

  it("promotes a legacy pending release when it is recommended again", async () => {
    mocks.getRelease.mockResolvedValue({
      id: "release-pending",
      status: "pending",
      tags: [],
    });

    const result = await submitRecommendation({
      userId: "user-2",
      role: "user",
      reason: "补一条新的推荐理由",
      releaseId: "release-pending",
    });

    expect(mocks.updateRelease).toHaveBeenCalledWith("release-pending", {
      status: "published",
    });
    expect(mocks.recommendation.updateMany).toHaveBeenCalledWith({
      where: { releaseId: "release-pending", status: "pending" },
      data: { status: "published" },
    });
    expect(result.status).toBe("published");
  });

  it("keeps rejected releases blocked", async () => {
    mocks.getRelease.mockResolvedValue({
      id: "release-rejected",
      status: "rejected",
      tags: [],
    });

    await expect(
      submitRecommendation({
        userId: "user-3",
        role: "user",
        reason: "尝试再次推荐这张专辑",
        releaseId: "release-rejected",
      }),
    ).rejects.toThrow("该专辑已被拒绝，无法继续推荐");

    expect(mocks.recommendation.create).not.toHaveBeenCalled();
  });
});
