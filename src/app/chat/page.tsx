import { Suspense } from "react";
import { ChatClient } from "./chat-client";

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-[#0b0b12] text-sm text-zinc-500">
          加载中…
        </div>
      }
    >
      <ChatClient />
    </Suspense>
  );
}
