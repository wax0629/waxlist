/**
 * Parse NetEase Cloud Music album/song URLs → id.
 * Supports desktop, mobile, hash routes, bare ids, and share text paste.
 * Short links (163cn.tv) need expandNeteaseShortLink before parse.
 */

export type NeteaseKind = "album" | "song" | "unknown";

const NETEASE_HOST =
  /(?:^|\.)(?:163cn\.tv|music\.163\.com|y\.music\.163\.com|st\.music\.163\.com)$/i;

/** Pull first NetEase URL (or bare id) from share fluff paste. */
export function extractNeteaseInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;

  if (/^\d+$/.test(trimmed)) return trimmed;

  // 分享…https://163cn.tv/xxx (@网易云音乐)
  const urlMatch = trimmed.match(
    /https?:\/\/(?:163cn\.tv|(?:y\.|st\.)?music\.163\.com)[^\s)）】"'<>]+/i,
  );
  if (urlMatch) {
    return urlMatch[0].replace(/[.,;。，；!！?？]+$/g, "");
  }

  // music.163.com without scheme
  const bareHost = trimmed.match(
    /(?:163cn\.tv|(?:y\.|st\.)?music\.163\.com)\/[^\s)）】"'<>]+/i,
  );
  if (bareHost) {
    return `https://${bareHost[0].replace(/[.,;。，；!！?？]+$/g, "")}`;
  }

  return trimmed;
}

export function isNeteaseShortLink(raw: string): boolean {
  try {
    const u = new URL(extractNeteaseInput(raw));
    return /(?:^|\.)163cn\.tv$/i.test(u.hostname);
  } catch {
    return false;
  }
}

export function parseNeteaseUrl(raw: string): {
  id?: string;
  kind: NeteaseKind;
  url: string;
} {
  const trimmed = extractNeteaseInput(raw);
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
    const withScheme = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const u = new URL(withScheme);

    if (!NETEASE_HOST.test(u.hostname)) {
      return { kind: "unknown", url: trimmed };
    }

    // Short share host without following redirects → no id yet
    if (/(?:^|\.)163cn\.tv$/i.test(u.hostname)) {
      return { kind: "unknown", url: withScheme };
    }

    // https://music.163.com/#/album?id=123
    // https://music.163.com/album?id=384834283&uct2=...
    // https://music.163.com/song?id=123
    // https://y.music.163.com/m/album?id=123
    // https://y.music.163.com/m/album?app_version=...&id=389241207
    const hash = u.hash.replace(/^#/, "");
    const fromHash = hash.includes("?")
      ? new URLSearchParams(hash.split("?")[1] ?? "")
      : null;
    const pathId =
      hash.match(/\/(?:m\/)?(?:album|song)\/(\d+)/i)?.[1] ||
      u.pathname.match(/\/(?:m\/)?(?:album|song)\/(\d+)/i)?.[1];

    const id =
      u.searchParams.get("id") ||
      fromHash?.get("id") ||
      pathId ||
      undefined;

    const path = `${u.pathname}${hash}${u.search}`.toLowerCase();
    let kind: NeteaseKind = "unknown";
    if (path.includes("song") && !path.includes("album")) kind = "song";
    else if (path.includes("album")) kind = "album";
    else if (id) kind = "album";

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
