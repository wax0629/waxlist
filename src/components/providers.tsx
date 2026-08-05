"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { PendingReviewProvider } from "@/components/pending-review-badge";
import { UserAccountCorner } from "@/components/user-menu";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      // 少打 /api/auth/session：默认 focus 会重拉，体感卡
      refetchOnWindowFocus={false}
      refetchInterval={0}
    >
      <PendingReviewProvider>
        <UserAccountCorner />
        {children}
      </PendingReviewProvider>
    </SessionProvider>
  );
}
