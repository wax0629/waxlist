import { readFileSync } from "fs";
import path from "path";
import type { SearchIntent } from "@/lib/types";

export interface CnRapArtist {
  id: string;
  name_zh: string;
  name_en: string;
  aliases: string[];
  styles: string[];
  mood: string[];
  style_en: string[];
  queries: string[];
}

interface CatalogFile {
  artists?: CnRapArtist[];
}

export interface MatchedArtist {
  id: string;
  name_zh: string;
  name_en: string;
  styles: string[];
  mood: string[];
  style_en: string[];
  queries: string[];
  matched_alias: string;
}

let cached: CnRapArtist[] | null = null;
/** alias (lower) → artist, longer aliases first for scan order */
let aliasIndex: Array<{ alias: string; artist: CnRapArtist }> | null = null;

function loadArtists(): CnRapArtist[] {
  if (cached) return cached;
  try {
    const p = path.join(process.cwd(), "data", "cn-rap-artists.json");
    const raw = JSON.parse(readFileSync(p, "utf8")) as CatalogFile;
    cached = (raw.artists ?? []).filter(
      (a) => a.aliases?.length && a.queries?.length,
    );
  } catch {
    cached = [];
  }
  return cached;
}

function getAliasIndex(): Array<{ alias: string; artist: CnRapArtist }> {
  if (aliasIndex) return aliasIndex;
  const rows: Array<{ alias: string; artist: CnRapArtist }> = [];
  for (const artist of loadArtists()) {
    const names = [
      artist.name_zh,
      artist.name_en,
      ...(artist.aliases ?? []),
    ].filter(Boolean);
    for (const raw of names) {
      const alias = raw.trim().toLowerCase();
      if (alias.length < 2) continue;
      rows.push({ alias, artist });
    }
  }
  // Longer first → "马思唯" before "唯" if any; "higher brothers" before "higher"
  rows.sort((a, b) => b.alias.length - a.alias.length);
  aliasIndex = rows;
  return aliasIndex;
}

/**
 * Detect domestic rap artists mentioned in user text.
 * Does NOT use artist Chinese names as YouTube queries — only for style bridging.
 */
export function matchCnRapArtists(message: string): MatchedArtist[] {
  const text = message.toLowerCase();
  const hitIds = new Set<string>();
  const out: MatchedArtist[] = [];

  for (const { alias, artist } of getAliasIndex()) {
    if (hitIds.has(artist.id)) continue;
    if (!textIncludesAlias(text, message, alias)) continue;
    hitIds.add(artist.id);
    out.push({
      id: artist.id,
      name_zh: artist.name_zh,
      name_en: artist.name_en,
      styles: artist.styles ?? [],
      mood: artist.mood ?? [],
      style_en: artist.style_en ?? [],
      queries: artist.queries ?? [],
      matched_alias: alias,
    });
    if (out.length >= 3) break;
  }
  return out;
}

function textIncludesAlias(
  textLower: string,
  original: string,
  alias: string,
): boolean {
  // CJK: substring ok
  if (/[\u4e00-\u9fff]/.test(alias)) {
    return original.includes(alias) || textLower.includes(alias);
  }
  // Latin: word-boundary-ish to avoid "air" in "chair"
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`,
    "i",
  );
  return re.test(original) || re.test(textLower);
}

/** Merge matched artists into intent (styles/mood + artist_refs). */
export function applyArtistMatches(
  intent: SearchIntent,
  message: string,
): SearchIntent {
  const matches = matchCnRapArtists(message);
  if (!matches.length) {
    return { ...intent, artist_refs: intent.artist_refs };
  }

  const styles = [...(intent.style ?? [])];
  const moods = [...(intent.mood ?? [])];
  for (const m of matches) {
    for (const s of m.styles) {
      if (!styles.includes(s)) styles.push(s);
    }
    for (const mood of m.mood) {
      if (!moods.includes(mood)) moods.push(mood);
    }
  }

  const artist_refs = matches.map((m) => ({
    id: m.id,
    name_zh: m.name_zh,
    name_en: m.name_en,
    style_en: m.style_en,
    queries: m.queries,
  }));

  return {
    ...intent,
    style: styles,
    mood: moods,
    artist_refs,
  };
}

/** Extra YouTube queries from artist mapping (max 2). */
export function artistQueries(intent: SearchIntent): string[] {
  const refs = intent.artist_refs ?? [];
  const out: string[] = [];
  for (const ref of refs) {
    for (const q of ref.queries ?? []) {
      const cleaned = q.replace(/\s+/g, " ").trim().toLowerCase();
      if (cleaned && !out.includes(cleaned)) out.push(cleaned);
      if (out.length >= 2) return out;
    }
  }
  return out;
}
