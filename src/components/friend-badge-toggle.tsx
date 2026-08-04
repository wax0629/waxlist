"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { hasFriendTag } from "@/lib/releases/friend-tag";

/**
 * Owner-only: click pink「友情」to toggle.
 * Appearance matches the public badge when on; dim outline when off.
 */
export function FriendBadgeToggle({
  releaseId,
  tags,
}: {
  releaseId: string;
  tags: string[];
}) {
  const router = useRouter();
  const [on, setOn] = useState(hasFriendTag(tags));
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const next = !on;
    setOn(next);
    try {
      const res = await fetch(`/api/releases/${releaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friend: next }),
      });
      if (!res.ok) {
        setOn(!next);
        const data = (await res.json()) as { error?: string };
        console.error(data.error);
      } else {
        router.refresh();
      }
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      className={
        on
          ? "rounded-full border border-pink-200/50 bg-gradient-to-r from-[#ff6b9e] via-[#ff8fb3] to-[#f0abfc] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow-[0_4px_12px_-2px_rgba(255,107,158,0.5)] transition hover:brightness-110 disabled:opacity-60"
          : "rounded-full border border-dashed border-pink-300/40 bg-black/25 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-pink-100/55 backdrop-blur-sm transition hover:border-pink-300/60 hover:text-pink-50 disabled:opacity-60"
      }
      title={on ? "点击取消友情" : "点击挂上友情"}
      aria-pressed={on}
      aria-label="友情"
    >
      友情
    </button>
  );
}
