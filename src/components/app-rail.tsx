"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export function AppRail({
  onNewChat,
  showNewChat,
}: {
  onNewChat?: () => void;
  showNewChat?: boolean;
}) {
  const path = usePathname();
  const { data: session } = useSession();
  const onChat = path === "/chat" || path === "/";
  const staff =
    session?.user?.role === "owner" || session?.user?.role === "admin";

  return (
    <>
      {/* 固定不随页面滚动；旁侧占位避免主内容被遮挡 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[96px] flex-col items-center border-r border-white/[0.12] bg-transparent py-5 md:flex">
        <Link
          href="/explore"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9E] to-[#9B51E0] text-[12px] font-bold tracking-tight text-white shadow-[0_8px_24px_-6px_rgba(155,81,224,0.55)]"
          title="Waxlist"
        >
          WX
        </Link>

        <nav className="mt-9 flex flex-1 flex-col items-center gap-2.5">
          <Link
            href="/explore"
            title="优质发行"
            className={
              path.startsWith("/explore") || path.startsWith("/favorites")
                ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9E]/25 to-[#9B51E0]/25 text-white ring-1 ring-[#ff6b9e]/35"
                : "flex h-12 w-12 items-center justify-center rounded-2xl text-white/58 transition hover:bg-white/8 hover:text-white/80"
            }
          >
            <DiscIcon />
          </Link>
          <Link
            href="/chat"
            title="Beat Hunter · 找伴奏"
            className={
              onChat
                ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9E]/25 to-[#9B51E0]/25 text-white ring-1 ring-[#ff6b9e]/35"
                : "flex h-12 w-12 items-center justify-center rounded-2xl text-white/58 transition hover:bg-white/8 hover:text-white/80"
            }
          >
            <ChatIcon />
          </Link>
          {staff ? (
            <Link
              href="/moderation"
              title="审核队列"
              className={
                path.startsWith("/moderation")
                  ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40"
                  : "flex h-12 w-12 items-center justify-center rounded-2xl text-white/58 transition hover:bg-white/8 hover:text-white/80"
              }
            >
              <ShieldIcon />
            </Link>
          ) : null}
          <Link
            href="/about"
            title="关于"
            className={
              path === "/about"
                ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"
                : "flex h-12 w-12 items-center justify-center rounded-2xl text-white/58 transition hover:bg-white/8 hover:text-white/80"
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
            className="mt-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/18 bg-white/5 text-white/72 transition hover:bg-white/10 hover:text-white"
          >
            <PlusIcon />
          </button>
        ) : null}
      </aside>
      <div className="hidden w-[96px] shrink-0 md:block" aria-hidden />
    </>
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
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 5.5 6v5.2c0 4.1 2.7 7.2 6.5 8.8 3.8-1.6 6.5-4.7 6.5-8.8V6L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 12.2 11.2 14l3.5-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

