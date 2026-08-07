import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { AdminUsersPanel } from "@/components/admin-users-panel";
import { auth } from "@/lib/auth";
import { isOwner } from "@/lib/auth/roles";
import { listUsers } from "@/lib/auth/user-store";
import { countPendingReleases } from "@/lib/recommendations/store";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/users");
  }
  if (!isOwner(session.user.role)) {
    redirect("/admin");
  }

  const [users, pending] = await Promise.all([
    listUsers(),
    countPendingReleases(),
  ]);

  return (
    <AdminShell
      title="账号与角色"
      subtitle="管理账号角色，并按用户开放评分与评论内测。"
      isOwner
      active="users"
      pending={pending}
    >
      <AdminUsersPanel
        initialUsers={users}
        selfId={session.user.id}
      />
    </AdminShell>
  );
}
