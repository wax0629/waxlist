"use client";

import { useEffect } from "react";

/**
 * Pause aurora when tab hidden, or on narrow screens that prefer reduced motion /
 * low-end mobile (data saver / coarse pointer + small viewport).
 */
export function AuroraPerf() {
  useEffect(() => {
    const el = document.querySelector(".aurora-bg");
    if (!el) return;

    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqNarrow = window.matchMedia("(max-width: 767px)");

    const sync = () => {
      const pause =
        document.hidden ||
        mqReduce.matches ||
        (mqNarrow.matches &&
          // 粗指针 + 窄屏：弱化持续动画，减发热与掉帧
          window.matchMedia("(pointer: coarse)").matches);
      el.classList.toggle("is-paused", pause);
      el.classList.toggle("is-mobile-lite", mqNarrow.matches);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    mqReduce.addEventListener?.("change", sync);
    mqNarrow.addEventListener?.("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      mqReduce.removeEventListener?.("change", sync);
      mqNarrow.removeEventListener?.("change", sync);
    };
  }, []);

  return null;
}
