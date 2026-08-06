import { redirect } from "next/navigation";
import { AdminCategoryPanel } from "@/components/admin-category-panel";
import { AdminShell } from "@/components/admin-shell";
import { auth } from "@/lib/auth";
import { canModerate, isOwner } from "@/lib/auth/roles";
import { countPendingReleases } from "@/lib/recommendations/store";
import { listReleases } from "@/lib/releases/store";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/admin/categories");
  if (!canModerate(session.user.role)) redirect("/explore");

  const [releases, pending] = await Promise.all([
    listReleases({ status: "published" }),
    countPendingReleases(),
  ]);

  return (
    <AdminShell
      title="分类维护"
      subtitle="为在架专辑补充地区。可逐张多选，也可勾选后批量设置；发行年代由发布日期自动计算。"
      isOwner={isOwner(session.user.role)}
      active="categories"
      pending={pending}
    >
      <AdminCategoryPanel initialItems={releases} />
    </AdminShell>
  );
}
