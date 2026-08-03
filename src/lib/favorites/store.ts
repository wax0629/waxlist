import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import { getRelease, setOwnerLoved } from "@/lib/releases/store";
import type { Release } from "@/lib/releases/types";

/** Recalc owner_loved from whether any user with role=owner has favorited. */
async function syncOwnerLovedFlag(releaseId: string): Promise<void> {
  const count = await prisma.favorite.count({
    where: {
      releaseId,
      user: { role: "owner" },
    },
  });
  await setOwnerLoved(releaseId, count > 0);
}

export async function isFavorited(
  userId: string,
  releaseId: string,
): Promise<boolean> {
  const row = await prisma.favorite.findUnique({
    where: {
      userId_releaseId: { userId, releaseId },
    },
  });
  return Boolean(row);
}

export async function favoritedReleaseIds(
  userId: string,
  releaseIds: string[],
): Promise<Set<string>> {
  if (!releaseIds.length) return new Set();
  const rows = await prisma.favorite.findMany({
    where: { userId, releaseId: { in: releaseIds } },
    select: { releaseId: true },
  });
  return new Set(rows.map((r) => r.releaseId));
}

export async function listFavoriteReleases(userId: string): Promise<Release[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { release: true },
  });
  const { mapRow } = await import("./map-release");
  return rows
    .filter((r) => r.release.status === "published")
    .map((r) => mapRow(r.release));
}

export async function addFavorite(
  userId: string,
  releaseId: string,
  userRole: string,
): Promise<{ favorited: true; owner_loved: boolean }> {
  const release = await getRelease(releaseId);
  if (!release || release.status !== "published") {
    throw new Error("专辑不存在或未发布");
  }
  await prisma.favorite.upsert({
    where: {
      userId_releaseId: { userId, releaseId },
    },
    create: {
      id: createId("fav_"),
      userId,
      releaseId,
    },
    update: {},
  });
  if (userRole === "owner") {
    await setOwnerLoved(releaseId, true);
  } else {
    await syncOwnerLovedFlag(releaseId);
  }
  const updated = await getRelease(releaseId);
  return { favorited: true, owner_loved: updated?.owner_loved ?? false };
}

export async function removeFavorite(
  userId: string,
  releaseId: string,
): Promise<{ favorited: false; owner_loved: boolean }> {
  try {
    await prisma.favorite.delete({
      where: {
        userId_releaseId: { userId, releaseId },
      },
    });
  } catch {
    // already gone
  }
  await syncOwnerLovedFlag(releaseId);
  const updated = await getRelease(releaseId);
  return { favorited: false, owner_loved: updated?.owner_loved ?? false };
}

export async function toggleFavorite(
  userId: string,
  releaseId: string,
  userRole: string,
): Promise<{ favorited: boolean; owner_loved: boolean }> {
  const existing = await isFavorited(userId, releaseId);
  if (existing) return removeFavorite(userId, releaseId);
  return addFavorite(userId, releaseId, userRole);
}
