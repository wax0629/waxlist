import Link from "next/link";
import { redirect } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { ModerationQueue } from "@/components/moderation-queue";
import { auth } from "@/lib/auth";
import { canModerate } from "@/lib/auth/roles";
import { listPendingReleases } from "@/lib/recommendations/store";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/moderation");
  }

  if (!canModerate(session.user.role)) {
    return (
      <div className="flex min-h-dvh flex-1 text-white">
        <AppRail />
        <main className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
          <h1 className="font-display text-xl font-semibold">审核队列</h1>
          <p className="mt-3 text-sm text-white/55">无权限访问</p>
          <Link
            href="/explore"
            className="mt-6 inline-block text-sm text-[#ff8fb3] hover:underline"
          >
            ← 返回优质发行
          </Link>
        </main>
      </div>
    );
  }

  const items = await listPendingReleases();

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/explore"
          className="text-sm text-white/62 hover:text-white/80"
        >
          ← 返回优质发行
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 pr-12 sm:pr-14">
          <div>
            <h1 className="font-display text-2xl font-semibold">审核队列</h1>
            <p className="mt-1 text-sm text-white/62">
              待审 {items.length} 条
            </p>
          </div>
          <Link
            href="/explore/submit"
            className="text-sm text-white/68 hover:text-white/80"
          >
            推荐专辑 →
          </Link>
        </div>

        <ModerationQueue initialItems={items} />
      </main>
    </div>
  );
}
