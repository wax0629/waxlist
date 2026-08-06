import Link from "next/link";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";

const NAV: { href: string; label: string; ownerOnly?: boolean }[] = [
  { href: "/admin", label: "概览" },
  { href: "/moderation", label: "内容管理" },
  { href: "/admin/categories", label: "分类维护" },
  { href: "/admin/users", label: "账号与角色", ownerOnly: true },
];

export function AdminShell({
  title,
  subtitle,
  isOwner,
  active,
  children,
  pending,
}: {
  title: string;
  subtitle?: string;
  isOwner: boolean;
  active: "overview" | "moderation" | "categories" | "users";
  children: React.ReactNode;
  pending?: number;
}) {
  const items = NAV.filter((n) => !n.ownerOnly || isOwner);

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="w-full min-w-0 flex-1 px-3 pt-5 pb-4 sm:px-6 sm:pt-8 md:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-6">
            <BackLink href="/explore" label="返回优质发行" />
          </div>

          <header className="flex flex-wrap items-end justify-between gap-4 pr-12 sm:pr-14">
            <div className="min-w-0 max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
                Admin
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {typeof pending === "number" && pending > 0 ? (
              <Link
                href="/moderation"
                className="rounded-full border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/25"
              >
                {pending} 条专辑待审 →
              </Link>
            ) : null}
          </header>

          <div
            className="mt-6 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.12) 8%, rgba(230,242,255,0.4) 50%, rgba(200,225,255,0.12) 92%, transparent 100%)",
            }}
            aria-hidden
          />

          <nav
            className="mt-6 flex flex-wrap gap-2"
            aria-label="后台导航"
          >
            {items.map((item) => {
              const isActive =
                (active === "overview" && item.href === "/admin") ||
                (active === "moderation" && item.href === "/moderation") ||
                (active === "categories" && item.href === "/admin/categories") ||
                (active === "users" && item.href === "/admin/users");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    isActive
                      ? "rounded-full bg-white/12 px-3.5 py-1.5 text-[13px] font-medium text-white ring-1 ring-white/20"
                      : "rounded-full border border-white/12 px-3.5 py-1.5 text-[13px] text-white/55 transition hover:border-white/25 hover:text-white/80"
                  }
                >
                  {item.label}
                  {item.href === "/moderation" &&
                  typeof pending === "number" &&
                  pending > 0 ? (
                    <span className="ml-1.5 tabular-nums text-amber-200/90">
                      {pending}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
