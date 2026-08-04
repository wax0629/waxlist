export type RecommendationStatus = "pending" | "published" | "rejected";

export interface RecommendationPublic {
  id: string;
  release_id: string;
  user_id: string;
  user_name: string;
  reason: string;
  tracks?: string;
  is_first: boolean;
  status: RecommendationStatus;
  created_at: string;
}

export interface PendingRecSnippet {
  user_name: string;
  reason: string;
  tracks?: string;
  created_at: string;
}

export interface PendingReleaseRow {
  release_id: string;
  title: string;
  artists: string[];
  cover_url?: string;
  netease_url?: string;
  type?: string;
  status: string;
  created_at: string;
  first_reason?: string;
  first_user_name?: string;
  first_tracks?: string;
  rec_count: number;
  recommendations: PendingRecSnippet[];
}
