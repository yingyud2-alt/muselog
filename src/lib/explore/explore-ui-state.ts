"use client";

import { useSyncExternalStore } from "react";

import type { ExploreMood } from "@/lib/content/constants";
import type { DiscoveryCategory } from "@/lib/content/explore-discovery";
import type { ContentType } from "@/lib/content/types";

/** Live Explore UI filters — survives SPA remounts across Work Detail. */
export type ExploreUiState = {
  exploreMood: ExploreMood;
  typeFilter: "all" | ContentType;
  category: DiscoveryCategory;
};

const DEFAULT_STATE: ExploreUiState = {
  exploreMood: "quiet",
  typeFilter: "all",
  category: "book",
};

let state: ExploreUiState = { ...DEFAULT_STATE };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getExploreUiState(): ExploreUiState {
  return state;
}

export function setExploreUiState(patch: Partial<ExploreUiState>) {
  const next = { ...state, ...patch };
  // Skip no-op updates so ReturnContext restore does not reflow Explore to top.
  if (
    next.exploreMood === state.exploreMood &&
    next.typeFilter === state.typeFilter &&
    next.category === state.category
  ) {
    return;
  }
  state = next;
  emit();
}

export function subscribeExploreUiState(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useExploreUiState(): ExploreUiState & {
  setExploreMood: (exploreMood: ExploreMood) => void;
  setTypeFilter: (typeFilter: "all" | ContentType) => void;
  setCategory: (category: DiscoveryCategory) => void;
  patchExploreUi: (patch: Partial<ExploreUiState>) => void;
} {
  const snapshot = useSyncExternalStore(
    subscribeExploreUiState,
    getExploreUiState,
    () => DEFAULT_STATE,
  );

  return {
    ...snapshot,
    setExploreMood: (exploreMood) => setExploreUiState({ exploreMood }),
    setTypeFilter: (typeFilter) => setExploreUiState({ typeFilter }),
    setCategory: (category) => setExploreUiState({ category }),
    patchExploreUi: setExploreUiState,
  };
}
