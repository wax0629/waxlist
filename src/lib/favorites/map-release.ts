import type { Prisma } from "@prisma/client";
import type { Release, ReleaseLink, ReleaseStatus } from "@/lib/releases/types";

/** Shared mapper for Prisma Release rows (used by favorites list). */
export function mapRow(r: {
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
  tracklist?: string[];
  releasedAt?: Date | null;
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
    tracklist: r.tracklist?.length ? r.tracklist : undefined,
    released_at: r.releasedAt ? r.releasedAt.toISOString() : undefined,
  };
}
