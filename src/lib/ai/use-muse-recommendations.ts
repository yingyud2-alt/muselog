"use client";

import { useMemo, useSyncExternalStore } from "react";

import { useRecommendationInput } from "@/lib/ai/use-recommendation-input";
import {
  generateRecommendations,
  type Recommendation,
} from "@/lib/ai/recommendation-engine";
import { resolveCoverUrl } from "@/lib/work/cover-url";
import { findImportedWorkByIdentity } from "@/lib/work/imported-work-catalog";

export type MuseRecommendationsResult = {
  recommendations: Recommendation[];
  /** False during SSR and the hydration pass; true on the client after hydrate. */
  isHydrated: boolean;
};

const subscribeNoop = () => () => {};
const getClientHydratedSnapshot = () => true;
const getServerHydratedSnapshot = () => false;

/**
 * AI picks from mock catalog seed, with public API covers overlaid when an
 * imported Work matches title+creator (catalog remains fallback identity).
 *
 * Recommendation data is deferred until after hydration so SSR and the first
 * client render stay identical (imported works live in localStorage).
 */
export function useMuseRecommendations(limit = 6): MuseRecommendationsResult {
  const input = useRecommendationInput();
  const isHydrated = useSyncExternalStore(
    subscribeNoop,
    getClientHydratedSnapshot,
    getServerHydratedSnapshot,
  );

  const recommendations = useMemo(() => {
    if (!isHydrated) {
      return [];
    }

    const next = generateRecommendations(input, { limit });
    return next.map((item) => {
      const imported = findImportedWorkByIdentity(item.title, item.creator);
      return {
        ...item,
        cover: resolveCoverUrl(imported?.coverUrl, item.cover),
      };
    });
  }, [input, isHydrated, limit]);

  return { recommendations, isHydrated };
}
