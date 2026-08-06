"use client";

import { useEffect, useRef, useState } from "react";

const SIDEBAR_TOP = "9.5rem";
const SIDEBAR_MAX_HEIGHT = "calc(100dvh - 10.5rem)";

type SidebarFrame = {
  left: number;
  width: number;
  height: number;
};

export function ExploreSidebar({ children }: { children: React.ReactNode }) {
  const anchorRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState<SidebarFrame | null>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const content = contentRef.current;
    if (!anchor || !content) return;

    const updateFrame = () => {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setFrame(null);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const contentRect = content.getBoundingClientRect();
      const next = {
        left: anchorRect.left,
        width: anchorRect.width,
        height: contentRect.height,
      };
      setFrame((current) => {
        if (
          current &&
          current.left === next.left &&
          current.width === next.width &&
          current.height === next.height
        ) {
          return current;
        }
        return next;
      });
    };

    const frameId = window.requestAnimationFrame(updateFrame);
    const observer = new ResizeObserver(updateFrame);
    observer.observe(anchor);
    observer.observe(content);
    window.addEventListener("resize", updateFrame);
    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", updateFrame);
    };
  }, []);

  return (
    <aside
      ref={anchorRef}
      className="min-w-0 lg:col-span-3 lg:self-start xl:col-span-2"
      style={frame ? { minHeight: frame.height } : undefined}
    >
      <div
        ref={contentRef}
        className="space-y-3 lg:space-y-4 lg:scrollbar-none"
        style={
          frame
            ? {
                position: "fixed",
                top: SIDEBAR_TOP,
                left: frame.left,
                width: frame.width,
                maxHeight: SIDEBAR_MAX_HEIGHT,
                overflowY: "auto",
                zIndex: 20,
              }
            : undefined
        }
      >
        {children}
      </div>
    </aside>
  );
}
