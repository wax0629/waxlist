import { createId } from "@/lib/id";
import { MOCK_BEATS } from "@/lib/mock-beats";
import type { BeatCandidate, Session, SessionConstraints } from "@/lib/types";
import {
  extractYouTubeVideoId,
  getYouTubeVideoSnippet,
  hasYouTubeKey,
  hitsToCandidates,
  searchYouTube,
  type YtSearchHit,
} from "@/lib/youtube";
import { planQueries } from "./plan-queries";

export type ChatStatus = "ok" | "need_clarification" | "degraded";

export interface RunTurnResult {
  assistant_message: string;
  candidates: BeatCandidate[];
  status: ChatStatus;
  warnings: string[];
  constraints: SessionConstraints;
}

function extractUrl(text: string): string | undefined {
  const m = text.match(/https?:\/\/[^\s]+/i);
  return m?.[0]?.replace(/[),.;]+$/, "");
}

export function mergeConstraints(
  prev: SessionConstraints,
  message: string,
  refUrl?: string,
): SessionConstraints {
  const lower = message.toLowerCase();
  const next: SessionConstraints = {
    ...prev,
    free_text: message,
  };

  if (refUrl || extractUrl(message)) {
    next.reference = {
      ...prev.reference,
      url: refUrl || extractUrl(message),
    };
  }

  if (/女声|female/.test(lower)) next.vocal = "female";
  if (/男声|male/.test(lower)) next.vocal = "male";
  if (/慢|chill|slow|慢热/.test(lower)) next.tempo = "slow";
  if (/快|uptempo|faster|更快/.test(lower)) next.tempo = "fast";
  if (/r&?b|rnb/.test(lower)) {
    next.style = [...new Set([...(next.style ?? []), "r&b"])];
  }
  if (/trap/.test(lower)) {
    next.style = [...new Set([...(next.style ?? []), "trap"])];
  }
  if (/鼓.*(轻|小|少)|轻一点|别太抢|不要太抢/.test(lower)) {
    next.avoid = [...new Set([...(next.avoid ?? []), "heavy drums"])];
  }

  return next;
}

function tailorReason(base: string, c: SessionConstraints): string {
  const bits: string[] = [base];
  if (c.vocal === "female") bits.push("偏女声友好。");
  if (c.tempo === "slow") bits.push("节奏偏慢热。");
  if (c.tempo === "fast") bits.push("节奏略加快。");
  if (c.avoid?.includes("heavy drums")) bits.push("鼓点尽量靠后。");
  if (c.reference?.title) bits.push(`参考气质接近「${c.reference.title}」。`);
  else if (c.reference?.url) bits.push("已参考你提供的链接气质。");
  return bits.join(" ");
}

function buildMockCandidates(
  constraints: SessionConstraints,
  turn: number,
): BeatCandidate[] {
  const stamp = turn > 0 ? ` · refine#${turn}` : "";
  const base = MOCK_BEATS.map((b, i) => ({
    ...b,
    id: `mock:${turn}:${i}`,
    title: `${b.title}${stamp}`,
    reason: tailorReason(b.reason, constraints),
  }));
  if (turn > 0 && base.length > 1) {
    const [first, ...rest] = base;
    return [...rest, first];
  }
  return base;
}

function reasonFromHit(hit: YtSearchHit, c: SessionConstraints): string {
  const title = hit.title.toLowerCase();
  const bits: string[] = [];
  if (/type\s*beat|instrumental|beat/.test(title)) {
    bits.push("标题偏伴奏 / type beat，适合试唱。");
  } else {
    bits.push("检索命中，可点开试听是否合拍。");
  }
  if (c.vocal === "female" && /female|girl|woman|r&b|rnb/.test(title)) {
    bits.push("标题与女声向气质接近。");
  }
  if (c.tempo === "slow" && /slow|chill|soft|night|lofi|lo-fi/.test(title)) {
    bits.push("标题偏慢热/放松。");
  }
  if (c.tempo === "fast" && /fast|uptempo|energy|drill/.test(title)) {
    bits.push("标题偏快节奏。");
  }
  if (c.reference?.title) {
    bits.push(`按参考「${c.reference.title.slice(0, 40)}」相关检索。`);
  }
  if (hit.channelTitle) {
    bits.push(`来源频道：${hit.channelTitle}。`);
  }
  return bits.join(" ") || "YouTube 检索结果。";
}

async function enrichReference(
  constraints: SessionConstraints,
  warnings: string[],
): Promise<SessionConstraints> {
  const url = constraints.reference?.url;
  if (!url) return constraints;

  if (!/youtube\.com|youtu\.be/i.test(url)) {
    warnings.push("非 YouTube 链接已作补充描述处理（v0.1 仅深解析 YouTube）。");
    return constraints;
  }

  if (!hasYouTubeKey()) {
    warnings.push("未配置 YOUTUBE_API_KEY，参考链接仅作文本约束。");
    return constraints;
  }

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    warnings.push("无法从链接解析 YouTube 视频 ID。");
    return constraints;
  }

  try {
    const sn = await getYouTubeVideoSnippet(videoId);
    if (!sn) {
      warnings.push("参考视频信息拉取失败，将仅用链接文本。");
      return constraints;
    }
    const hints = [
      sn.title,
      ...sn.description
        .split(/[\n,|]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 2 && s.length < 40)
        .slice(0, 4),
    ];
    return {
      ...constraints,
      reference: {
        url,
        title: sn.title,
        hints,
      },
    };
  } catch {
    warnings.push("参考视频解析出错，已降级。");
    return constraints;
  }
}

/**
 * Heuristic path: plan queries → YouTube search → rank/explain (no LLM tools).
 * Falls back to mock if no key or API errors.
 * Prefer `runAgentTurn` from orchestrator when LLM is available.
 */
export async function runHeuristicTurn(
  session: Session,
  message: string,
  refUrl?: string,
): Promise<RunTurnResult> {
  const warnings: string[] = [];
  const url = refUrl || extractUrl(message);
  let constraints = mergeConstraints(session.constraints, message, url);
  constraints = await enrichReference(constraints, warnings);

  const refineCount = session.messages.filter((m) => m.role === "user").length;
  const queries = planQueries(constraints);

  if (!hasYouTubeKey()) {
    warnings.push(
      "未配置 YOUTUBE_API_KEY，使用 mock 短名单。见 docs/youtube-api-setup.md",
    );
    return {
      assistant_message: composeMessage({
        refineCount,
        hasRef: Boolean(constraints.reference?.url),
        mode: "mock",
        queries,
      }),
      candidates: buildMockCandidates(constraints, refineCount),
      status: "degraded",
      warnings,
      constraints,
    };
  }

  try {
    const allHits: YtSearchHit[] = [];
    for (const q of queries) {
      const hits = await searchYouTube(q, 6);
      allHits.push(...hits);
    }

    const candidates = hitsToCandidates(
      allHits,
      (hit) => reasonFromHit(hit, constraints),
      5,
    );

    if (candidates.length === 0) {
      warnings.push("YouTube 无结果，回退 mock。");
      return {
        assistant_message: composeMessage({
          refineCount,
          hasRef: Boolean(constraints.reference?.title || constraints.reference?.url),
          mode: "mock",
          queries,
        }),
        candidates: buildMockCandidates(constraints, refineCount),
        status: "degraded",
        warnings,
        constraints,
      };
    }

    return {
      assistant_message: composeMessage({
        refineCount,
        hasRef: Boolean(constraints.reference?.title || constraints.reference?.url),
        mode: "youtube",
        queries,
        refTitle: constraints.reference?.title,
      }),
      candidates,
      status: "ok",
      warnings,
      constraints,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "YouTube 请求失败";
    warnings.push(`YouTube 降级：${msg}`);
    return {
      assistant_message: composeMessage({
        refineCount,
        hasRef: Boolean(constraints.reference?.url),
        mode: "mock",
        queries,
      }),
      candidates: buildMockCandidates(constraints, refineCount),
      status: "degraded",
      warnings,
      constraints,
    };
  }
}

function composeMessage(opts: {
  refineCount: number;
  hasRef: boolean;
  mode: "youtube" | "mock";
  queries: string[];
  refTitle?: string;
}): string {
  const qHint = opts.queries[0] ? `检索词示例：${opts.queries[0]}` : "";

  if (opts.mode === "youtube") {
    if (opts.refineCount > 0) {
      return `已按反馈更新约束，并从 YouTube 重新搜了一轮短名单。\n\n${qHint}\n\n继续说「鼓再轻」「再快一点」等可再 refine。`;
    }
    if (opts.hasRef) {
      const t = opts.refTitle ? `「${opts.refTitle}」` : "你的参考链接";
      return `已解析参考 ${t}，在 YouTube 上找了相近气质的可试听伴奏。\n\n${qHint}\n\n可以说「再慢一点」继续收窄。`;
    }
    return `根据你的描述，在 YouTube 上收成了一组可试听短名单。\n\n${qHint}\n\n可以继续用自然语言 refine。`;
  }

  // mock
  if (opts.refineCount > 0) {
    return `已按反馈更新（当前为 mock / 降级模式）。配置 YOUTUBE_API_KEY 后将使用真实检索。`;
  }
  return `当前为 **mock / 降级** 短名单。在项目根目录配置 \`YOUTUBE_API_KEY\` 后重启 dev，即可走真源。\n\n获取方式见 docs/youtube-api-setup.md`;
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
  });
  session.constraints = result.constraints;
  session.last_shortlist = result.candidates;
  return session;
}
