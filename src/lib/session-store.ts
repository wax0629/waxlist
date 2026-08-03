import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import type { Session } from "./types";
import { createId } from "./id";

/**
 * Phase 1: memory cache + JSON files under .data/sessions/
 * Survives process restart on a single Node host (not multi-region).
 */

const globalForSessions = globalThis as unknown as {
  __beatHunterSessions?: Map<string, Session>;
};

const sessions: Map<string, Session> =
  globalForSessions.__beatHunterSessions ?? new Map();

if (process.env.NODE_ENV !== "production") {
  globalForSessions.__beatHunterSessions = sessions;
}

function dataDir(): string {
  return path.join(process.cwd(), ".data", "sessions");
}

function ensureDir() {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function filePath(id: string): string {
  // prevent path traversal
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(dataDir(), `${safe}.json`);
}

function loadFromDisk(id: string): Session | undefined {
  try {
    const fp = filePath(id);
    if (!existsSync(fp)) return undefined;
    const raw = readFileSync(fp, "utf8");
    return JSON.parse(raw) as Session;
  } catch {
    return undefined;
  }
}

function saveToDisk(session: Session): void {
  try {
    ensureDir();
    writeFileSync(filePath(session.id), JSON.stringify(session), "utf8");
  } catch (err) {
    console.error("session persist failed", err);
  }
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
  saveToDisk(session);
  return session;
}

export function getSession(id: string): Session | undefined {
  const mem = sessions.get(id);
  if (mem) return mem;
  const disk = loadFromDisk(id);
  if (disk) {
    sessions.set(id, disk);
    return disk;
  }
  return undefined;
}

export function saveSession(session: Session): void {
  session.updated_at = new Date().toISOString();
  sessions.set(session.id, session);
  saveToDisk(session);
}

export function getOrCreateSession(sessionId?: string | null): Session {
  if (sessionId) {
    const existing = getSession(sessionId);
    if (existing) return existing;
  }
  return createSession();
}
