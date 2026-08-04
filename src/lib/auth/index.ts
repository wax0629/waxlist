import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "./roles";
import {
  accountNeedsPasswordSetup,
  findUserByEmail,
  findUserById,
  verifyPassword,
} from "./user-store";
import { normalizeEmail } from "./identifiers";

/**
 * Auth.js needs an absolute URL (with protocol).
 * Vercel users often set AUTH_URL=waxlist-nu.vercel.app (no https) → ERR_INVALID_URL.
 * Fallbacks: NEXTAUTH_URL, then VERCEL_URL (host only, always https).
 */
function normalizeAuthBaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim().replace(/\/+$/, "");
  if (!t) return undefined;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

const authUrl =
  normalizeAuthBaseUrl(process.env.AUTH_URL) ||
  normalizeAuthBaseUrl(process.env.NEXTAUTH_URL) ||
  normalizeAuthBaseUrl(process.env.VERCEL_URL);
if (authUrl) {
  process.env.AUTH_URL = authUrl;
  process.env.NEXTAUTH_URL = authUrl;
}

class NeedPasswordSetup extends CredentialsSignin {
  code = "NEED_PASSWORD_SETUP";
}

declare module "next-auth" {
  interface User {
    role?: UserRole;
    phone?: string | null;
  }
  interface Session {
    user: {
      id: string;
      email?: string | null;
      phone?: string | null;
      name?: string | null;
      role: UserRole;
    };
  }
  interface JWT {
    id?: string;
    role?: UserRole;
    phone?: string | null;
  }
}

const useSecureCookies =
  (process.env.AUTH_URL || process.env.NEXTAUTH_URL || "").startsWith(
    "https://",
  );

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = normalizeEmail(String(credentials?.email ?? ""));
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        try {
          // Legacy OTP accounts without password
          if (await accountNeedsPasswordSetup(email)) {
            throw new NeedPasswordSetup();
          }

          const user = await verifyPassword(email, password);
          if (!user) return null;
          return {
            id: user.id,
            email: user.email ?? null,
            phone: user.phone ?? null,
            name: user.name,
            role: user.role,
          };
        } catch (err) {
          if (err instanceof NeedPasswordSetup) throw err;
          console.error("[auth] authorize failed", err);
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? "user";
        token.phone = user.phone ?? null;
        token.email = user.email ?? null;
        token.name = user.name;
        token.userSyncedAt = Date.now();
        return token;
      }

      // 库被替换/恢复后 JWT 里的 userId 可能失效；按邮箱或 id 回表并对齐
      // 约 60s 校验一次，避免每个请求都打库
      const syncedAt =
        typeof token.userSyncedAt === "number" ? token.userSyncedAt : 0;
      if (Date.now() - syncedAt < 60_000 && token.id) {
        return token;
      }

      try {
        const email =
          typeof token.email === "string"
            ? normalizeEmail(token.email)
            : "";
        const id = String(token.id ?? token.sub ?? "");
        let row = email ? await findUserByEmail(email) : null;
        if (!row && id) row = await findUserById(id);
        if (row) {
          token.id = row.id;
          token.role = row.role;
          token.phone = row.phone ?? null;
          token.email = row.email ?? null;
          token.name = row.name;
          token.userSyncedAt = Date.now();
        } else {
          // 会话用户已不在库中：清空 id，需重新登录
          token.id = undefined;
          token.userSyncedAt = Date.now();
        }
      } catch (err) {
        console.error("[auth] jwt user reconcile failed", err);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id ?? token.sub ?? "");
        session.user.role = (token.role as UserRole) ?? "user";
        session.user.phone = (token.phone as string | null) ?? null;
        session.user.email =
          (token.email as string | null | undefined) ??
          session.user.email ??
          null;
        if (token.name) session.user.name = String(token.name);
      }
      return session;
    },
  },
  trustHost: true,
  /** Match cookie Secure flag to AUTH_URL (http domain → non-Secure cookies). */
  useSecureCookies,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
});

export { type UserRole } from "./roles";
export {
  canModerate,
  canManageOwnerContent,
  canParticipate,
  isOwner,
  isStaff,
} from "./roles";
