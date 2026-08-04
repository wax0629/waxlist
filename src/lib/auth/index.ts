import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "./roles";
import {
  accountNeedsPasswordSetup,
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
