"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

/**
 * Explore 顶栏：横贯内容区的玻璃搜索框。
 * 写入 URL ?q=，与 filter / sort 共存；防抖后 router.replace。
 */
export function ExploreSearchBar({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 外部 URL 变化时同步（如点筛选后带 q 回来）
  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const commit = useCallback(
    (raw: string) => {
      const q = raw.trim();
      const next = new URLSearchParams(searchParams.toString());
      if (q) next.set("q", q);
      else next.delete("q");
      const qs = next.toString();
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  function onChange(next: string) {
    setValue(next);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next), 280);
  }

  function onClear() {
    setValue("");
    if (timer.current) clearTimeout(timer.current);
    commit("");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (timer.current) clearTimeout(timer.current);
    commit(value);
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <form
      onSubmit={onSubmit}
      className="glass-search relative w-full"
      role="search"
    >
      <label htmlFor="explore-search" className="sr-only">
        搜索专辑
      </label>
      <span
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-white/45 sm:left-4"
        aria-hidden
      >
        <SearchIcon />
      </span>
      <input
        id="explore-search"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder="搜索专辑、艺人、标签…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-search-input w-full rounded-2xl py-3 pl-11 pr-11 text-[15px] text-white outline-none placeholder:text-white/40 sm:py-3.5 sm:pl-12 sm:pr-12 sm:text-base"
      />
      {value ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 touch-manipulation items-center justify-center rounded-full text-white/50 transition hover:bg-white/10 hover:text-white/80"
          aria-label="清除搜索"
        >
          <ClearIcon />
        </button>
      ) : null}
    </form>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="11"
        cy="11"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M16 16.5 20 20.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
