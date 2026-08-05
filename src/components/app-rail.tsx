"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  PendingDot,
  usePendingReviewCount,
} from "@/components/pending-review-badge";

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
  const onExplore =
    path.startsWith("/explore") && !path.startsWith("/explore/today");
  const onToday = path.startsWith("/explore/today");
  const staff =
    session?.user?.role === "owner" || session?.user?.role === "admin";
  const pending = usePendingReviewCount();
  const onAdmin =
    path.startsWith("/admin") ||
    path.startsWith("/moderation") ||
    path.startsWith("/owner");

  return (
    <>
      {/* —— 桌面侧栏 —— */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[96px] flex-col items-center border-r border-white/[0.12] bg-transparent py-5 md:flex">
        <Link
          href="/explore"
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/30 ring-1 ring-inset ring-white/18 transition hover:bg-white/[0.06] hover:ring-white/28"
          title="Waxlist"
          aria-label="Waxlist 首页"
        >
          <Image
            src="/waxlist-mark.png"
            alt=""
            width={30}
            height={30}
            priority
          />
        </Link>

        <nav className="mt-9 flex flex-1 flex-col items-center gap-2.5">
          <Link
            href="/explore"
            title="优质发行"
            className={railIconClass(
              path.startsWith("/explore") || path.startsWith("/favorites"),
            )}
          >
            <DiscIcon />
          </Link>
          <Link
            href="/chat"
            title="Beat Hunter · 找伴奏（Beta）"
            className={railIconClass(onChat)}
          >
            <ChatIcon />
          </Link>
          {staff ? (
            <Link
              href="/admin"
              title={
                pending > 0 ? `后台 · ${pending} 条专辑待审` : "后台"
              }
              className={
                onAdmin
                  ? "relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/40"
                  : "relative flex h-12 w-12 items-center justify-center rounded-2xl text-white/58 transition hover:bg-white/8 hover:text-white/80"
              }
            >
              <ShieldIcon />
              <PendingDot count={pending} />
            </Link>
          ) : null}
          <Link
            href="/about"
            title="关于"
            className={railIconClass(path === "/about", "soft")}
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

      {/* —— 移动端底部 Tab（含 iOS 安全区） —— */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/12 bg-[#050505]/92 backdrop-blur-xl md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="主导航"
      >
        <ul className="mx-auto flex h-[3.4rem] max-w-lg items-stretch justify-around px-1">
          <TabItem
            href="/explore"
            label="发行"
            active={onExplore || path.startsWith("/favorites")}
            icon={<DiscIcon size={20} />}
          />
          <TabItem
            href="/explore/today"
            label="盲盒"
            active={onToday}
            icon={<GiftIcon size={20} />}
          />
          <TabItem
            href="/chat"
            label="找伴奏"
            active={onChat}
            icon={<ChatIcon size={20} />}
          />
          <TabItem
            href="/about"
            label="关于"
            active={path === "/about"}
            icon={
              staff ? (
                <span className="relative inline-flex">
                  <InfoIcon size={20} />
                  <PendingDot count={pending} />
                </span>
              ) : (
                <InfoIcon size={20} />
              )
            }
          />
        </ul>
      </nav>

      {/* 移动端：聊天页悬浮「新会话」 */}
      {showNewChat && onNewChat && onChat ? (
        <button
          type="button"
          onClick={onNewChat}
          className="fixed bottom-[calc(3.4rem+env(safe-area-inset-bottom,0px)+0.75rem)] right-3 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-[#ff6b9e]/90 text-white shadow-[0_8px_28px_-6px_rgba(255,107,158,0.55)] transition active:scale-95 md:hidden"
          title="新会话"
          aria-label="新会话"
        >
          <PlusIcon />
        </button>
      ) : null}
    </>
  );
}

function railIconClass(active: boolean, soft?: "soft") {
  if (active) {
    return soft === "soft"
      ? "flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"
      : "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FF6B9E]/25 to-[#9B51E0]/25 text-white ring-1 ring-[#ff6b9e]/35";
  }
  return "flex h-12 w-12 items-center justify-center rounded-2xl text-white/58 transition hover:bg-white/8 hover:text-white/80";
}

function TabItem({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <li className="min-w-0 flex-1">
      <Link
        href={href}
        className={[
          "flex h-full touch-manipulation flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-none",
          active ? "text-[#ffc2d6]" : "text-white/48 active:text-white/70",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-7 w-7 items-center justify-center rounded-xl transition",
            active
              ? "bg-gradient-to-br from-[#FF6B9E]/28 to-[#9B51E0]/22 text-white ring-1 ring-[#ff6b9e]/40"
              : "text-inherit",
          ].join(" ")}
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

function ChatIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5v-7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function DiscIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function GiftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M3 7h18v3H3V7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M12 7v14M12 7c0-2-1.2-3.5-3-3.5S6 5 6 7M12 7c0-2 1.2-3.5 3-3.5S18 5 18 7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function InfoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
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
function ShieldIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
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
