import { redirect } from "next/navigation";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
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
        <main className="w-full min-w-0 flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pb-24 md:px-8 lg:px-10 xl:px-12">
          <div className="mx-auto w-full max-w-[1600px]">
            <BackLink href="/explore" label="返回优质发行" />
            <header className="mt-6 max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
                Moderation
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                审核队列
              </h1>
              <p className="mt-2 text-sm text-white/55">无权限访问此页面。</p>
            </header>
          </div>
        </main>
      </div>
    );
  }

  const items = await listPendingReleases();

  return (
    <div className="flex min-h-dvh flex-1 text-white">
      <AppRail />
      <main className="w-full min-w-0 flex-1 px-4 pt-8 pb-20 sm:px-6 sm:pb-24 md:px-8 lg:px-10 xl:px-12">
        <div className="mx-auto w-full max-w-[1600px]">
          <div className="mb-6">
            <BackLink href="/explore" label="返回优质发行" />
          </div>

          <header className="flex flex-wrap items-end justify-between gap-4 pr-12 sm:pr-14">
            <div className="min-w-0 max-w-2xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/50">
                Moderation
              </p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                审核队列
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                审阅用户提交的专辑：通过后上架到优质发行，拒绝则从队列移除。
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-white/15 bg-white/[0.04] px-3.5 py-1.5 text-[13px] text-white/70">
                待审{" "}
                <span className="tabular-nums font-medium text-white">
                  {items.length}
                </span>
              </span>
            </div>
          </header>

          <div
            className="mt-6 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(200,225,255,0.12) 8%, rgba(230,242,255,0.4) 50%, rgba(200,225,255,0.12) 92%, transparent 100%)",
            }}
            aria-hidden
          />

          <div className="mt-8">
            <ModerationQueue initialItems={items} />
          </div>
        </div>
      </main>
    </div>
  );
}
