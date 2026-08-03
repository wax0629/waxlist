import type { Session } from "./types";
import { createId } from "./id";

/**
 * v0.1: process-local session map.
 * Lost on server restart — acceptable per tech-decisions E.
 */
const globalForSessions = globalThis as unknown as {
  __beatHunterSessions?: Map<string, Session>;
};

const sessions: Map<string, Session> =
  globalForSessions.__beatHunterSessions ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForSessions.__beatHunterSessions = sessions;
}

export function createSession(): Session {
  const now = new Date().toISOString();
  const session: Session = {
    id: createId(),
    messages: [],
    constraints: {},
    last_shortlist: [],
    created_at: now,
    updated_at: now,
  };
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string): Session | undefined {
  return sessions.get(id);
}

export function saveSession(session: Session): void {
  session.updated_at = new Date().toISOString();
  sessions.set(session.id, session);
}

export function getOrCreateSession(sessionId?: string | null): Session {
  if (sessionId) {
    const existing = getSession(sessionId);
    if (existing) return existing;
  }
  return createSession();
}
