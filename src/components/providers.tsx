"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { UserAccountCorner } from "@/components/user-menu";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserAccountCorner />
      {children}
    </SessionProvider>
  );
}
