"use client";

import { useEffect } from "react";

/**
 * Pause aurora CSS animations when the browser tab is hidden.
 * No change to how the page looks while you are looking at it.
 */
export function AuroraPerf() {
  useEffect(() => {
    const el = document.querySelector(".aurora-bg");
    if (!el) return;

    const sync = () => {
      el.classList.toggle("is-paused", document.hidden);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  return null;
}
