import { createId } from "@/lib/id";
import { logEvent } from "@/lib/logger";
import { MOCK_BEATS } from "@/lib/mock-beats";
import type {
  BeatCandidate,
  ChatStatus,
  SearchIntent,
  Session,
} from "@/lib/types";
import {
  extractYouTubeVideoId,
  getYouTubeVideoSnippet,
  hasYouTubeKey,
  searchYouTube,
  type YtSearchHit,
} from "@/lib/youtube";
import { extractUrl, mergeIntent, summarizeIntent } from "./intent";
import { planQueriesSmart } from "./plan-queries-llm";
import { refineReasonsWithLlm } from "./rank-llm";
import { filterAndScore, templateReason } from "./score";

export interface RunTurnResult {
  assistant_message: string;
  candidates: BeatCandidate[];
  status: ChatStatus;
  warnings: string[];
  constraints: SearchIntent;
  intent: SearchIntent;
  intent_summary: string;
  queries_used: string[];
  debug?: {
    recall_count: number;
    after_filter_count: number;
    duration_ms: number;
    llm_reason: boolean;
  };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function enrichReference(
  intent: SearchIntent,
  warnings: string[],
): Promise<SearchIntent> {
  const url = intent.reference?.url;
  if (!url) return intent;

  if (!/youtube\.com|youtu\.be/i.test(url)) {
    warnings.push("非 YouTube 链接已作补充描述（仅深解析 YouTube）。");
    return intent;
  }
  if (!hasYouTubeKey()) {
    warnings.push("无 YOUTUBE_API_KEY，参考链接仅作文本约束。");
    return intent;
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    warnings.push("无法解析 YouTube 视频 ID。");
    return intent;
  }

  try {
    const sn = await getYouTubeVideoSnippet(videoId);
    if (!sn) {
      warnings.push("参考视频信息拉取失败。");
      return intent;
    }
    return {
      ...intent,
      reference: {
        url,
        title: decodeEntities(sn.title),
        hints: [
          sn.title,
          ...sn.description
            .split(/[\n,|]/)
            .map((s) => s.trim())
            .filter((s) => s.length > 2 && s.length < 40)
            .slice(0, 4),
        ],
      },
    };
  } catch {
    warnings.push("参考解析出错，已降级。");
    return intent;
  }
}

function mockCandidates(intent: SearchIntent, turn: number): BeatCandidate[] {
  const stamp = turn > 0 ? ` · refine#${turn}` : "";
  return MOCK_BEATS.map((b, i) => ({
    ...b,
    id: `mock:${turn}:${i}`,
    title: `${b.title}${stamp}`,
    reason: templateReason(
      {
        videoId: `mock${i}`,
        title: b.title,
        channelTitle: "",
        score: 1,
        score_reasons: [],
      },
      intent,
    ),
  }));
}

function scoredToCandidates(
  scored: ReturnType<typeof filterAndScore>,
  intent: SearchIntent,
  limit = 5,
): BeatCandidate[] {
  return scored.slice(0, limit).map((h) => ({
    id: `yt:${h.videoId}`,
    title: decodeEntities(h.title),
    source: "youtube" as const,
    url: `https://www.youtube.com/watch?v=${h.videoId}`,
    reason: templateReason(h, intent),
    thumbnail: h.thumbnail,
    channel_title: h.channelTitle,
    license_hint: "请以源站授权为准；本结果仅供试听发现",
    score: h.score,
    match_tags: h.score_reasons.slice(0, 3),
  }));
}

export async function runPipelineTurn(
  session: Session,
  message: string,
  refUrl?: string,
): Promise<RunTurnResult> {
  const t0 = Date.now();
  const warnings: string[] = [];
  const url = refUrl || extractUrl(message);
  let intent = mergeIntent(session.constraints ?? {}, message, url);
  intent = await enrichReference(intent, warnings);

  const queryPlan = await planQueriesSmart(intent);
  const queries_used = queryPlan.queries;
  const intent_summary = summarizeIntent(intent);
  const refineCount = session.messages.filter((m) => m.role === "user").length;
  if (queryPlan.warning) warnings.push(queryPlan.warning);

  const finish = (
    partial: Omit<RunTurnResult, "debug"> & {
      debug?: RunTurnResult["debug"];
    },
    extra?: { recall?: number; filtered?: number; llm?: boolean },
  ): RunTurnResult => {
    const duration_ms = Date.now() - t0;
    logEvent("pipeline_turn", {
      session_id: session.id,
      status: partial.status,
      duration_ms,
      styles: intent.style,
      query_source: queryPlan.source,
      queries: queries_used,
      recall: extra?.recall ?? 0,
      filtered: extra?.filtered ?? 0,
      llm_reason: extra?.llm ?? false,
      candidate_n: partial.candidates.length,
      warnings: partial.warnings,
    });
    return {
      ...partial,
      debug: {
        recall_count: extra?.recall ?? 0,
        after_filter_count: extra?.filtered ?? 0,
        duration_ms,
        llm_reason: extra?.llm ?? false,
      },
    };
  };

  if (!hasYouTubeKey()) {
    warnings.push("未配置 YOUTUBE_API_KEY，使用 mock 短名单。");
    return finish({
      assistant_message: composeAssistant({
        mode: "mock",
        intent_summary,
        refineCount,
      }),
      candidates: mockCandidates(intent, refineCount),
      status: "degraded",
      warnings,
      constraints: intent,
      intent,
      intent_summary,
      queries_used,
    });
  }

  try {
    const allHits: YtSearchHit[] = [];
    for (const q of queries_used) {
      const hits = await searchYouTube(q, 6);
      allHits.push(...hits);
    }

    const seen = new Set<string>();
    const unique: YtSearchHit[] = [];
    for (const h of allHits) {
      if (seen.has(h.videoId)) continue;
      seen.add(h.videoId);
      unique.push(h);
    }

    let scored = filterAndScore(unique, intent);
    if (scored.length === 0 && unique.length > 0) {
      warnings.push("过滤过严，已放宽为原始召回排序。");
      scored = unique.map((h) => ({
        ...h,
        score: 0,
        score_reasons: ["放宽过滤"],
      }));
    }

    let candidates = scoredToCandidates(scored, intent, 5);
    if (candidates.length === 0) {
      warnings.push("YouTube 无可用结果，回退 mock。");
      return finish(
        {
          assistant_message: composeAssistant({
            mode: "mock",
            intent_summary,
            refineCount,
          }),
          candidates: mockCandidates(intent, refineCount),
          status: "degraded",
          warnings,
          constraints: intent,
          intent,
          intent_summary,
          queries_used,
        },
        { recall: unique.length, filtered: 0 },
      );
    }

    const ranked = await refineReasonsWithLlm(
      candidates,
      intent,
      intent_summary,
    );
    candidates = ranked.candidates;
    if (ranked.warning) warnings.push(ranked.warning);

    return finish(
      {
        assistant_message: composeAssistant({
          mode: "youtube",
          intent_summary,
          refineCount,
          hasRef: Boolean(intent.reference?.title || intent.reference?.url),
        }),
        candidates,
        status: warnings.length ? "degraded" : "ok",
        warnings,
        constraints: intent,
        intent,
        intent_summary,
        queries_used,
      },
      {
        recall: unique.length,
        filtered: scored.length,
        llm: ranked.usedLlm,
      },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "YouTube 失败";
    warnings.push(`检索降级：${msg}`);
    return finish({
      assistant_message: composeAssistant({
        mode: "mock",
        intent_summary,
        refineCount,
      }),
      candidates: mockCandidates(intent, refineCount),
      status: "degraded",
      warnings,
      constraints: intent,
      intent,
      intent_summary,
      queries_used,
    });
  }
}

function composeAssistant(opts: {
  mode: "youtube" | "mock";
  intent_summary: string;
  refineCount: number;
  hasRef?: boolean;
}): string {
  if (opts.mode === "mock") {
    return opts.refineCount > 0
      ? "已按反馈更新理解（当前为降级/mock 结果）。配置好 YouTube Key 后可走真检索。"
      : "当前为降级短名单。下方可查看「我的理解」与计划检索词；配置 YOUTUBE_API_KEY 后将执行真检索。";
  }
  if (opts.refineCount > 0) {
    return "已根据你的 refine 更新约束，并重新做了多路伴奏域检索与筛选。可继续收窄。";
  }
  if (opts.hasRef) {
    return "已结合参考曲解析，用多角度 type beat / instrumental 策略检索。下方可查看理解与检索词。";
  }
  return "已把你的需求翻译成伴奏域检索策略（多路 query + 过滤排序）。可展开查看本轮检索词，或继续 refine。";
}

export function appendTurn(
  session: Session,
  userText: string,
  result: RunTurnResult,
): Session {
  const now = new Date().toISOString();
  session.messages.push({
    id: createId("msg-"),
    role: "user",
    content: userText,
    created_at: now,
  });
  session.messages.push({
    id: createId("msg-"),
    role: "assistant",
    content: result.assistant_message,
    created_at: now,
    candidates: result.candidates,
    intent_summary: result.intent_summary,
    queries_used: result.queries_used,
    intent: result.intent,
  });
  session.constraints = result.intent;
  session.last_shortlist = result.candidates;
  session.last_intent = result.intent;
  session.last_queries_used = result.queries_used;
  session.last_intent_summary = result.intent_summary;
  return session;
}
