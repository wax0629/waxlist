export function hasLlmKey(): boolean {
  return Boolean(
    process.env.XAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim(),
  );
}

function llmConfig() {
  const xai = process.env.XAI_API_KEY?.trim();
  const openai = process.env.OPENAI_API_KEY?.trim();
  const apiKey = xai || openai || "";
  const baseURL = (
    process.env.LLM_BASE_URL?.trim() ||
    (xai ? "https://api.x.ai/v1" : "https://api.openai.com/v1")
  ).replace(/\/$/, "");
  const model =
    process.env.LLM_MODEL?.trim() || (xai ? "grok-3-mini" : "gpt-4o-mini");
  return { apiKey, baseURL, model };
}

export type LlmRole = "system" | "user" | "assistant" | "tool";

export interface LlmMessage {
  role: LlmRole;
  content?: string | null;
  tool_calls?: LlmToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface LlmToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

export interface LlmToolDef {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface LlmChatResult {
  message: LlmMessage;
  finish_reason?: string;
}

/** Plain chat completion (no tools) — for rank/reason. */
export async function chatText(opts: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  max_tokens?: number;
}): Promise<string> {
  const { apiKey, baseURL, model } = llmConfig();
  if (!apiKey) {
    throw new Error("未配置 XAI_API_KEY / OPENAI_API_KEY");
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      temperature: opts.temperature ?? 0.3,
      max_tokens: opts.max_tokens ?? 800,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error (${res.status}): ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

export async function chatWithTools(opts: {
  messages: LlmMessage[];
  tools: LlmToolDef[];
  tool_choice?: "auto" | "none" | { type: "function"; function: { name: string } };
  temperature?: number;
}): Promise<LlmChatResult> {
  const { apiKey, baseURL, model } = llmConfig();
  if (!apiKey) {
    throw new Error("未配置 XAI_API_KEY / OPENAI_API_KEY");
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: opts.messages,
      tools: opts.tools,
      tool_choice: opts.tool_choice ?? "auto",
      temperature: opts.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM error (${res.status}): ${text.slice(0, 400)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{
      message?: LlmMessage;
      finish_reason?: string;
    }>;
  };

  const choice = data.choices?.[0];
  if (!choice?.message) {
    throw new Error("LLM 返回空 choices");
  }

  return {
    message: choice.message,
    finish_reason: choice.finish_reason,
  };
}
