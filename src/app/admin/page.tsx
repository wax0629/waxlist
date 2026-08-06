import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { auth } from "@/lib/auth";
import { canModerate, isOwner } from "@/lib/auth/roles";
import { countUsers } from "@/lib/auth/user-store";
import { prisma } from "@/lib/db";
import { countPendingReleases } from "@/lib/recommendations/store";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin");
  }
  if (!canModerate(session.user.role)) {
    redirect("/explore");
  }

  const owner = isOwner(session.user.role);
  const [pending, published, rejected, users] = await Promise.all([
    countPendingReleases(),
    prisma.release.count({ where: { status: "published" } }),
    prisma.release.count({ where: { status: "rejected" } }),
    countUsers(),
  ]);

  const cards = [
    {
      label: "遗留待审",
      value: pending,
      hint: pending > 0 ? "旧队列待清" : "无阻塞",
      href: "/moderation",
      hot: pending > 0,
    },
    {
      label: "已上架",
      value: published,
      hint: "优质发行在架",
      href: "/explore",
      hot: false,
    },
    {
      label: "已拒绝",
      value: rejected,
      hint: "历史拒绝",
      href: "/moderation",
      hot: false,
    },
    {
      label: "注册用户",
      value: users,
      hint: owner ? "可在账号页分配角色" : "站主可分配管理",
      href: owner ? "/admin/users" : "/admin",
      hot: false,
    },
  ];

  return (
    <AdminShell
      title="后台"
      subtitle="内容、分类与账号角色的维护入口"
      isOwner={owner}
      active="overview"
      pending={pending}
    >
      {pending > 0 ? (
        <div className="mb-6 rounded-2xl border border-amber-400/35 bg-amber-500/10 px-4 py-3.5 sm:px-5">
          <p className="text-sm font-medium text-amber-50">
            有 {pending} 条旧版待审未清
          </p>
          <p className="mt-1 text-[13px] text-amber-100/70">
            新荐专已默认上架。请到内容管理通过或拒绝这些遗留条目。
          </p>
          <Link
            href="/moderation"
            className="mt-3 inline-flex text-sm font-medium text-amber-100 underline-offset-2 hover:underline"
          >
            去内容管理 →
          </Link>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-3.5 text-[13px] text-white/55 sm:px-5">
          荐专默认上架。管理可在「内容管理」查看近期新专，并对有问题的内容下架。
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {cards.map((c) => (
          <li key={c.label}>
            <Link
              href={c.href}
              className={[
                "block rounded-2xl border px-4 py-4 transition",
                c.hot
                  ? "border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15"
                  : "border-white/12 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]",
              ].join(" ")}
            >
              <p className="text-[12px] text-white/55">{c.label}</p>
              <p
                className={[
                  "mt-1 font-display text-2xl font-semibold tabular-nums",
                  c.hot ? "text-amber-100" : "text-white",
                ].join(" ")}
              >
                {c.value}
              </p>
              <p className="mt-1 text-[11px] text-white/40">{c.hint}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5">
          <h2 className="font-display text-base font-semibold text-white">
            常用入口
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link
                href="/admin/categories"
                className="text-[#ff9fbc] hover:underline"
              >
                分类维护
              </Link>
              <span className="text-white/40"> — 补充专辑地区</span>
            </li>
            <li>
              <Link
                href="/moderation"
                className="text-[#ff9fbc] hover:underline"
              >
                内容管理
              </Link>
              <span className="text-white/40"> — 新上架浏览 / 下架</span>
            </li>
            {owner ? (
              <li>
                <Link
                  href="/admin/users"
                  className="text-[#ff9fbc] hover:underline"
                >
                  账号与角色
                </Link>
                <span className="text-white/40"> — 把用户升为管理</span>
              </li>
            ) : null}
            <li>
              <Link
                href="/explore/submit"
                className="text-[#ff9fbc] hover:underline"
              >
                推荐专辑
              </Link>
              <span className="text-white/40">
                {" "}
                — 站主 / 管理提交会直接上架（不必走待审）
              </span>
            </li>
            <li>
              <Link href="/explore" className="text-[#ff9fbc] hover:underline">
                优质发行
              </Link>
              <span className="text-white/40"> — 前台浏览</span>
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5">
          <h2 className="font-display text-base font-semibold text-white">
            角色说明
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-white/65">
            <li>
              <strong className="text-white/90">站主</strong>
              ：审核、上架、友情标签、分配管理账号
            </li>
            <li>
              <strong className="text-white/90">管理</strong>
              ：内容管理（下架）、后台概览（不能改他人角色）
            </li>
            <li>
              <strong className="text-white/90">用户</strong>
              ：荐专默认上架、红心、评分、评论
            </li>
          </ul>
          <p className="mt-3 text-[12px] text-white/40">
            账号怎么发：见文档 docs/user/admin-accounts.md
          </p>
        </div>
      </section>
    </AdminShell>
  );
}
