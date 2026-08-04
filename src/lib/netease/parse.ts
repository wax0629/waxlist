/**
 * Parse NetEase Cloud Music album/song URLs → id.
 * Extra query params (uct2, etc.) are ignored for ID extraction.
 */

export type NeteaseKind = "album" | "song" | "unknown";

export function parseNeteaseUrl(raw: string): {
  id?: string;
  kind: NeteaseKind;
  url: string;
} {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unknown", url: trimmed };

  // bare numeric id
  if (/^\d+$/.test(trimmed)) {
    return {
      id: trimmed,
      kind: "album",
      url: `https://music.163.com/#/album?id=${trimmed}`,
    };
  }

  try {
    const u = new URL(trimmed);
    if (!/163\.com|music\.163/.test(u.hostname)) {
      return { kind: "unknown", url: trimmed };
    }
    // https://music.163.com/#/album?id=123
    // https://music.163.com/album?id=384834283&uct2=...
    // https://music.163.com/song?id=123
    // https://y.music.163.com/m/album?id=123
    const hash = u.hash.replace(/^#/, "");
    const fromHash = hash.includes("?")
      ? new URLSearchParams(hash.split("?")[1] ?? "")
      : null;
    // path like /m/album/123 or /album/123
    const pathId = hash.match(
      /\/(?:m\/)?(?:album|song)\/(\d+)/i,
    )?.[1] || u.pathname.match(/\/(?:m\/)?(?:album|song)\/(\d+)/i)?.[1];

    const id =
      u.searchParams.get("id") ||
      fromHash?.get("id") ||
      pathId ||
      undefined;

    const path = `${u.pathname}${hash}`.toLowerCase();
    let kind: NeteaseKind = "unknown";
    if (path.includes("album")) kind = "album";
    else if (path.includes("song")) kind = "song";

    const canonical =
      id && kind === "song"
        ? `https://music.163.com/#/song?id=${id}`
        : id
          ? `https://music.163.com/#/album?id=${id}`
          : trimmed;

    return { id: id ?? undefined, kind, url: canonical };
  } catch {
    return { kind: "unknown", url: trimmed };
  }
}
