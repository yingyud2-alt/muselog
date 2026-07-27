"use client";

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { closeAllDetails } from "@/lib/detail/detail-overlay-store";
import {
  clearReturnContext,
  getReturnLabel,
  peekReturnContext,
  restoreScrollPosition,
  saveReturnContext,
} from "@/lib/navigation/return-context";

/** Save browsing context, then open the full Work Detail page. */
export function navigateToWorkDetail(
  router: AppRouterInstance,
  workId: string,
  options?: { closeOverlays?: boolean },
) {
  // Keep the original shelf/home context when hopping between related works.
  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/work/")
  ) {
    saveReturnContext();
  }
  if (options?.closeOverlays !== false) {
    // Keep ReturnContext; do not flash-restore Explore scroll before leaving.
    closeAllDetails({
      preserveReturnContext: true,
      skipScrollRestore: true,
    });
  }
  router.push(`/work/${workId}`, { scroll: true });
}

/** Return to the saved browsing context without jumping to the top. */
export function returnToPreviousContext(router: AppRouterInstance) {
  const context = peekReturnContext();
  const target = context?.pathname || "/library";

  router.push(target, { scroll: false });

  // Restorer component also handles this; call scroll restore as a safety net
  // after soft navigation when context still matches.
  if (context) {
    window.setTimeout(() => {
      if (window.location.pathname === context.pathname) {
        restoreScrollPosition(context.scrollY, true);
      }
    }, 50);
  }
}

export function getSavedReturnLabel(): string {
  const context = peekReturnContext();
  if (!context) return "Return to Library";
  return getReturnLabel(context.pathname);
}

export function discardReturnContext() {
  clearReturnContext();
}
