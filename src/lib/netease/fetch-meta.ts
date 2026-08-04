import { parseNeteaseUrl, type NeteaseKind } from "./parse";

export type NeteaseReleaseType = "single" | "ep" | "album" | "other";

export interface NeteaseMeta {
  netease_id: string;
  kind: Exclude<NeteaseKind, "unknown">;
  /** Canonical album page when resolved from song */
  netease_url: string;
  title: string;
  artists: string[];
  cover_url?: string;
  type: NeteaseReleaseType;
  /** Track titles when available */
  tracks: string[];
  company?: string;
  description?: string;
  publish_time?: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

async function neteaseJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Referer: "https://music.163.com/",
      Accept: "application/json, text/plain, */*",
    },
    // NetEase responses should not be long-lived cache on our side
    cache: "no-store",
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    throw new Error(`网易云接口 HTTP ${res.status}`);
  }
  return res.json();
}

function httpsPic(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:\/\//i, "https://");
}

function inferType(opts: {
  size?: number;
  neteaseType?: string;
  kind: "album" | "song";
}): NeteaseReleaseType {
  if (opts.kind === "song") return "single";
  const size = opts.size ?? 0;
  const t = (opts.neteaseType || "").toLowerCase();
  if (t.includes("单曲") || size === 1) return "single";
  if (t.includes("ep") || t.includes("细碟") || (size > 1 && size <= 6)) {
    return "ep";
  }
  if (t.includes("专辑") || size > 6) return "album";
  if (size > 0) return size <= 6 ? "ep" : "album";
  return "album";
}

type AlbumPayload = {
  code?: number;
  album?: {
    id?: number;
    name?: string;
    picUrl?: string;
    blurPicUrl?: string;
    company?: string;
    description?: string;
    briefDesc?: string;
    publishTime?: number;
    size?: number;
    type?: string;
    artists?: { name?: string }[];
    artist?: { name?: string };
    songs?: {
      name?: string;
      artists?: { name?: string }[];
    }[];
  };
  songs?: { name?: string }[];
};

function mapAlbum(album: NonNullable<AlbumPayload["album"]>, fallbackSongs?: { name?: string }[]): NeteaseMeta {
  const id = String(album.id ?? "");
  const artists = (album.artists ?? [])
    .map((a) => a.name?.trim())
    .filter((n): n is string => Boolean(n));
  if (!artists.length && album.artist?.name) {
    artists.push(album.artist.name.trim());
  }

  const songList = album.songs?.length
    ? album.songs
    : (fallbackSongs ?? []);
  const tracks = songList
    .map((s) => s.name?.trim())
    .filter((n): n is string => Boolean(n));

  const title = album.name?.trim() || "";
  if (!id || !title) {
    throw new Error("未能解析专辑信息");
  }

  const pub = album.publishTime
    ? new Date(album.publishTime).toISOString()
    : undefined;

  return {
    netease_id: id,
    kind: "album",
    netease_url: `https://music.163.com/#/album?id=${id}`,
    title,
    artists: artists.length ? artists : ["未知艺人"],
    cover_url: httpsPic(album.picUrl || album.blurPicUrl),
    type: inferType({
      size: album.size ?? tracks.length,
      neteaseType: album.type,
      kind: "album",
    }),
    tracks,
    company: album.company?.trim() || undefined,
    description:
      album.description?.trim() || album.briefDesc?.trim() || undefined,
    publish_time: pub,
  };
}

export async function fetchAlbumMeta(albumId: string): Promise<NeteaseMeta> {
  // Prefer /api/v1/album — /api/album often returns risk-control code -462
  const data = (await neteaseJson(
    `https://music.163.com/api/v1/album/${encodeURIComponent(albumId)}`,
  )) as AlbumPayload;

  if (data.code !== 200 || !data.album) {
    throw new Error("专辑不存在或网易云暂不可用");
  }
  return mapAlbum(data.album, data.songs);
}

type SongDetailPayload = {
  code?: number;
  songs?: {
    name?: string;
    artists?: { name?: string }[];
    album?: {
      id?: number;
      name?: string;
      picUrl?: string;
    };
  }[];
};

/**
 * Resolve song → prefer parent album metadata; fall back to single-song card.
 */
export async function fetchSongMeta(songId: string): Promise<NeteaseMeta> {
  const data = (await neteaseJson(
    `https://music.163.com/api/song/detail/?ids=${encodeURIComponent(`[${songId}]`)}`,
  )) as SongDetailPayload;

  const song = data.songs?.[0];
  if (data.code !== 200 || !song) {
    throw new Error("单曲不存在或网易云暂不可用");
  }

  const albumId = song.album?.id;
  if (albumId) {
    try {
      return await fetchAlbumMeta(String(albumId));
    } catch {
      // fall through to song-level card
    }
  }

  const artists = (song.artists ?? [])
    .map((a) => a.name?.trim())
    .filter((n): n is string => Boolean(n));

  return {
    netease_id: String(albumId ?? songId),
    kind: "song",
    netease_url: albumId
      ? `https://music.163.com/#/album?id=${albumId}`
      : `https://music.163.com/#/song?id=${songId}`,
    title: song.album?.name?.trim() || song.name?.trim() || "未命名",
    artists: artists.length ? artists : ["未知艺人"],
    cover_url: httpsPic(song.album?.picUrl),
    type: "single",
    tracks: song.name?.trim() ? [song.name.trim()] : [],
  };
}

/**
 * Parse URL (or bare id) and fetch metadata from NetEase public APIs.
 */
export async function resolveNeteaseMeta(rawUrl: string): Promise<NeteaseMeta> {
  const parsed = parseNeteaseUrl(rawUrl);
  if (!parsed.id) {
    throw new Error("无法从链接识别网易云 ID，请粘贴完整专辑或单曲链接");
  }

  if (parsed.kind === "song") {
    return fetchSongMeta(parsed.id);
  }

  // album or unknown with id → try album first
  try {
    return await fetchAlbumMeta(parsed.id);
  } catch (albumErr) {
    if (parsed.kind === "album") throw albumErr;
    // bare id might be song
    return fetchSongMeta(parsed.id);
  }
}
