import type { BeatCandidate } from "@/lib/types";
import type { LlmToolDef } from "@/lib/llm";
import {
  extractYouTubeVideoId,
  getYouTubeVideoSnippet,
  hasYouTubeKey,
  hitsToCandidates,
  searchYouTube,
  type YtSearchHit,
} from "@/lib/youtube";

export const AGENT_TOOLS: LlmToolDef[] = [
  {
    type: "function",
    function: {
      name: "parse_reference",
      description:
        "Parse a YouTube reference URL into title and style hints. Call when user pastes a reference track link.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "YouTube video URL" },
        },
        required: ["url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_youtube",
      description:
        "Search YouTube for type beats / instrumentals. Prefer English queries like 'slow rnb type beat soft drums'. Call 1–3 times with different queries.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          max_results: { type: "integer", minimum: 3, maximum: 10 },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finalize_shortlist",
      description:
        "Submit the final 3–5 beat shortlist for the singer. candidate video_ids MUST come from search_youtube results in this turn. Write concise Chinese reasons.",
      parameters: {
        type: "object",
        properties: {
          assistant_message: {
            type: "string",
            description: "Short Chinese reply to the user (no markdown walls).",
          },
          items: {
            type: "array",
            minItems: 1,
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                video_id: { type: "string" },
                reason: {
                  type: "string",
                  description: "1–2 Chinese sentences why this fits",
                },
              },
              required: ["video_id", "reason"],
            },
          },
        },
        required: ["assistant_message", "items"],
      },
    },
  },
];

export interface ToolContext {
  hitIndex: Map<string, YtSearchHit>;
  finalized?: {
    assistant_message: string;
    candidates: BeatCandidate[];
  };
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw || "{}") as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function executeTool(
  name: string,
  argsJson: string,
  ctx: ToolContext,
): Promise<string> {
  const args = parseArgs(argsJson);

  switch (name) {
    case "parse_reference": {
      const url = String(args.url ?? "");
      if (!url) return JSON.stringify({ error: "url required" });
      if (!hasYouTubeKey()) {
        return JSON.stringify({
          error: "YouTube API key missing",
          url,
          degraded: true,
        });
      }
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        return JSON.stringify({ error: "not a YouTube url", url });
      }
      const sn = await getYouTubeVideoSnippet(videoId);
      if (!sn) {
        return JSON.stringify({ error: "video not found", videoId });
      }
      return JSON.stringify({
        video_id: videoId,
        title: sn.title,
        channel: sn.channelTitle,
        description_excerpt: sn.description.slice(0, 400),
        query_hints: [
          sn.title,
          "type beat",
          "instrumental",
        ].filter(Boolean),
      });
    }

    case "search_youtube": {
      if (!hasYouTubeKey()) {
        return JSON.stringify({ error: "YOUTUBE_API_KEY missing", hits: [] });
      }
      const query = String(args.query ?? "").trim();
      if (!query) return JSON.stringify({ error: "query required", hits: [] });
      const max = Number(args.max_results ?? 6);
      try {
        const hits = await searchYouTube(query, max);
        for (const h of hits) ctx.hitIndex.set(h.videoId, h);
        return JSON.stringify({
          query,
          hits: hits.map((h) => ({
            video_id: h.videoId,
            title: h.title,
            channel: h.channelTitle,
            url: `https://www.youtube.com/watch?v=${h.videoId}`,
          })),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "search failed";
        return JSON.stringify({ error: msg, hits: [] });
      }
    }

    case "finalize_shortlist": {
      const assistant_message = String(args.assistant_message ?? "这是为你整理的伴奏短名单。");
      const items = (args.items as Array<{ video_id?: string; reason?: string }>) ?? [];
      const candidates: BeatCandidate[] = [];
      const missing: string[] = [];

      for (const item of items.slice(0, 5)) {
        const id = item.video_id?.trim();
        if (!id) continue;
        const hit = ctx.hitIndex.get(id);
        if (!hit) {
          missing.push(id);
          continue;
        }
        candidates.push({
          id: `yt:${hit.videoId}`,
          title: hit.title,
          source: "youtube",
          url: `https://www.youtube.com/watch?v=${hit.videoId}`,
          reason: (item.reason ?? "与你的需求气质接近。").slice(0, 200),
          thumbnail: hit.thumbnail,
          channel_title: hit.channelTitle,
          license_hint: "请以源站授权为准；本结果仅供试听发现",
        });
      }

      // If model invented ids, fall back to first hits in index
      if (candidates.length === 0 && ctx.hitIndex.size > 0) {
        const fallback = hitsToCandidates(
          [...ctx.hitIndex.values()],
          (h) => `检索命中：${h.title.slice(0, 40)}`,
          5,
        );
        ctx.finalized = {
          assistant_message:
            assistant_message + "（部分条目已按检索结果自动校正）",
          candidates: fallback,
        };
        return JSON.stringify({
          ok: true,
          count: fallback.length,
          note: "used search hits fallback",
        });
      }

      ctx.finalized = { assistant_message, candidates };
      return JSON.stringify({
        ok: candidates.length > 0,
        count: candidates.length,
        missing_video_ids: missing,
      });
    }

    default:
      return JSON.stringify({ error: `unknown tool: ${name}` });
  }
}
