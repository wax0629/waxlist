import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AppRail } from "@/components/app-rail";
import { BackLink } from "@/components/back-link";
import { ModerationQueue } from "@/components/moderation-queue";
import { auth } from "@/lib/auth";
import { canModerate, isOwner } from "@/lib/auth/roles";
import {
  countPendingReleases,
  listModerationFeed,
} from "@/lib/recommendations/store";

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
              <h1 className="font-display text-2xl font-semibold">审核</h1>
              <p className="mt-2 text-sm text-white/55">无权限访问此页面。</p>
            </header>
          </div>
        </main>
      </div>
    );
  }

  const [items, leftoverPending] = await Promise.all([
    listModerationFeed(),
    countPendingReleases(),
  ]);
  const owner = isOwner(session.user.role);

  return (
    <AdminShell
      title="内容管理"
      subtitle="用户荐专默认上架。这里浏览近期新内容，有问题再下架；曾被拒绝的专辑不能再推。"
      isOwner={owner}
      active="moderation"
      pending={leftoverPending}
    >
      {leftoverPending > 0 ? (
        <div className="mb-5 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50/95">
          仍有 {leftoverPending}{" "}
          条旧版「待审」记录，请通过上架或拒绝清掉。新提交不会再进待审。
        </div>
      ) : null}
      <ModerationQueue initialItems={items} />
    </AdminShell>
  );
}
