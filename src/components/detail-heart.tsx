"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm transition hover:border-white/35"
      title={favorited ? "取消红心" : "加入我的红心"}
    >
      <span className={favorited ? "text-rose-400" : "text-white/45"}>
        {favorited ? "♥" : "♡"}
      </span>
      <span className="text-white/70">
        {favorited ? "已在红心" : "红心"}
      </span>
      {ownerLoved ? (
        <span className="ml-1 text-[10px] text-rose-300/90">· 站主爱听</span>
      ) : null}
    </button>
  );
}
