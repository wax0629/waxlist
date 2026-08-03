import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "fs";
import path from "path";
import { createId } from "@/lib/id";
import type { CreateReleaseInput, Release, ReleaseStatus } from "./types";

const globalForReleases = globalThis as unknown as {
  __beatHunterReleases?: Map<string, Release>;
  __beatHunterReleasesLoaded?: boolean;
};

function dataDir(): string {
  return path.join(process.cwd(), ".data", "releases");
}

function releasesFile(): string {
  return path.join(dataDir(), "releases.json");
}

function ensureDir() {
  const dir = dataDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function getMap(): Map<string, Release> {
  if (!globalForReleases.__beatHunterReleases) {
    globalForReleases.__beatHunterReleases = new Map();
  }
  return globalForReleases.__beatHunterReleases;
}

function seedIfEmpty(): void {
  const map = getMap();
  if (map.size > 0) return;
  const seedPath = path.join(process.cwd(), "data", "releases.seed.json");
  if (!existsSync(seedPath)) return;
  try {
    const list = JSON.parse(readFileSync(seedPath, "utf8")) as Release[];
    for (const r of list) map.set(r.id, r);
    persist();
  } catch (err) {
    console.error("release seed failed", err);
  }
}

function loadAll(): void {
  if (globalForReleases.__beatHunterReleasesLoaded) return;
  globalForReleases.__beatHunterReleasesLoaded = true;
  const map = getMap();
  try {
    const fp = releasesFile();
    if (existsSync(fp)) {
      const list = JSON.parse(readFileSync(fp, "utf8")) as Release[];
      for (const r of list) map.set(r.id, r);
    }
  } catch (err) {
    console.error("release store load failed", err);
  }
  if (map.size === 0) seedIfEmpty();
}

function persist(): void {
  try {
    ensureDir();
    const list = [...getMap().values()];
    writeFileSync(releasesFile(), JSON.stringify(list, null, 2), "utf8");
  } catch (err) {
    console.error("release store save failed", err);
  }
}

export function listReleases(opts?: {
  status?: ReleaseStatus | ReleaseStatus[];
  source?: Release["source"];
}): Release[] {
  loadAll();
  let list = [...getMap().values()];
  if (opts?.status) {
    const set = new Set(
      Array.isArray(opts.status) ? opts.status : [opts.status],
    );
    list = list.filter((r) => set.has(r.status));
  }
  if (opts?.source) {
    list = list.filter((r) => r.source === opts.source);
  }
  return list.sort((a, b) => {
    const so = (a.sort_order ?? 9999) - (b.sort_order ?? 9999);
    if (so !== 0) return so;
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export function getRelease(id: string): Release | undefined {
  loadAll();
  return getMap().get(id);
}

export function findByNeteaseId(neteaseId: string): Release | undefined {
  loadAll();
  return [...getMap().values()].find((r) => r.netease_id === neteaseId);
}

export function createRelease(input: CreateReleaseInput): Release {
  loadAll();
  if (input.netease_id) {
    const existing = findByNeteaseId(input.netease_id);
    if (existing) {
      throw new Error("该网易云条目已存在");
    }
  }
  const now = new Date().toISOString();
  const release: Release = {
    id: createId("rel_"),
    title: input.title.trim(),
    artists: input.artists.map((a) => a.trim()).filter(Boolean),
    type: input.type ?? "album",
    netease_id: input.netease_id,
    netease_url: input.netease_url,
    cover_url: input.cover_url,
    tags: input.tags ?? [],
    description: input.description,
    curatorial_note: input.curatorial_note,
    source: input.source,
    status: input.status ?? "draft",
    links: input.links ?? [],
    sort_order: input.sort_order,
    created_by: input.created_by,
    created_at: now,
    updated_at: now,
  };
  if (!release.title) throw new Error("标题必填");
  getMap().set(release.id, release);
  persist();
  return release;
}

export function updateRelease(
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
      | "links"
      | "sort_order"
      | "rating_avg"
      | "rating_count"
    >
  >,
): Release {
  loadAll();
  const cur = getMap().get(id);
  if (!cur) throw new Error("发行不存在");
  const next: Release = {
    ...cur,
    ...patch,
    updated_at: new Date().toISOString(),
  };
  getMap().set(id, next);
  persist();
  return next;
}

export function deleteRelease(id: string): boolean {
  loadAll();
  const ok = getMap().delete(id);
  if (ok) persist();
  return ok;
}
