"use client";

import type { Recommendation } from "@/lib/ai/recommendation-engine";
import type { ContentType } from "@/lib/content/types";
import {
  clearReturnContext,
  dispatchReturnRestore,
  peekReturnContext,
  registerOverlayScrollReader,
  saveReturnContext,
} from "@/lib/navigation/return-context";

export type WorkPreviewSnapshot = {
  title: string;
  creator: string;
  type: ContentType;
  cover?: string;
  tags?: string[];
  description?: string;
};

export type QuickLogOptions = {
  snapshot?: WorkPreviewSnapshot;
  /** Prefill / lock calendar day (YYYY-MM-DD). */
  initialDate?: string;
  /** Edit an existing journal entry in-place. */
  entryId?: string;
};

export type DetailLayer =
  | {
      type: "preview";
      workId: string;
      recommendation?: Recommendation;
      snapshot?: WorkPreviewSnapshot;
    }
  | {
      type: "detail";
      workId: string;
      snapshot?: WorkPreviewSnapshot;
    }
  | {
      type: "journal-memory-detail";
      /** Journal / calendar MediaItem id. */
      entryId: string;
    }
  | {
      type: "journal-quick-log";
      /** Empty string = create flow with work search. */
      workId: string;
      snapshot?: WorkPreviewSnapshot;
      initialDate?: string;
      entryId?: string;
    }
  | { type: "recommendation-batch"; recommendations: Recommendation[] };

type DetailOverlayState = {
  stack: DetailLayer[];
  savedScrollY: number | null;
};

export type CloseDetailOptions = {
  /** Keep ReturnContext for an imminent route change (e.g. /work/[id]). */
  preserveReturnContext?: boolean;
  /** Skip scroll restore when leaving the page (e.g. navigating to /work). */
  skipScrollRestore?: boolean;
};

const EMPTY: DetailOverlayState = {
  stack: [],
  savedScrollY: null,
};

let state: DetailOverlayState = EMPTY;
const listeners = new Set<() => void>();

/** ScrollY captured while body is position:fixed (window.scrollY reads 0). */
let bodyLockScrollY = 0;

registerOverlayScrollReader(() => {
  if (state.stack.length > 0 && state.savedScrollY != null) {
    return state.savedScrollY;
  }
  return null;
});

function emit() {
  for (const listener of listeners) listener();
}

/**
 * Lock page scroll without browsers resetting window.scrollY to 0.
 * overflow:hidden alone often jumps Explore back to the top.
 */
function lockScroll() {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  bodyLockScrollY = window.scrollY;
  const { body } = document;
  body.style.position = "fixed";
  body.style.top = `-${bodyLockScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
}

function clearBodyScrollLock() {
  if (typeof document === "undefined") return;
  const { body } = document;
  body.style.position = "";
  body.style.top = "";
  body.style.left = "";
  body.style.right = "";
  body.style.width = "";
  body.style.overflow = "";
}

function unlockScroll(restoreY?: number | null) {
  if (typeof window === "undefined") return;

  const y = restoreY ?? bodyLockScrollY;
  clearBodyScrollLock();
  window.scrollTo({ top: y, left: 0, behavior: "auto" });
}

function restoreScroll(y: number | null) {
  if (typeof window === "undefined" || y == null) return;

  const apply = () => {
    window.scrollTo({ top: y, left: 0, behavior: "auto" });
  };

  // Re-apply after unlock/layout/filter restore so Explore does not jump to top.
  apply();
  requestAnimationFrame(() => {
    apply();
    requestAnimationFrame(() => {
      apply();
      window.setTimeout(apply, 50);
      window.setTimeout(apply, 120);
      window.setTimeout(apply, 240);
    });
  });
}

function pushLayer(layer: DetailLayer) {
  const openingFirst = state.stack.length === 0;
  const savedScrollY = openingFirst
    ? typeof window !== "undefined"
      ? window.scrollY
      : 0
    : state.savedScrollY;

  if (openingFirst) lockScroll();

  state = {
    stack: [...state.stack, layer],
    savedScrollY,
  };
  emit();
}

function captureReturnContextBeforeOpen() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/work/")) return;
  // Capture filters + scroll before body lock (overlay stack still empty).
  saveReturnContext();
}

function restoreUnderlyingPage(options?: CloseDetailOptions) {
  const savedScrollY = state.savedScrollY;
  const ctx = peekReturnContext();
  const onSamePage =
    Boolean(ctx) &&
    typeof window !== "undefined" &&
    ctx!.pathname === window.location.pathname;

  const scrollY =
    onSamePage && ctx
      ? ctx.scrollY
      : (savedScrollY ?? bodyLockScrollY);

  // Navigating away: clear lock styles only — ReturnContext owns the return scroll.
  if (options?.skipScrollRestore) {
    clearBodyScrollLock();
    state = EMPTY;
    emit();
    if (!options.preserveReturnContext) {
      window.setTimeout(() => clearReturnContext(), 0);
    }
    return;
  }

  // Unlock restores scroll immediately (critical with position:fixed).
  unlockScroll(scrollY);
  state = EMPTY;
  emit();

  if (onSamePage && ctx) {
    dispatchReturnRestore(ctx);
    restoreScroll(scrollY);
    if (!options?.preserveReturnContext) {
      window.setTimeout(() => clearReturnContext(), 0);
    }
    return;
  }

  restoreScroll(scrollY);
}

type PreviewOptions = {
  recommendation?: Recommendation;
  snapshot?: WorkPreviewSnapshot;
};

type DetailOptions = {
  snapshot?: WorkPreviewSnapshot;
};

/** Open a lightweight work preview without leaving the current page. */
export function openWorkPreview(workId: string, options?: PreviewOptions) {
  if (state.stack.length === 0) captureReturnContextBeforeOpen();
  pushLayer({
    type: "preview",
    workId,
    recommendation: options?.recommendation,
    snapshot: options?.snapshot,
  });
}

/** Open the full Work Detail modal in-place (no route change). */
export function openWorkDetail(workId: string, options?: DetailOptions) {
  if (state.stack.length === 0) captureReturnContextBeforeOpen();
  pushLayer({
    type: "detail",
    workId,
    snapshot: options?.snapshot,
  });
}

/** Open AI recommendation as the same lightweight preview modal. */
export function openRecommendationDetail(recommendation: Recommendation) {
  openWorkPreview(recommendation.id, { recommendation });
}

/** Open a batch AI recommendation collection (~10 items). */
export function openRecommendationBatch(recommendations: Recommendation[]) {
  if (state.stack.length === 0) captureReturnContextBeforeOpen();
  pushLayer({ type: "recommendation-batch", recommendations });
}

/** Open Journal Memory Detail (calendar entry) — not Work Detail. */
export function openJournalMemoryDetail(entryId: string) {
  if (!entryId.trim()) return;
  if (state.stack.length === 0) captureReturnContextBeforeOpen();
  pushLayer({
    type: "journal-memory-detail",
    entryId: entryId.trim(),
  });
}

/** Open Quick Memory modal for a work (no route change; scroll preserved). */
export function openJournalQuickLog(workId: string, options?: QuickLogOptions) {
  if (state.stack.length === 0) captureReturnContextBeforeOpen();
  pushLayer({
    type: "journal-quick-log",
    workId,
    snapshot: options?.snapshot,
    initialDate: options?.initialDate,
    entryId: options?.entryId,
  });
}

/** Empty calendar cell → Quick Memory create (work search + date). */
export function openJournalQuickLogCreate(date: string) {
  openJournalQuickLog("", { initialDate: date });
}

/** Close the topmost layer; restore scroll when stack is empty. */
export function closeDetail(options?: CloseDetailOptions) {
  if (state.stack.length === 0) return;

  const nextStack = state.stack.slice(0, -1);

  if (nextStack.length === 0) {
    restoreUnderlyingPage(options);
    return;
  }

  state = { stack: nextStack, savedScrollY: state.savedScrollY };
  emit();
}

/** Close every layer and restore the underlying page. */
export function closeAllDetails(options?: CloseDetailOptions) {
  if (state.stack.length === 0) return;
  restoreUnderlyingPage(options);
}

export function getDetailOverlaySnapshot(): DetailOverlayState {
  return state;
}

export function subscribeDetailOverlay(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTopDetailLayer(): DetailLayer | null {
  return state.stack[state.stack.length - 1] ?? null;
}
