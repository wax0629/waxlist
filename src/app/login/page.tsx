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
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        const code =
          (res as { code?: string }).code ||
          res.error ||
          "";
        if (
          code.includes("NEED_PASSWORD_SETUP") ||
          String(res.error).includes("NEED_PASSWORD_SETUP")
        ) {
          setError(
            "此邮箱还没设置密码（以前用验证码登录）。请到注册页为该邮箱设置密码。",
          );
        } else {
          setError("邮箱或密码不正确");
        }
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    "mt-1.5 w-full rounded-xl border border-white/28 bg-transparent px-3 py-2.5 text-white outline-none focus:border-white/35";

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">登录</h1>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm text-white/70">
          邮箱
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
          密码
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
            autoComplete="current-password"
          />
        </label>
        {error ? (
          <p className="text-sm text-rose-300">
            {error}{" "}
            {error.includes("设置密码") ? (
              <Link
                href={`/register?email=${encodeURIComponent(email)}`}
                className="underline text-[#ff8fb3]"
              >
                去设置 →
              </Link>
            ) : null}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="touri-grad w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "登录中…" : "登录"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-white/62">
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
      fallback={<p className="p-8 text-center text-white/68">加载…</p>}
    >
      <LoginForm />
    </Suspense>
  );
}
