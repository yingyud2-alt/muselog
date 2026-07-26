"use client";

import { getDetailOverlaySnapshot } from "@/lib/detail/detail-overlay-store";

export type LibraryUiSnapshot = {
  query: string;
  typeFilter: string;
  statusFilter: string;
  sort?: string;
};

export type ExploreUiSnapshot = {
  exploreMood: string;
  typeFilter: string;
  /** Category Explorer tab (book / film / music). */
  category?: string;
  /** Explore search query at leave time. */
  searchQuery?: string;
};

export type ReturnPageState = {
  library?: LibraryUiSnapshot;
  explore?: ExploreUiSnapshot;
};

export type ReturnContext = {
  pathname: string;
  scrollY: number;
  savedAt: number;
  pageState?: ReturnPageState;
};

const STORAGE_KEY = "muselog-return-context-v1";
const RESTORE_EVENT = "muselog-restore-return-context";
const MAX_AGE_MS = 1000 * 60 * 60; // 1 hour

type SnapshotProvider = () => ReturnPageState | null | undefined;

let snapshotProvider: SnapshotProvider | null = null;

/** Pages register a live UI snapshot captured right before leaving for /work. */
export function registerReturnSnapshotProvider(provider: SnapshotProvider) {
  snapshotProvider = provider;
  return () => {
    if (snapshotProvider === provider) {
      snapshotProvider = null;
    }
  };
}

function readStored(): ReturnContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReturnContext;
    if (!parsed?.pathname || typeof parsed.scrollY !== "number") return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(context: ReturnContext | null) {
  if (typeof window === "undefined") return;
  if (!context) {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(context));
}

/** Capture current browsing context before opening a Work Detail page. */
export function saveReturnContext(pathnameOverride?: string) {
  if (typeof window === "undefined") return;

  const pageState = snapshotProvider?.() ?? undefined;
  // Preview/detail overlays lock body scroll; prefer the scrollY saved when
  // the overlay opened so we don't persist 0 and jump to the top on return.
  const overlayScroll = readOverlaySavedScrollY();
  const scrollY =
    overlayScroll != null ? overlayScroll : window.scrollY;

  const context: ReturnContext = {
    pathname: pathnameOverride ?? window.location.pathname,
    scrollY,
    savedAt: Date.now(),
    pageState: pageState && Object.keys(pageState).length > 0 ? pageState : undefined,
  };

  writeStored(context);
}

function readOverlaySavedScrollY(): number | null {
  const overlay = getDetailOverlaySnapshot();
  if (overlay.stack.length > 0 && overlay.savedScrollY != null) {
    return overlay.savedScrollY;
  }
  return null;
}

export function peekReturnContext(): ReturnContext | null {
  return readStored();
}

export function clearReturnContext() {
  writeStored(null);
}

export function getReturnLabel(pathname: string): string {
  if (pathname === "/") return "Return Home";
  if (pathname.startsWith("/library")) return "Return to Library";
  if (pathname.startsWith("/explore")) return "Return to Explore";
  if (pathname.startsWith("/calendar") || pathname.startsWith("/journal")) {
    return "Return to Journal";
  }
  return "Go Back";
}

export function getReturnRestoreEventName() {
  return RESTORE_EVENT;
}

/** Dispatch UI restore for page components listening on the target route. */
export function dispatchReturnRestore(context: ReturnContext) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(RESTORE_EVENT, {
      detail: context,
    }),
  );
}

/** Smoothly restore window scroll after the destination page paints. */
export function restoreScrollPosition(scrollY: number, smooth = true) {
  if (typeof window === "undefined") return;

  const apply = (behavior: ScrollBehavior) => {
    window.scrollTo({
      top: scrollY,
      left: 0,
      behavior,
    });
  };

  // Instant first apply, then retries after filters/layout settle.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      apply("auto");
      window.setTimeout(() => apply(smooth ? "smooth" : "auto"), 60);
      window.setTimeout(() => apply("auto"), 180);
      window.setTimeout(() => apply("auto"), 360);
    });
  });
}
