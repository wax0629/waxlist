import { chatText, hasLlmKey } from "@/lib/llm";
import { logEvent } from "@/lib/logger";
import type { SearchIntent } from "@/lib/types";
import { planQueries } from "./plan-queries";

export type QueryPlanSource = "rule" | "llm";

export interface QueryPlanResult {
  queries: string[];
  source: QueryPlanSource;
  /** optional Chinese one-liner from model (not required by UI yet) */
  understood?: string;
  warning?: string;
}

const BEAT_SIGNAL =
  /\b(type\s*beat|instrumental|beat\b|free\s*for\s*profit)\b/i;

/**
 * When to call LLM for open-ended Chinese / vibe queries.
 * Keep pure English + full slots on the fast rule path.
 */
export function shouldUseLlmQueryPlan(intent: SearchIntent): boolean {
  if (!hasLlmKey()) return false;

  const text = intent.free_text ?? "";
  const hasCjk = /[\u4e00-\u9fff]/.test(text);
  const sparse =
    !(intent.style?.length) &&
    !(intent.artist_refs?.length) &&
    !intent.reference?.title;
  const vibeLike =
    /感觉|气质|氛围|像|那种|有点|比较|适合唱|参考|风格像|听感/.test(text);

  // Strong structured English-only request → rules are enough
  const strongEnglishStyle =
    !hasCjk &&
    Boolean(intent.style?.length) &&
    text.length < 80 &&
    !vibeLike;

  if (strongEnglishStyle) return false;
  return hasCjk || sparse || vibeLike;
}

/** Hard constraints that must appear in search queries when present. */
export function hardConstraintTokens(intent: SearchIntent): string[] {
  const bits: string[] = [];
  if (intent.tempo === "slow") bits.push("slow", "chill");
  if (intent.tempo === "fast") bits.push("uptempo");
  if (intent.tempo === "mid") bits.push("mid tempo");
  if (intent.vocal === "female") bits.push("female vocal");
  if (intent.vocal === "male") bits.push("male vocal");
  if (intent.avoid?.includes("heavy drums")) bits.push("soft drums");
  if (intent.avoid?.includes("heavy 808")) bits.push("soft 808");
  for (const s of intent.style ?? []) {
    const en = s === "r&b" ? "rnb" : s;
    bits.push(en);
  }
  for (const m of intent.mood ?? []) bits.push(m);
  for (const a of intent.artist_refs ?? []) {
    for (const t of (a.style_en ?? []).slice(0, 2)) bits.push(t);
  }
  // unique, keep order
  const seen = new Set<string>();
  const out: string[] = [];
  for (const b of bits) {
    const k = b.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(b);
  }
  return out;
}

function ensureBeatSuffix(q: string): string {
  const cleaned = q.replace(/\s+/g, " ").trim();
  if (!cleaned) return "type beat instrumental";
  if (BEAT_SIGNAL.test(cleaned)) return cleaned;
  return `${cleaned} type beat`;
}

/**
 * Merge missing hard-constraint tokens into a query string.
 * Prefer injecting into first query more aggressively.
 */
export function injectHardConstraints(
  query: string,
  intent: SearchIntent,
  opts?: { aggressive?: boolean },
): string {
  const q = query.toLowerCase();
  const missing: string[] = [];
  const tokens = hardConstraintTokens(intent);

  for (const t of tokens) {
    const tl = t.toLowerCase();
    // skip multi-word style if any word already present loosely
    if (q.includes(tl)) continue;
    // for "female vocal" require both or the phrase
    if (tl.includes(" ") && tl.split(" ").every((w) => q.includes(w))) continue;
    missing.push(t);
  }

  // aggressive: all missing; mild: only critical (tempo/vocal/drums)
  let toAdd = missing;
  if (!opts?.aggressive) {
    const critical = new Set(
      [
        intent.tempo === "slow" ? "slow" : "",
        intent.tempo === "slow" ? "chill" : "",
        intent.tempo === "fast" ? "uptempo" : "",
        intent.vocal === "female" ? "female vocal" : "",
        intent.vocal === "male" ? "male vocal" : "",
        intent.avoid?.includes("heavy drums") ? "soft drums" : "",
      ].filter(Boolean),
    );
    toAdd = missing.filter((m) => critical.has(m.toLowerCase()) || critical.has(m));
    // always try to keep at least one style token if any style set
    if (intent.style?.length) {
      const styleTok = intent.style[0] === "r&b" ? "rnb" : intent.style[0];
      if (
        !q.includes(styleTok.toLowerCase()) &&
        !toAdd.some((x) => x.toLowerCase() === styleTok.toLowerCase())
      ) {
        toAdd = [styleTok, ...toAdd];
      }
    }
  }

  // avoid stuffing too many tokens
  toAdd = toAdd.slice(0, opts?.aggressive ? 6 : 4);
  const merged = ensureBeatSuffix(
    [query, ...toAdd].filter(Boolean).join(" ").replace(/\s+/g, " ").trim(),
  );
  return merged.toLowerCase();
}

function stripJsonFence(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseLlmQueries(raw: string): { queries: string[]; understood?: string } {
  const text = stripJsonFence(raw);
  const parsed = JSON.parse(text) as {
    queries?: unknown;
    understood?: unknown;
  };
  const list = Array.isArray(parsed.queries) ? parsed.queries : [];
  const queries = list
    .map((q) => String(q ?? "").trim())
    .filter((q) => q.length > 2 && q.length < 120);
  const understood =
    typeof parsed.understood === "string"
      ? parsed.understood.slice(0, 120)
      : undefined;
  return { queries, understood };
}

async function callLlmPlanQueries(
  intent: SearchIntent,
): Promise<{ queries: string[]; understood?: string }> {
  const hard = hardConstraintTokens(intent);
  const artistHint = (intent.artist_refs ?? [])
    .map((a) => `${a.name_zh}→${(a.style_en ?? []).join(",")}`)
    .join("; ");

  const system = `你是 YouTube type beat / instrumental 检索专家。用户多为中文说唱歌手。
任务：根据用户原话与已抽取约束，写 3～4 条英文搜索词（queries），像制作人会在 YouTube 搜的。
硬性要求：
1) 每条必须是英文（可含 c-pop、chinese trap 等场景标签）
2) 每条必须偏伴奏：含 type beat 或 instrumental
3) 不要用中文名/歌手名当主关键词（可把其风格变成英文标签）
4) 不要 tutorial / lyrics / live / official mv 向
5) 必须尊重 hard_constraints 列表中的词义（速度、人声、鼓、风格）
只输出 JSON：{"queries":["..."],"understood":"一句中文理解"}`;

  const user = JSON.stringify(
    {
      user_text: intent.free_text ?? "",
      hard_constraints: hard,
      structured: {
        style: intent.style,
        tempo: intent.tempo,
        vocal: intent.vocal,
        mood: intent.mood,
        avoid: intent.avoid,
        artist_bridge: artistHint || undefined,
        reference_title: intent.reference?.title,
      },
    },
    null,
    0,
  );

  const raw = await chatText({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.35,
    max_tokens: 400,
  });

  return parseLlmQueries(raw);
}

function dedupeQueries(list: string[], max = 4): string[] {
  const out: string[] = [];
  for (const q of list) {
    const n = q.replace(/\s+/g, " ").trim().toLowerCase();
    if (!n) continue;
    if (out.some((e) => e === n || tooSimilar(e, n))) continue;
    out.push(n);
    if (out.length >= max) break;
  }
  return out;
}

function tooSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  const ta = new Set(a.split(" ").filter(Boolean));
  const tb = new Set(b.split(" ").filter(Boolean));
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter++;
  const union = ta.size + tb.size - inter || 1;
  return inter / union >= 0.78;
}

/**
 * Smart query plan: LLM when open-ended Chinese/vibe; always rule fallback.
 */
export async function planQueriesSmart(
  intent: SearchIntent,
): Promise<QueryPlanResult> {
  const ruleQueries = planQueries(intent);

  if (!shouldUseLlmQueryPlan(intent)) {
    return { queries: ruleQueries, source: "rule" };
  }

  try {
    const { queries: llmRaw, understood } = await callLlmPlanQueries(intent);
    if (!llmRaw.length) {
      return {
        queries: ruleQueries,
        source: "rule",
        warning: "LLM 未返回检索词，已用规则",
      };
    }

    // Inject hard constraints: first query aggressive, rest mild
    const merged = llmRaw.map((q, i) =>
      injectHardConstraints(q, intent, { aggressive: i === 0 }),
    );
    let queries = dedupeQueries(merged, 4);

    // Ensure critical tokens appear in at least one query
    const criticalCheck = hardConstraintTokens(intent).slice(0, 4);
    for (const tok of criticalCheck) {
      const tl = tok.toLowerCase();
      if (queries.some((q) => q.includes(tl))) continue;
      if (queries[0]) {
        queries[0] = injectHardConstraints(queries[0], intent, {
          aggressive: true,
        });
      }
      break;
    }

    queries = dedupeQueries(queries, 4);
    if (queries.length < 2) {
      // blend rule queries
      queries = dedupeQueries([...queries, ...ruleQueries], 4);
    }

    if (queries.length < 2) {
      return {
        queries: ruleQueries,
        source: "rule",
        warning: "LLM 检索词过少，已用规则",
      };
    }

    logEvent("query_plan_llm", {
      source: "llm",
      user: (intent.free_text ?? "").slice(0, 80),
      styles: intent.style,
      queries,
    });

    return { queries, source: "llm", understood };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "llm plan failed";
    logEvent(
      "query_plan_llm_fallback",
      { error: msg.slice(0, 120), styles: intent.style },
      "warn",
    );
    return {
      queries: ruleQueries,
      source: "rule",
      warning: `LLM 检索词跳过：${msg.slice(0, 80)}`,
    };
  }
}
