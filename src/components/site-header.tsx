import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--ink)_78%,transparent)] backdrop-blur-2xl">
      <div className="mx-auto flex h-15 w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/explore" className="group flex items-center gap-3">
          <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-[var(--ink-elevated)] font-display text-[12px] font-bold tracking-tight text-[var(--gold-soft)] shadow-[0_0_0_1px_rgba(212,165,116,0.25),0_10px_28px_-10px_rgba(212,165,116,0.45)]">
            <span className="absolute inset-0 bg-gradient-to-br from-[rgba(232,201,168,0.25)] via-transparent to-[rgba(196,92,62,0.12)]" />
            <span className="relative">WX</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[15px] font-semibold tracking-tight text-[var(--cream)]">
              Waxlist
            </span>
            <span className="mt-1 text-[10px] font-medium tracking-[0.12em] text-[var(--cream-faint)] uppercase">
              dig · rec · heart
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-[13px]">
          <Link
            href="/explore"
            className="rounded-full bg-[var(--gold-dim)] px-3.5 py-1.5 font-medium text-[var(--gold-soft)] ring-1 ring-[rgba(212,165,116,0.28)]"
          >
            精选
          </Link>
          <Link
            href="/chat"
            className="rounded-full px-3.5 py-1.5 text-[var(--cream-muted)] transition hover:bg-white/[0.03] hover:text-[var(--cream-soft)]"
          >
            Beat Hunter
          </Link>
          <Link
            href="/about"
            className="rounded-full px-3.5 py-1.5 text-[var(--cream-muted)] transition hover:bg-white/[0.03] hover:text-[var(--cream-soft)]"
          >
            关于
          </Link>
        </nav>
      </div>
    </header>
  );
}
