"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePendingReviewCount } from "@/components/pending-review-badge";

function roleLabel(role?: string | null): string {
  if (role === "owner") return "站主";
  if (role === "admin") return "管理";
  return "用户";
}

/** Initials for avatar circle (1–2 chars). */
function avatarText(name?: string | null, email?: string | null): string {
  const n = name?.trim();
  if (n) {
    // CJK: first char; Latin: first 1–2 letters
    if (/[\u4e00-\u9fff]/.test(n[0] ?? "")) return n[0]!;
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  }
  if (email) return email[0]!.toUpperCase();
  return "?";
}

/**
 * Top-right circular account control.
 * Guest: circle → 登录. Signed-in: avatar → dropdown (资料、红心、审核、退出).
 */
export function UserMenu() {
  const { data: session, status } = useSession();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // 必须在任何 early return 之前调用（Rules of Hooks）
  const pending = usePendingReviewCount();

  // Hide on auth screens
  const hideOnAuth =
    path === "/login" || path === "/register" || path.startsWith("/login/");

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  if (hideOnAuth) return null;

  if (status === "loading") {
    return (
      <div
        className="h-10 w-10 animate-pulse rounded-full bg-white/10 ring-1 ring-white/15"
        aria-hidden
      />
    );
  }

  if (!session?.user) {
    return (
      <Link
        href={`/login?callbackUrl=${encodeURIComponent(path || "/explore")}`}
        title="登录"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white/70 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.45)] transition hover:border-white/35 hover:bg-white/10 hover:text-white"
      >
        <UserGlyph />
      </Link>
    );
  }

  const label =
    session.user.name ||
    session.user.email ||
    session.user.phone ||
    "已登录";
  const staff =
    session.user.role === "owner" || session.user.role === "admin";
  const initials = avatarText(session.user.name, session.user.email);

  async function logout() {
    setBusy(true);
    try {
      await signOut({ callbackUrl: "/explore" });
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={
          open
            ? "flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9E] to-[#9B51E0] text-sm font-semibold text-white ring-2 ring-white/35"
            : "flex h-10 w-10 touch-manipulation items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B9E] to-[#9B51E0] text-sm font-semibold text-white ring-1 ring-white/25 transition hover:ring-white/45"
        }
      >
        {initials}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-white/20 bg-[#141414]/98 py-1 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.65)] backdrop-blur-xl"
        >
          <div className="border-b border-white/18 px-3 py-3">
            <p className="truncate text-sm font-medium text-white">{label}</p>
            <p className="mt-0.5 truncate text-xs text-white/62">
              {roleLabel(session.user.role)}
              {session.user.email ? ` · ${session.user.email}` : null}
            </p>
          </div>

          <MenuLink
            href="/explore?filter=heart"
            onNavigate={() => setOpen(false)}
          >
            ♥ 我的红心
          </MenuLink>
          <MenuLink href="/explore/submit" onNavigate={() => setOpen(false)}>
            推荐专辑
          </MenuLink>
          {staff ? (
            <>
              <MenuLink href="/admin" onNavigate={() => setOpen(false)}>
                后台
                {pending > 0 ? (
                  <span className="ml-auto rounded-full bg-amber-400/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                    {pending > 99 ? "99+" : pending}
                  </span>
                ) : null}
              </MenuLink>
              <MenuLink href="/moderation" onNavigate={() => setOpen(false)}>
                内容管理
                {pending > 0 ? (
                  <span className="ml-1.5 text-[11px] text-amber-200/90">
                    {pending}
                  </span>
                ) : null}
              </MenuLink>
            </>
          ) : null}

          <div className="my-1 border-t border-white/18" />

          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => void logout()}
            className="flex w-full items-center px-3 py-2.5 text-left text-sm text-rose-200/90 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            {busy ? "退出中…" : "退出登录"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Fixed top-right shell site-wide.
 * Explore 顶栏已内嵌 UserMenu（搜索右侧），此处隐藏避免重复。
 */
export function UserAccountCorner() {
  const path = usePathname();
  if (
    path === "/explore" ||
    path.startsWith("/explore/") ||
    path.startsWith("/favorites")
  ) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-3 z-[60] isolate sm:right-5"
      style={{
        top: "max(0.75rem, env(safe-area-inset-top, 0px))",
      }}
    >
      <div className="pointer-events-auto">
        <UserMenu />
      </div>
    </div>
  );
}

function MenuLink({
  href,
  children,
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onNavigate}
      className="flex w-full items-center gap-2 px-3 py-3 text-sm text-white/80 transition hover:bg-white/[0.06] hover:text-white active:bg-white/[0.08] sm:py-2.5"
    >
      {children}
    </Link>
  );
}

function UserGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M6 18.5c1.2-2.4 3.3-3.5 6-3.5s4.8 1.1 6 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
