import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/10 px-4 md:px-6">
      <Link href="/chat" className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/20 text-xs font-bold text-violet-300">
          BH
        </span>
        <span className="text-sm font-semibold tracking-tight text-zinc-100">
          Beat Hunter
        </span>
      </Link>
      <nav className="flex items-center gap-1 text-sm">
        <Link
          href="/chat"
          className="rounded-lg px-3 py-1.5 text-zinc-100 bg-white/10"
        >
          找伴奏
        </Link>
        <span
          className="cursor-not-allowed rounded-lg px-3 py-1.5 text-zinc-500"
          title="二期"
        >
          地下精选
          <span className="ml-1 text-[10px] text-zinc-600">即将推出</span>
        </span>
      </nav>
    </header>
  );
}
