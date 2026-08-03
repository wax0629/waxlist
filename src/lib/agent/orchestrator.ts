import type { Session, SessionConstraints } from "@/lib/types";
import {
  chatWithTools,
  hasLlmKey,
  type LlmMessage,
} from "@/lib/llm";
import { hitsToCandidates } from "@/lib/youtube";
import { planQueries } from "./plan-queries";
import { AGENT_TOOLS, executeTool, type ToolContext } from "./tools";
import {
  appendTurn,
  mergeConstraints,
  runHeuristicTurn,
  type RunTurnResult,
} from "./run-turn";

const MAX_TOOL_ROUNDS = 6;

const SYSTEM_PROMPT = `你是 Beat Hunter，帮歌手找「可试听伴奏 / type beat / instrumental」的助手。

规则：
1. 只用工具完成任务：有参考链接先 parse_reference；再 search_youtube（1～3 次不同 query）；最后必须调用 finalize_shortlist。
2. 检索词优先英文，包含 type beat 或 instrumental；结合用户中文需求（女声、慢热、鼓轻等）。
3. finalize_shortlist 的 video_id 必须来自本轮 search_youtube 返回的结果；给 3～5 条；reason 用简短中文。
4. 不要推荐专辑合集作为主交付；不要编造不存在的链接。
5. assistant_message 简洁中文，可提示用户如何 refine。
6. 信息不足时仍先给短名单，最多在文案里提一个问题，不要只追问不给结果。`;

/**
 * Thin tool-calling loop. Falls back to heuristic YouTube path if no LLM or agent fails.
 */
export async function runAgentTurn(
  session: Session,
  message: string,
  refUrl?: string,
): Promise<RunTurnResult> {
  const urlMatch = message.match(/https?:\/\/[^\s]+/i);
  const url = refUrl || urlMatch?.[0]?.replace(/[),.;]+$/, "");
  const constraints = mergeConstraints(session.constraints, message, url);
  const refineCount = session.messages.filter((m) => m.role === "user").length;

  if (!hasLlmKey()) {
    const result = await runHeuristicTurn(session, message, refUrl);
    result.warnings = [
      ...(result.warnings ?? []),
      "未配置 LLM（XAI_API_KEY），使用规则编排。",
    ];
    return result;
  }

  try {
    return await runToolLoop(session, message, constraints, refineCount, url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "agent failed";
    const fallback = await runHeuristicTurn(session, message, refUrl);
    fallback.warnings = [
      ...(fallback.warnings ?? []),
      `Agent 降级：${msg}`,
    ];
    if (fallback.status === "ok") fallback.status = "degraded";
    return fallback;
  }
}

async function runToolLoop(
  session: Session,
  message: string,
  constraints: SessionConstraints,
  refineCount: number,
  refUrl?: string,
): Promise<RunTurnResult> {
  const warnings: string[] = [];
  const ctx: ToolContext = { hitIndex: new Map() };

  const historySnippet = session.messages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
    .join("\n");

  const userBlock = [
    `用户本轮：${message}`,
    refUrl ? `显式 ref_url：${refUrl}` : "",
    `已累计约束 JSON：${JSON.stringify(constraints)}`,
    refineCount > 0 ? `这是 refine 第 ${refineCount + 1} 轮用户输入（含本轮前）。` : "首轮或新会话。",
    historySnippet ? `最近对话：\n${historySnippet}` : "",
    `建议检索方向（可改）：${planQueries(constraints).join(" | ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const messages: LlmMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userBlock },
  ];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const { message: assistantMsg } = await chatWithTools({
      messages,
      tools: AGENT_TOOLS,
      tool_choice: "auto",
    });

    messages.push({
      role: "assistant",
      content: assistantMsg.content ?? null,
      tool_calls: assistantMsg.tool_calls,
    });

    const calls = assistantMsg.tool_calls;
    if (!calls?.length) {
      // Model tried to answer in text only — force finalize if we have hits
      if (ctx.hitIndex.size > 0 && !ctx.finalized) {
        warnings.push("模型未调用 finalize，已用检索结果自动收成短名单。");
        break;
      }
      warnings.push("模型未调用工具，降级规则路径。");
      throw new Error("no tool calls");
    }

    for (const call of calls) {
      const name = call.function.name;
      const result = await executeTool(name, call.function.arguments, ctx);
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name,
        content: result,
      });
    }

    if (ctx.finalized && ctx.finalized.candidates.length > 0) {
      return {
        assistant_message: ctx.finalized.assistant_message,
        candidates: ctx.finalized.candidates,
        status: "ok",
        warnings,
        constraints,
      };
    }
  }

  // Exhausted rounds but have hits
  if (ctx.hitIndex.size > 0) {
    const candidates = hitsToCandidates(
      [...ctx.hitIndex.values()],
      (h) => `与需求相关的可试听结果：${h.title.slice(0, 48)}`,
      5,
    );
    return {
      assistant_message:
        "已根据检索结果整理短名单（自动收束）。可以说「再慢一点」继续 refine。",
      candidates,
      status: warnings.length ? "degraded" : "ok",
      warnings,
      constraints,
    };
  }

  throw new Error("agent produced no candidates");
}

export { appendTurn };
