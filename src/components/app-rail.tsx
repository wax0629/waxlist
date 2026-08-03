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
    <aside className="hidden w-[72px] shrink-0 flex-col items-center border-r border-white/[0.05] bg-transparent py-4 md:flex">
      <Link
        href="/chat"
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9E] to-[#9B51E0] text-[13px] font-bold tracking-tight text-white shadow-[0_8px_24px_-6px_rgba(155,81,224,0.55)]"
        title="Beat Hunter"
      >
        BH
      </Link>

      <nav className="mt-8 flex flex-1 flex-col items-center gap-2">
        <Link
          href="/chat"
          title="找伴奏"
          className={
            onChat
              ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9E]/25 to-[#9B51E0]/25 text-white ring-1 ring-[#ff6b9e]/35"
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
              ? "flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"
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
          className="mb-1 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
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
