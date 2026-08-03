import { createId } from "@/lib/id";
import { prisma } from "@/lib/db";
import type { CreateReleaseInput, Release, ReleaseLink, ReleaseStatus } from "./types";
import type { Prisma } from "@prisma/client";

function mapRow(r: {
  id: string;
  title: string;
  artists: string[];
  type: string;
  neteaseId: string | null;
  neteaseUrl: string | null;
  coverUrl: string | null;
  tags: string[];
  description: string | null;
  curatorialNote: string | null;
  source: string;
  status: string;
  ownerLoved: boolean;
  links: Prisma.JsonValue;
  sortOrder: number | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  ratingAvg: number | null;
  ratingCount: number;
}): Release {
  return {
    id: r.id,
    title: r.title,
    artists: r.artists,
    type: r.type as Release["type"],
    netease_id: r.neteaseId ?? undefined,
    netease_url: r.neteaseUrl ?? undefined,
    cover_url: r.coverUrl ?? undefined,
    tags: r.tags,
    description: r.description ?? undefined,
    curatorial_note: r.curatorialNote ?? undefined,
    source: r.source as Release["source"],
    status: r.status as ReleaseStatus,
    owner_loved: r.ownerLoved,
    links: (Array.isArray(r.links) ? r.links : []) as unknown as ReleaseLink[],
    sort_order: r.sortOrder ?? undefined,
    created_by: r.createdById ?? undefined,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
    rating_avg: r.ratingAvg ?? undefined,
    rating_count: r.ratingCount,
  };
}

export async function listReleases(opts?: {
  status?: ReleaseStatus | ReleaseStatus[];
  source?: Release["source"];
}): Promise<Release[]> {
  const statusFilter = opts?.status
    ? Array.isArray(opts.status)
      ? { in: opts.status }
      : opts.status
    : undefined;

  const rows = await prisma.release.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(opts?.source ? { source: opts.source } : {}),
    },
    // 站主爱听（红心）优先，再按 sort / 更新时间
    orderBy: [
      { ownerLoved: "desc" },
      { sortOrder: "asc" },
      { updatedAt: "desc" },
    ],
  });
  return rows.map(mapRow);
}

export async function getRelease(id: string): Promise<Release | undefined> {
  const row = await prisma.release.findUnique({ where: { id } });
  return row ? mapRow(row) : undefined;
}

export async function findByNeteaseId(
  neteaseId: string,
): Promise<Release | undefined> {
  if (!neteaseId) return undefined;
  const row = await prisma.release.findUnique({
    where: { neteaseId },
  });
  return row ? mapRow(row) : undefined;
}

export async function createRelease(
  input: CreateReleaseInput,
): Promise<Release> {
  if (input.netease_id) {
    const existing = await findByNeteaseId(input.netease_id);
    if (existing) {
      throw new Error("该网易云条目已存在");
    }
  }
  if (!input.title.trim()) throw new Error("标题必填");

  const row = await prisma.release.create({
    data: {
      id: createId("rel_"),
      title: input.title.trim(),
      artists: input.artists.map((a) => a.trim()).filter(Boolean),
      type: input.type ?? "album",
      neteaseId: input.netease_id || null,
      neteaseUrl: input.netease_url || null,
      coverUrl: input.cover_url || null,
      tags: input.tags ?? [],
      description: input.description || null,
      curatorialNote: input.curatorial_note || null,
      source: input.source,
      status: input.status ?? "draft",
      links: (input.links ?? []) as unknown as Prisma.InputJsonValue,
      sortOrder: input.sort_order ?? null,
      createdById: input.created_by || null,
    },
  });
  return mapRow(row);
}

export async function updateRelease(
  id: string,
  patch: Partial<
    Pick<
      Release,
      | "title"
      | "artists"
      | "type"
      | "cover_url"
      | "tags"
      | "description"
      | "curatorial_note"
      | "status"
      | "owner_loved"
      | "links"
      | "sort_order"
      | "rating_avg"
      | "rating_count"
      | "netease_url"
      | "netease_id"
    >
  >,
): Promise<Release> {
  const row = await prisma.release.update({
    where: { id },
    data: {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.artists !== undefined ? { artists: patch.artists } : {}),
      ...(patch.type !== undefined ? { type: patch.type } : {}),
      ...(patch.cover_url !== undefined ? { coverUrl: patch.cover_url || null } : {}),
      ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description || null }
        : {}),
      ...(patch.curatorial_note !== undefined
        ? { curatorialNote: patch.curatorial_note || null }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.owner_loved !== undefined
        ? { ownerLoved: patch.owner_loved }
        : {}),
      ...(patch.links !== undefined
        ? { links: patch.links as unknown as Prisma.InputJsonValue }
        : {}),
      ...(patch.sort_order !== undefined
        ? { sortOrder: patch.sort_order ?? null }
        : {}),
      ...(patch.rating_avg !== undefined
        ? { ratingAvg: patch.rating_avg ?? null }
        : {}),
      ...(patch.rating_count !== undefined
        ? { ratingCount: patch.rating_count }
        : {}),
      ...(patch.netease_url !== undefined
        ? { neteaseUrl: patch.netease_url || null }
        : {}),
      ...(patch.netease_id !== undefined
        ? { neteaseId: patch.netease_id || null }
        : {}),
    },
  });
  return mapRow(row);
}

/** Toggle 站主爱听 — only caller should enforce owner role. */
export async function setOwnerLoved(
  id: string,
  loved: boolean,
): Promise<Release> {
  return updateRelease(id, { owner_loved: loved });
}

export async function deleteRelease(id: string): Promise<boolean> {
  try {
    await prisma.release.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
