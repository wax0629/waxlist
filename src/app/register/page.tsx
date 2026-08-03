"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "注册失败");
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push("/login");
        return;
      }
      router.push("/explore");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">注册</h1>
      <p className="mt-2 text-sm text-white/50">
        第一个注册的账号会成为<strong className="text-white/80">站主</strong>
        ；也可在环境变量 <code className="text-white/60">OWNER_EMAILS</code>{" "}
        指定站主邮箱。
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-white/70">
          昵称
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            autoComplete="nickname"
          />
        </label>
        <label className="block text-sm text-white/70">
          邮箱
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            autoComplete="email"
          />
        </label>
        <label className="block text-sm text-white/70">
          密码（至少 8 位）
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            autoComplete="new-password"
          />
        </label>
        {error ? (
          <p className="text-sm text-rose-300">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="touri-grad w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "提交中…" : "注册"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/45">
        已有账号？{" "}
        <Link href="/login" className="text-white/80 underline">
          登录
        </Link>
      </p>
    </div>
  );
}
