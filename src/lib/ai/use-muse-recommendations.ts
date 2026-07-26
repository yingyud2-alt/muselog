"use client";

import { useMemo } from "react";

import { useRecommendationInput } from "@/lib/ai/use-recommendation-input";
import {
  generateRecommendations,
  type Recommendation,
} from "@/lib/ai/recommendation-engine";

export function useMuseRecommendations(limit = 6): Recommendation[] {
  const input = useRecommendationInput();

  return useMemo(
    () => generateRecommendations(input, { limit }),
    [input, limit],
  );
}
