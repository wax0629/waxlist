"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const callbackUrl = search.get("callbackUrl") || "/explore";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("邮箱或密码不正确");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">登录</h1>
      <p className="mt-2 text-sm text-white/50">
        推荐专辑、打分需要登录。未登录仍可浏览精选。
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
          密码
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35"
            autoComplete="current-password"
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
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/45">
        还没有账号？{" "}
        <Link href="/register" className="text-white/80 underline">
          注册
        </Link>
      </p>
      <p className="mt-3 text-center text-sm text-white/35">
        <Link href="/explore">先去逛精选 →</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="p-8 text-center text-white/50">加载…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
