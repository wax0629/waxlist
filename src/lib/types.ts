export type BeatSource = "youtube" | "mock";

export interface BeatCandidate {
  id: string;
  title: string;
  source: BeatSource;
  url: string;
  reason: string;
  thumbnail?: string;
  license_hint?: string;
  channel_title?: string;
  duration_sec?: number;
  tags?: string[];
  score?: number;
  match_tags?: string[];
}

/** v0.2 SearchIntent — same shape as session constraints (merged). */
export interface SearchIntent {
  style?: string[];
  mood?: string[];
  vocal?: string;
  tempo?: string;
  avoid?: string[];
  purpose?: string;
  free_text?: string;
  reference?: {
    url?: string;
    title?: string;
    hints?: string[];
  };
}

/** @deprecated alias — use SearchIntent */
export type SessionConstraints = SearchIntent;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  candidates?: BeatCandidate[];
  intent_summary?: string;
  queries_used?: string[];
  intent?: SearchIntent;
}

export interface Session {
  id: string;
  messages: ChatMessage[];
  constraints: SearchIntent;
  last_shortlist: BeatCandidate[];
  last_intent?: SearchIntent;
  last_queries_used?: string[];
  last_intent_summary?: string;
  created_at: string;
  updated_at: string;
}

export type ChatStatus = "ok" | "need_clarification" | "degraded";
