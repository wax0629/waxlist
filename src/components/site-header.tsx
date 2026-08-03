import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.07] bg-black/20 px-4 backdrop-blur-md md:px-6">
      <Link href="/chat" className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/25 text-xs font-bold text-violet-200 ring-1 ring-violet-400/20">
          BH
        </span>
        <span className="text-sm font-semibold tracking-tight text-zinc-50">
          Beat Hunter
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/chat"
          className="rounded-lg bg-white/[0.08] px-3 py-1.5 text-zinc-100"
        >
          找伴奏
        </Link>
        <span
          className="cursor-not-allowed rounded-lg px-3 py-1.5 text-zinc-500"
          title="后置认真建设，不在当前 Beta"
        >
          地下精选
          <span className="ml-1 text-[10px] text-zinc-600">稍后</span>
        </span>
        <Link
          href="/about"
          className="rounded-lg px-3 py-1.5 text-zinc-400 transition hover:text-zinc-200"
        >
          关于
        </Link>
      </nav>
    </header>
  );
}
