import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07070c]/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/chat" className="group flex items-center gap-3">
          <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-zinc-900 text-[12px] font-bold tracking-tight text-violet-100 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_8px_24px_-8px_rgba(139,92,246,0.55)]">
            <span className="absolute inset-0 bg-gradient-to-br from-violet-500/50 via-fuchsia-500/20 to-transparent opacity-90" />
            <span className="relative">BH</span>
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-zinc-50">
              Beat Hunter
            </span>
            <span className="mt-1 text-[10px] font-medium tracking-wide text-zinc-500">
              伴奏猎手 · Beta
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1 text-[13px]">
          <Link
            href="/chat"
            className="rounded-full bg-white/[0.08] px-3.5 py-1.5 font-medium text-zinc-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/[0.06]"
          >
            找伴奏
          </Link>
          <span
            className="hidden cursor-not-allowed rounded-full px-3.5 py-1.5 text-zinc-600 sm:inline"
            title="后置认真建设"
          >
            地下精选
          </span>
          <Link
            href="/about"
            className="rounded-full px-3.5 py-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-200"
          >
            关于
          </Link>
        </nav>
      </div>
    </header>
  );
}
