import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#050508]/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:px-6">
        <Link href="/chat" className="group flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/40 to-fuchsia-500/20 text-[11px] font-bold tracking-tight text-violet-100 ring-1 ring-white/10 shadow-lg shadow-violet-950/40 transition group-hover:ring-violet-400/30">
            BH
          </span>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-zinc-50">
              Beat Hunter
            </span>
            <span className="mt-0.5 text-[10px] text-zinc-500">找伴奏 · Beta</span>
          </div>
        </Link>
        <nav className="flex items-center gap-0.5 text-[13px]">
          <Link
            href="/chat"
            className="rounded-lg bg-white/[0.07] px-3 py-1.5 font-medium text-zinc-100 ring-1 ring-white/[0.06]"
          >
            找伴奏
          </Link>
          <span
            className="cursor-not-allowed rounded-lg px-3 py-1.5 text-zinc-600"
            title="后置认真建设"
          >
            地下精选
          </span>
          <Link
            href="/about"
            className="rounded-lg px-3 py-1.5 text-zinc-500 transition hover:bg-white/[0.04] hover:text-zinc-300"
          >
            关于
          </Link>
        </nav>
      </div>
    </header>
  );
}
