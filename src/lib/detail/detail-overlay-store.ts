"use client";

import type { Recommendation } from "@/lib/ai/recommendation-engine";
import type { ContentType } from "@/lib/content/types";

export type WorkPreviewSnapshot = {
  title: string;
  creator: string;
  type: ContentType;
  cover?: string;
  tags?: string[];
  description?: string;
};

export type DetailLayer =
  | {
      type: "preview";
      workId: string;
      recommendation?: Recommendation;
      snapshot?: WorkPreviewSnapshot;
    }
  | { type: "recommendation-batch"; recommendations: Recommendation[] };

type DetailOverlayState = {
  stack: DetailLayer[];
  savedScrollY: number | null;
};

const EMPTY: DetailOverlayState = {
  stack: [],
  savedScrollY: null,
};

let state: DetailOverlayState = EMPTY;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function lockScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  if (typeof document === "undefined") return;
  document.body.style.overflow = "";
}

function restoreScroll(y: number | null) {
  if (typeof window === "undefined" || y == null) return;
  requestAnimationFrame(() => {
    window.scrollTo(0, y);
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

type PreviewOptions = {
  recommendation?: Recommendation;
  snapshot?: WorkPreviewSnapshot;
};

/** Open a lightweight work preview without leaving the current page. */
export function openWorkPreview(workId: string, options?: PreviewOptions) {
  pushLayer({
    type: "preview",
    workId,
    recommendation: options?.recommendation,
    snapshot: options?.snapshot,
  });
}

/** @deprecated Use openWorkPreview — kept for existing call sites. */
export function openWorkDetail(workId: string) {
  openWorkPreview(workId);
}

/** Open AI recommendation as the same lightweight preview modal. */
export function openRecommendationDetail(recommendation: Recommendation) {
  openWorkPreview(recommendation.id, { recommendation });
}

/** Open a batch AI recommendation collection (~10 items). */
export function openRecommendationBatch(recommendations: Recommendation[]) {
  pushLayer({ type: "recommendation-batch", recommendations });
}

/** Close the topmost layer; restore scroll when stack is empty. */
export function closeDetail() {
  if (state.stack.length === 0) return;

  const nextStack = state.stack.slice(0, -1);
  const savedScrollY = state.savedScrollY;

  if (nextStack.length === 0) {
    unlockScroll();
    state = EMPTY;
    emit();
    restoreScroll(savedScrollY);
    return;
  }

  state = { stack: nextStack, savedScrollY };
  emit();
}

/** Close every layer and restore the underlying page. */
export function closeAllDetails() {
  if (state.stack.length === 0) return;
  const savedScrollY = state.savedScrollY;
  unlockScroll();
  state = EMPTY;
  emit();
  restoreScroll(savedScrollY);
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
