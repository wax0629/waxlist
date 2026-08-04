"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { HeartIcon } from "@/components/action-icons";

/** 专辑收藏（红心）→ 我的红心；站主收藏额外「站主爱听」 */
export function DetailHeart({
  releaseId,
  initialFavorited,
  initialOwnerLoved,
  loggedIn,
}: {
  releaseId: string;
  initialFavorited: boolean;
  initialOwnerLoved: boolean;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [ownerLoved, setOwnerLoved] = useState(initialOwnerLoved);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    if (!loggedIn) {
      router.push(`/login?callbackUrl=/explore/${releaseId}`);
      return;
    }
    setBusy(true);
    const next = !favorited;
    setFavorited(next);
    try {
      const res = await fetch(`/api/releases/${releaseId}/favorite`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        favorited?: boolean;
        owner_loved?: boolean;
      };
      if (!res.ok) setFavorited(!next);
      else {
        if (typeof data.favorited === "boolean") setFavorited(data.favorited);
        if (typeof data.owner_loved === "boolean")
          setOwnerLoved(data.owner_loved);
        router.refresh();
      }
    } catch {
      setFavorited(!next);
    } finally {
      setBusy(false);
    }
  }

  // ownerLoved 由站主点收藏后 router.refresh 更新标题旁标签
  void ownerLoved;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        favorited
          ? "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-rose-400/45 bg-rose-500/15 p-0 transition hover:bg-rose-500/25 disabled:opacity-50"
          : "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 p-0 transition hover:border-rose-400/40 hover:bg-rose-500/10 disabled:opacity-50"
      }
      title={favorited ? "取消收藏" : "收藏进我的红心"}
      aria-label={favorited ? "取消收藏" : "收藏"}
    >
      <HeartIcon filled={favorited} />
    </button>
  );
}
