"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import {
  clearReturnContext,
  dispatchReturnRestore,
  peekReturnContext,
  restoreScrollPosition,
} from "@/lib/navigation/return-context";

/**
 * When landing back on a saved pathname after Work Detail,
 * restore filters/UI state and the exact scroll position.
 */
export function ReturnContextRestorer() {
  const pathname = usePathname();
  const lastRestoredKey = useRef<string | null>(null);

  useEffect(() => {
    if (pathname.startsWith("/work/")) return;

    const context = peekReturnContext();
    if (!context || context.pathname !== pathname) return;

    const key = `${context.pathname}:${context.savedAt}:${context.scrollY}`;
    if (lastRestoredKey.current === key) return;
    lastRestoredKey.current = key;

    dispatchReturnRestore(context);

    // Let page snapshot listeners apply filters before scrolling.
    window.setTimeout(() => {
      restoreScrollPosition(context.scrollY, true);
    }, 0);

    // Clear after restore so a later visit doesn't jump again.
    // Keep long enough for mount-time peek hydration in useReturnSnapshot.
    window.setTimeout(() => {
      clearReturnContext();
    }, 700);
  }, [pathname]);

  return null;
}
