"use client";

import { useMemo } from "react";

import { useRecommendationInput } from "@/lib/ai/use-recommendation-input";
import {
  generateRecommendations,
  type Recommendation,
} from "@/lib/ai/recommendation-engine";
import { resolveCoverUrl } from "@/lib/work/cover-url";
import { findImportedWorkByIdentity } from "@/lib/work/imported-work-catalog";

/**
 * AI picks from mock catalog seed, with public API covers overlaid when an
 * imported Work matches title+creator (catalog remains fallback identity).
 */
export function useMuseRecommendations(limit = 6): Recommendation[] {
  const input = useRecommendationInput();

  return useMemo(() => {
    const recommendations = generateRecommendations(input, { limit });
    return recommendations.map((item) => {
      const imported = findImportedWorkByIdentity(item.title, item.creator);
      return {
        ...item,
        cover: resolveCoverUrl(imported?.coverUrl, item.cover),
      };
    });
  }, [input, limit]);
}
