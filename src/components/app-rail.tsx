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
    <aside className="glass-panel hidden w-[72px] shrink-0 flex-col items-center rounded-none border-y-0 border-l-0 py-4 md:flex">
      <Link
        href="/chat"
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl font-display text-[13px] font-bold text-[#1a1020] shadow-[0_0_24px_-4px_rgba(224,122,138,0.55)]"
        title="Beat Hunter"
      >
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ffe8c8] via-[#f0b27a] to-[#e07a8a]" />
        <span className="relative">BH</span>
      </Link>

      <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
        <Link
          href="/chat"
          title="找伴奏"
          className={
            onChat
              ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold-soft)] ring-1 ring-[rgba(240,178,122,0.4)] shadow-[0_0_20px_-6px_rgba(224,122,138,0.55)]"
              : "flex h-11 w-11 items-center justify-center rounded-2xl text-white/40 transition hover:bg-white/8 hover:text-white/80"
          }
        >
          <ChatIcon />
        </Link>
        <span
          title="地下精选 · 稍后"
          className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-2xl text-white/20"
        >
          <DiscIcon />
        </span>
        <Link
          href="/about"
          title="关于"
          className={
            path === "/about"
              ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--gold-dim)] text-[var(--gold-soft)] ring-1 ring-[rgba(240,178,122,0.4)]"
              : "flex h-11 w-11 items-center justify-center rounded-2xl text-white/40 transition hover:bg-white/8 hover:text-white/80"
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
          className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/55 transition hover:border-[rgba(240,178,122,0.35)] hover:bg-white/10 hover:text-[var(--gold-soft)]"
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
