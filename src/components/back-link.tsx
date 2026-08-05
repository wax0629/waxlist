import Link from "next/link";

/** 圆润质感返回箭头（仅图标，文案走 aria-label） */
export function BackLink({
  href,
  label = "返回",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="inline-flex h-10 w-10 touch-manipulation items-center justify-center rounded-full border border-white/20 bg-white/[0.06] text-white/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-sm transition active:scale-95 hover:border-white/35 hover:bg-white/[0.1] hover:text-white"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
      >
        <path
          d="M14.5 6.5 9 12l5.5 5.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
