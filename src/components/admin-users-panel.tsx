"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PublicUser } from "@/lib/auth/user-store";
import type { UserRole } from "@/lib/auth/roles";

function roleLabel(role: string): string {
  if (role === "owner") return "站主";
  if (role === "admin") return "管理";
  return "用户";
}

export function AdminUsersPanel({
  initialUsers,
  selfId,
}: {
  initialUsers: PublicUser[];
  selfId: string;
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function changeRole(userId: string, role: UserRole) {
    if (busyId) return;
    setBusyId(userId);
    setError(null);
    setOk(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: PublicUser;
      };
      if (!res.ok) throw new Error(data.error || "修改失败");
      if (data.user) {
        setUsers((prev) =>
          prev.map((u) => (u.id === data.user!.id ? data.user! : u)),
        );
        setOk(`已将 ${data.user.name} 设为${roleLabel(data.user.role)}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "修改失败");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100/90">
          {error}
        </div>
      ) : null}
      {ok ? (
        <div className="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100/90">
          {ok}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/12">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.04] text-[12px] text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">用户</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">
                邮箱
              </th>
              <th className="px-4 py-3 font-medium">角色</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === selfId;
              const busy = busyId === u.id;
              return (
                <tr
                  key={u.id}
                  className="border-b border-white/[0.06] last:border-0"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{u.name}</p>
                    {isSelf ? (
                      <p className="text-[11px] text-white/40">当前账号</p>
                    ) : null}
                  </td>
                  <td className="hidden px-4 py-3 text-white/55 sm:table-cell">
                    {u.email || u.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.role === "owner"
                          ? "text-[#ffc2d6]"
                          : u.role === "admin"
                            ? "text-amber-100/90"
                            : "text-white/70"
                      }
                    >
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "owner" || isSelf ? (
                      <span className="text-[12px] text-white/35">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {u.role !== "admin" ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void changeRole(u.id, "admin")}
                            className="rounded-full border border-amber-400/35 bg-amber-500/10 px-2.5 py-1 text-[12px] text-amber-100 disabled:opacity-50"
                          >
                            设为管理
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void changeRole(u.id, "user")}
                            className="rounded-full border border-white/15 px-2.5 py-1 text-[12px] text-white/65 disabled:opacity-50"
                          >
                            降为用户
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-white/40">
        管理可进后台、处理审核队列，不能改他人角色、不能取消站主。
        更稳妥的做法：先让对方自己注册，你再在此页升为管理；或把其邮箱写入服务器{" "}
        <code className="text-white/55">OWNER_EMAILS</code>（仅站主白名单）。
      </p>
    </div>
  );
}
