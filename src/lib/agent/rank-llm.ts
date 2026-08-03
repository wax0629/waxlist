import { chatText, hasLlmKey } from "@/lib/llm";
import type { BeatCandidate, SearchIntent } from "@/lib/types";

/**
 * Optional LLM pass: rewrite reasons for top candidates (ids must stay fixed).
 */
export async function refineReasonsWithLlm(
  candidates: BeatCandidate[],
  intent: SearchIntent,
  intentSummary: string,
): Promise<{ candidates: BeatCandidate[]; usedLlm: boolean; warning?: string }> {
  if (!hasLlmKey() || candidates.length === 0) {
    return { candidates, usedLlm: false };
  }

  const catalog = candidates.map((c, i) => ({
    index: i,
    id: c.id,
    title: c.title,
    channel: c.channel_title ?? "",
  }));

  const prompt = `你是伴奏推荐文案助手。根据用户需求，为每条结果写一句中文推荐理由（不超过40字），点名与需求的匹配点。
只返回 JSON 数组：[{"id":"...","reason":"..."}]，id 必须来自输入，不要编造新 id。

用户理解：${intentSummary}
结构化需求：${JSON.stringify({
    style: intent.style,
    tempo: intent.tempo,
    vocal: intent.vocal,
    avoid: intent.avoid,
    mood: intent.mood,
  })}

候选：
${JSON.stringify(catalog, null, 0)}`;

  try {
    const raw = await chatText({
      messages: [
        {
          role: "system",
          content: "只输出合法 JSON 数组，不要 markdown 代码块。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const jsonText = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(jsonText) as Array<{ id?: string; reason?: string }>;
    const map = new Map(
      parsed
        .filter((p) => p.id && p.reason)
        .map((p) => [p.id as string, String(p.reason).slice(0, 120)]),
    );

    const next = candidates.map((c) => ({
      ...c,
      reason: map.get(c.id) || c.reason,
    }));
    return { candidates: next, usedLlm: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "llm rank failed";
    return {
      candidates,
      usedLlm: false,
      warning: `LLM 精排跳过：${msg.slice(0, 80)}`,
    };
  }
}
