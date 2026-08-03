"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppRail({
  onNewChat,
  showNewChat,
}: {
  onNewChat?: () => void;
  showNewChat?: boolean;
}) {
  const path = usePathname();
  const onChat = path === "/chat" || path === "/";

  return (
    <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-[var(--line)] bg-[var(--ink-2)]/80 py-4 md:flex">
      <Link
        href="/chat"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ink-elevated)] font-display text-[13px] font-bold text-[var(--gold-soft)] shadow-[0_0_0_1px_rgba(212,165,116,0.28),0_12px_28px_-12px_rgba(212,165,116,0.5)]"
        title="Beat Hunter"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[rgba(232,201,168,0.22)] to-transparent" />
        <span className="relative">BH</span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
        <Link
          href="/chat"
          title="找伴奏"
          className={
            onChat
              ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold)] ring-1 ring-[rgba(212,165,116,0.35)]"
              : "flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--cream-faint)] transition hover:bg-white/[0.04] hover:text-[var(--cream-soft)]"
          }
        >
          <ChatIcon />
        </Link>
        <span
          title="地下精选 · 稍后"
          className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-2xl text-[var(--cream-faint)]/40"
        >
          <DiscIcon />
        </span>
        <Link
          href="/about"
          title="关于"
          className={
            path === "/about"
              ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold)] ring-1 ring-[rgba(212,165,116,0.35)]"
              : "flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--cream-faint)] transition hover:bg-white/[0.04] hover:text-[var(--cream-soft)]"
          }
        >
          <InfoIcon />
        </Link>
      </nav>

      {showNewChat && onNewChat ? (
        <button
          type="button"
          onClick={onNewChat}
          title="新会话"
          className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--line-strong)] text-[var(--cream-muted)] transition hover:border-[rgba(212,165,116,0.35)] hover:text-[var(--gold)]"
        >
          <PlusIcon />
        </button>
      ) : null}
    </aside>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DiscIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 10.5v5M12 8h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
