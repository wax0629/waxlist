"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const presetEmail = search.get("email") || "";
  const callbackUrl = search.get("callbackUrl") || "/explore";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== password2) {
      setError("两次输入的密码不一致");
      return;
    }
    if (password.length < 8) {
      setError("密码至少 8 位");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          email,
          password,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "注册失败");

      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (login?.error) {
        router.push(
          `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
        );
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-white/28 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">注册</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-white/70">
          昵称（可选）
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
            autoComplete="nickname"
            maxLength={40}
          />
        </label>
        <label className="block text-sm text-white/70">
          邮箱 *
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
            autoComplete="email"
          />
        </label>
        <label className="block text-sm text-white/70">
          密码 *（至少 8 位）
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
        </label>
        <label className="block text-sm text-white/70">
          确认密码 *
          <input
            type="password"
            required
            minLength={8}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className={inputCls}
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="glass-btn glass-btn-block py-2.5 text-sm font-semibold"
        >
          {loading ? "提交中…" : presetEmail ? "设置密码并登录" : "注册"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/62">
        已有账号？{" "}
        <Link href="/login" className="text-white/80 underline">
          登录
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={<p className="p-8 text-center text-white/68">加载…</p>}
    >
      <RegisterForm />
    </Suspense>
  );
}
