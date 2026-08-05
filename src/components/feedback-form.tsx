"use client";

import { useState } from "react";

const CATEGORIES = [
  { key: "bug", label: "Bug / 问题" },
  { key: "feature", label: "功能建议" },
  { key: "vision", label: "愿景 / 想法" },
  { key: "other", label: "其他" },
] as const;

type Cat = (typeof CATEGORIES)[number]["key"];

export function FeedbackForm() {
  const [category, setCategory] = useState<Cat>("feature");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message,
          contact: contact.trim() || undefined,
          name: name.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean };
      if (!res.ok) throw new Error(data.error || "发送失败");
      setDone(true);
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发送失败");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-5 py-6 text-center sm:px-6">
        <p className="font-display text-base font-semibold text-white">
          已收到，谢谢你
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-white/70">
          反馈会发到站主邮箱。若留了联系方式，有进展时可能会回你。
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className="mt-4 text-sm text-[#ff9fbc] underline-offset-2 hover:underline"
        >
          再写一条
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5 sm:px-6 sm:py-6"
    >
      <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-white/65">
        Feedback
      </p>
      <h2 className="mt-1 font-display text-lg font-semibold text-white">
        写点反馈
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
        Bug、想要的功能、对站点的愿景都可以。提交后会发到站主邮箱。
      </p>

      <fieldset className="mt-4">
        <legend className="sr-only">反馈类型</legend>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCategory(c.key)}
              className={
                category === c.key
                  ? "rounded-full bg-[#ff6b9e]/18 px-3 py-1.5 text-[12px] font-medium text-[#ffc2d6] ring-1 ring-[#ff6b9e]/40"
                  : "rounded-full border border-white/12 px-3 py-1.5 text-[12px] text-white/55 transition hover:border-white/25 hover:text-white/80"
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="mt-4 block">
        <span className="text-[12px] text-white/50">内容 *</span>
        <textarea
          required
          rows={5}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="例如：某页打不开、希望有听单、内测想怎么用这个站…"
          className="mt-1.5 w-full resize-y rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#ff6b9e]/45 focus:ring-2 focus:ring-[#ff6b9e]/15"
        />
      </label>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] text-white/50">怎么称呼（可选）</span>
          <input
            type="text"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="昵称"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#ff6b9e]/45"
          />
        </label>
        <label className="block">
          <span className="text-[12px] text-white/50">联系方式（可选）</span>
          <input
            type="text"
            maxLength={200}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="邮箱或微信"
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#ff6b9e]/45"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-[13px] text-rose-300/95">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={busy || message.trim().length < 8}
        className="glass-btn mt-4 w-full py-2.5 text-sm font-semibold disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {busy ? "发送中…" : "发送反馈"}
      </button>
    </form>
  );
}
