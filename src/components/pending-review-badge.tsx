"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";

type Ctx = { count: number; refresh: () => void };

const PendingReviewContext = createContext<Ctx>({
  count: 0,
  refresh: () => {},
});

/**
 * 全站只轮询一次待审/新上架角标，避免 AppRail + UserMenu 各打一遍。
 */
export function PendingReviewProvider({
  children,
  pollMs = 120_000,
}: {
  children: ReactNode;
  pollMs?: number;
}) {
  const { data: session, status } = useSession();
  const [count, setCount] = useState(0);
  const staff =
    session?.user?.role === "owner" || session?.user?.role === "admin";

  const refresh = useCallback(async () => {
    if (!staff) {
      setCount(0);
      return;
    }
    try {
      const res = await fetch("/api/admin/pending-count");
      if (!res.ok) return;
      const data = (await res.json()) as {
        pending?: number;
        badge?: number;
      };
      if (typeof data.badge === "number") setCount(data.badge);
      else if (typeof data.pending === "number") setCount(data.pending);
    } catch {
      /* ignore */
    }
  }, [staff]);

  useEffect(() => {
    if (status !== "authenticated" || !staff) {
      setCount(0);
      return;
    }
    void refresh();
    const t = window.setInterval(() => void refresh(), pollMs);
    return () => window.clearInterval(t);
  }, [status, staff, refresh, pollMs]);

  const value = useMemo(() => ({ count, refresh }), [count, refresh]);

  return (
    <PendingReviewContext.Provider value={value}>
      {children}
    </PendingReviewContext.Provider>
  );
}

/** 读取共享角标数字（须在 PendingReviewProvider 内） */
export function usePendingReviewCount(): number {
  return useContext(PendingReviewContext).count;
}

export function PendingDot({
  count,
  className = "",
}: {
  count: number;
  className?: string;
}) {
  if (count <= 0) return null;
  const label = count > 99 ? "99+" : String(count);
  return (
    <span
      className={[
        "absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-bold leading-none text-black shadow-[0_0_0_2px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
      aria-label={`${count} 条`}
    >
      {label}
    </span>
  );
}
