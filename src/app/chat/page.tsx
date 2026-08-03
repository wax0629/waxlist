"use client";

import { useState } from "react";
import { BeatCard } from "@/components/beat-card";
import { SiteHeader } from "@/components/site-header";
import { MOCK_BEATS } from "@/lib/mock-beats";
import type { BeatCandidate, ChatMessage } from "@/lib/types";

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好，我是 Beat Hunter。描述想要的伴奏气质，或粘贴参考曲链接，我会帮你收成可试听短名单。\n\n（当前为 UI 骨架：发送后返回演示卡片，Agent / YouTube 尚未接入。）",
  created_at: new Date().toISOString(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSend(e?: React.FormEvent | React.KeyboardEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: uid(),
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };

    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, userMsg]);

    // v0.1 骨架：本地 mock；后续替换为 POST /api/chat
    await new Promise((r) => setTimeout(r, 600));
    const candidates: BeatCandidate[] = MOCK_BEATS;
    const assistantMsg: ChatMessage = {
      id: uid(),
      role: "assistant",
      content: "这是演示短名单（mock）。接入 API 后将换成真实 YouTube 结果。",
      created_at: new Date().toISOString(),
      candidates,
    };
    setMessages((prev) => [...prev, assistantMsg]);
    setLoading(false);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0b12] text-zinc-100">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-4 pt-6 md:px-6">
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
          {messages.map((m) => (
            <div
              key={m.id}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-md bg-violet-600/90 px-4 py-2.5 text-sm text-white shadow-lg shadow-violet-900/30"
                    : "max-w-[95%] space-y-3"
                }
              >
                {m.role === "assistant" ? (
                  <>
                    <div className="rounded-2xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap backdrop-blur-md">
                      {m.content}
                    </div>
                    {m.candidates && m.candidates.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {m.candidates.map((b) => (
                          <BeatCard key={b.id} beat={b} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <p className="text-xs text-zinc-500 animate-pulse">正在猎取伴奏…</p>
          )}
        </div>

        <form
          onSubmit={onSend}
          className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-2 shadow-xl shadow-black/40 backdrop-blur-md"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="描述气质，或粘贴参考曲链接…"
              className="min-h-[48px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend(e);
                }
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="mb-1 shrink-0 rounded-xl bg-violet-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              发送
            </button>
          </div>
          <p className="px-3 pb-1 text-[11px] text-zinc-500">
            结果仅供试听参考，商用请以源站授权为准。
          </p>
        </form>
      </main>
    </div>
  );
}
