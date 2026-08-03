/**
 * Release = curated / community album or single (Phase 1.5 community).
 * Platform limited to NetEase Cloud Music for v1.
 */

export type ReleaseType = "single" | "ep" | "album" | "other";

/** Who put it in the catalog */
export type ReleaseSource = "owner" | "community";

export type ReleaseStatus =
  | "draft"
  | "pending"
  | "published"
  | "rejected";

export interface ReleaseLink {
  label: string;
  url: string;
}

export interface Release {
  id: string;
  title: string;
  artists: string[];
  type: ReleaseType;
  /** NetEase album or song id when known */
  netease_id?: string;
  netease_url?: string;
  cover_url?: string;
  tags: string[];
  description?: string;
  /** 站主或策展长评 */
  curatorial_note?: string;
  source: ReleaseSource;
  status: ReleaseStatus;
  /** 站主红心 → 展示「站主爱听」特色标签 */
  owner_loved: boolean;
  links: ReleaseLink[];
  sort_order?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  /** Aggregates — filled when ratings exist */
  rating_avg?: number;
  rating_count?: number;
}

export interface CreateReleaseInput {
  title: string;
  artists: string[];
  type?: ReleaseType;
  netease_id?: string;
  netease_url?: string;
  cover_url?: string;
  tags?: string[];
  description?: string;
  curatorial_note?: string;
  source: ReleaseSource;
  status?: ReleaseStatus;
  links?: ReleaseLink[];
  sort_order?: number;
  created_by?: string;
}
