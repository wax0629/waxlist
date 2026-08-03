/**
 * Parse NetEase Cloud Music album/song URLs → id.
 * Metadata (title/cover) is manual-first; auto-fetch is optional later.
 */

export type NeteaseKind = "album" | "song" | "unknown";

export function parseNeteaseUrl(raw: string): {
  id?: string;
  kind: NeteaseKind;
  url: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unknown", url: trimmed };

  try {
    const u = new URL(trimmed);
    if (!/163\.com|music\.163/.test(u.hostname)) {
      return { kind: "unknown", url: trimmed };
    }
    // https://music.163.com/#/album?id=123
    // https://music.163.com/album?id=123
    // https://music.163.com/song?id=123
    const hash = u.hash.replace(/^#/, "");
    const fromHash = hash.includes("?")
      ? new URLSearchParams(hash.split("?")[1] ?? "")
      : null;
    const id =
      u.searchParams.get("id") ||
      fromHash?.get("id") ||
      undefined;

    const path = `${u.pathname}${hash}`.toLowerCase();
    let kind: NeteaseKind = "unknown";
    if (path.includes("album")) kind = "album";
    else if (path.includes("song")) kind = "song";

    return { id: id ?? undefined, kind, url: trimmed };
  } catch {
    // bare id
    if (/^\d+$/.test(trimmed)) {
      return {
        id: trimmed,
        kind: "album",
        url: `https://music.163.com/#/album?id=${trimmed}`,
      };
    }
    return { kind: "unknown", url: trimmed };
  }
}
