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
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  candidates?: BeatCandidate[];
}

export interface SessionConstraints {
  style?: string[];
  mood?: string[];
  vocal?: string;
  tempo?: string;
  avoid?: string[];
  free_text?: string;
  reference?: {
    url?: string;
    title?: string;
    hints?: string[];
  };
}

export interface Session {
  id: string;
  messages: ChatMessage[];
  constraints: SessionConstraints;
  last_shortlist: BeatCandidate[];
  created_at: string;
  updated_at: string;
}
