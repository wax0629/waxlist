import { MOCK_BEATS } from "@/lib/mock-beats";
import { createId } from "@/lib/id";
import type { BeatCandidate, Session, SessionConstraints } from "@/lib/types";

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

function mergeConstraints(
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
  if (/r&?b|rnb/.test(lower)) next.style = [...(next.style ?? []), "r&b"];
  if (/trap/.test(lower)) next.style = [...(next.style ?? []), "trap"];
  if (/鼓.*(轻|小|少)|轻一点|别太抢|不要太抢/.test(lower)) {
    next.avoid = [...new Set([...(next.avoid ?? []), "heavy drums"])];
  }

  return next;
}

/** Heuristic mock shortlist until YouTube + LLM are wired. */
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

  // Slight reorder on refine so UI change is visible
  if (turn > 0 && base.length > 1) {
    const [first, ...rest] = base;
    return [...rest, first];
  }
  return base;
}

function tailorReason(base: string, c: SessionConstraints): string {
  const bits: string[] = [base];
  if (c.vocal === "female") bits.push("偏女声友好。");
  if (c.tempo === "slow") bits.push("节奏偏慢热。");
  if (c.tempo === "fast") bits.push("节奏略加快。");
  if (c.avoid?.includes("heavy drums")) bits.push("鼓点尽量靠后。");
  if (c.reference?.url) bits.push("已参考你提供的链接气质。");
  return bits.join(" ");
}

/**
 * Mock agent turn (spec §9 slice 4).
 * Replace body with real tools later; keep same return shape.
 */
export function runMockTurn(
  session: Session,
  message: string,
  refUrl?: string,
): RunTurnResult {
  const warnings: string[] = [];
  const url = refUrl || extractUrl(message);

  if (url && !/youtube\.com|youtu\.be/i.test(url)) {
    warnings.push("非 YouTube 链接已作补充描述处理（v0.1 仅深解析 YouTube）。");
  }

  const constraints = mergeConstraints(session.constraints, message, url);
  const refineCount = session.messages.filter((m) => m.role === "user").length;
  const candidates = buildMockCandidates(constraints, refineCount);

  let assistant_message =
    "根据你的描述，先给你一组可试听短名单（当前为 **mock 演示**，稍后将换成 YouTube 真源）。可以继续说「再快一点」「鼓轻一点」来收窄。";

  if (url) {
    assistant_message = `已记下参考链接。\n\n${assistant_message}`;
  }
  if (refineCount > 0) {
    assistant_message = `已按你的反馈更新约束，重新整理了短名单。\n\n可以说得更具体，我会继续 refine。`;
  }

  return {
    assistant_message,
    candidates,
    status: "ok",
    warnings,
    constraints,
  };
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
