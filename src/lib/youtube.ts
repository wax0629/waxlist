import type { BeatCandidate } from "./types";

const YT_API = "https://www.googleapis.com/youtube/v3";

export function hasYouTubeKey(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY?.trim());
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      // /shorts/ID or /embed/ID
      if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export interface YtSearchHit {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail?: string;
  description?: string;
}

/** Process-local short cache — saves quota on refine / retries. */
const searchCache = new Map<string, { at: number; hits: YtSearchHit[] }>();
const SEARCH_TTL_MS = 10 * 60 * 1000;

export async function searchYouTube(
  query: string,
  maxResults = 8,
): Promise<YtSearchHit[]> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) {
    throw new Error("YOUTUBE_API_KEY 未配置");
  }

  const cacheKey = `${query}\0${maxResults}`;
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.at < SEARCH_TTL_MS) {
    return cached.hits;
  }

  const params = new URLSearchParams({
    part: "snippet",
    type: "video",
    maxResults: String(Math.min(maxResults, 15)),
    q: query,
    key,
    // Prefer relevance; videoCategoryId 10 = Music (optional, can over-filter)
    safeSearch: "none",
  });

  const res = await fetch(`${YT_API}/search?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`YouTube search failed (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    items?: Array<{
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        description?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  const hits: YtSearchHit[] = [];
  for (const item of data.items ?? []) {
    const videoId = item.id?.videoId;
    if (!videoId) continue;
    hits.push({
      videoId,
      title: item.snippet?.title ?? "Untitled",
      channelTitle: item.snippet?.channelTitle ?? "",
      description: item.snippet?.description,
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url,
    });
  }
  searchCache.set(cacheKey, { at: Date.now(), hits });
  // Bound memory
  if (searchCache.size > 80) {
    const oldest = [...searchCache.entries()].sort((a, b) => a[1].at - b[1].at);
    for (const [k] of oldest.slice(0, 20)) searchCache.delete(k);
  }
  return hits;
}

export async function getYouTubeVideoSnippet(videoId: string): Promise<{
  title: string;
  channelTitle: string;
  description: string;
  thumbnail?: string;
} | null> {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key) return null;

  const params = new URLSearchParams({
    part: "snippet",
    id: videoId,
    key,
  });

  const res = await fetch(`${YT_API}/videos?${params.toString()}`);
  if (!res.ok) return null;

  const data = (await res.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        channelTitle?: string;
        description?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }>;
  };

  const sn = data.items?.[0]?.snippet;
  if (!sn) return null;
  return {
    title: sn.title ?? "",
    channelTitle: sn.channelTitle ?? "",
    description: sn.description ?? "",
    thumbnail: sn.thumbnails?.medium?.url ?? sn.thumbnails?.default?.url,
  };
}

export function hitsToCandidates(
  hits: YtSearchHit[],
  reasonFor: (hit: YtSearchHit, index: number) => string,
  limit = 5,
): BeatCandidate[] {
  const seen = new Set<string>();
  const out: BeatCandidate[] = [];
  for (let i = 0; i < hits.length && out.length < limit; i++) {
    const hit = hits[i];
    if (seen.has(hit.videoId)) continue;
    seen.add(hit.videoId);
    out.push({
      id: `yt:${hit.videoId}`,
      title: hit.title,
      source: "youtube",
      url: `https://www.youtube.com/watch?v=${hit.videoId}`,
      reason: reasonFor(hit, out.length),
      thumbnail: hit.thumbnail,
      channel_title: hit.channelTitle,
      license_hint: "请以源站授权为准；本结果仅供试听发现",
    });
  }
  return out;
}
