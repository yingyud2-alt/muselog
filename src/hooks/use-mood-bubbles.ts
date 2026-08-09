"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { WorkBubble } from "@/components/dashboard/mood-bubble-data";
import {
  getExploreApiFeedCache,
  loadExploreApiFeed,
} from "@/lib/explore/explore-content-provider";
import { mapWorksToMoodBubbles } from "@/lib/recommendation/map-works-to-bubbles";
import {
  getMoodBubbleRecState,
  setMoodBubbleMood,
  useMoodBubbleRecState,
} from "@/lib/recommendation/mood-bubble-store";
import { recommendWorksByMood } from "@/lib/recommendation/mood-recommendation";
import {
  resolveRecommendationMood,
  type RecommendationMood,
} from "@/lib/recommendation/mood-taxonomy";
import { useMoodPreferences } from "@/lib/preferences/mood-preference-store";
import {
  countDisplayableApiWorksByType,
  filterDisplayableApiWorks,
} from "@/lib/work/displayable-api-work";
import { useImportedWorkMap } from "@/lib/work/imported-work-catalog";
import type { Work } from "@/types/work";

const MIN_ELIGIBLE_TOTAL = 60;
const MIN_PER_TYPE = 15;
const BUBBLE_POOL_LIMIT = 100;
const BUBBLE_MOOD_BOOTSTRAPPED = "muselog-mood-bubble-bootstrapped-v1";

function needsCatalogRefresh(works: Work[]): boolean {
  const counts = countDisplayableApiWorksByType(works);
  const total = counts.book + counts.movie + counts.music;
  if (total < MIN_ELIGIBLE_TOTAL) return true;
  return (
    counts.book < MIN_PER_TYPE ||
    counts.movie < MIN_PER_TYPE ||
    counts.music < MIN_PER_TYPE
  );
}

export type UseMoodBubblesResult = {
  bubbles: WorkBubble[];
  mood: RecommendationMood;
  isLoading: boolean;
  candidateCount: number;
  reshuffle: () => void;
  setMood: (mood: string) => void;
};

/**
 * Homepage Mood Bubbles — real API Works from the Explore catalog.
 */
export function useMoodBubbles(width: number): UseMoodBubblesResult {
  const importedMap = useImportedWorkMap();
  const { profile } = useMoodPreferences();
  const { mood, seed, setMood, reshuffle } = useMoodBubbleRecState();
  const [feedReady, setFeedReady] = useState(
    () => Boolean(getExploreApiFeedCache()),
  );
  const lastEmotionRef = useRef<string | null>(null);

  const catalogWorks = useMemo(
    () => filterDisplayableApiWorks(Object.values(importedMap)),
    [importedMap],
  );

  // First visit: adopt saved preference emotion when bubble mood was never chosen.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem(BUBBLE_MOOD_BOOTSTRAPPED)) return;
    const preferred = profile.emotions[0];
    if (preferred) {
      setMoodBubbleMood(resolveRecommendationMood(preferred));
    }
    window.localStorage.setItem(BUBBLE_MOOD_BOOTSTRAPPED, "1");
    lastEmotionRef.current = profile.emotions[0] ?? null;
  }, [profile.emotions]);

  // Later preference changes → recompute bubble mood.
  useEffect(() => {
    const preferred = profile.emotions[0] ?? null;
    if (!preferred) return;
    if (lastEmotionRef.current === null) {
      lastEmotionRef.current = preferred;
      return;
    }
    if (lastEmotionRef.current === preferred) return;
    lastEmotionRef.current = preferred;
    const current = getMoodBubbleRecState().mood;
    const next = resolveRecommendationMood(preferred);
    if (next !== current) setMood(next);
  }, [profile.emotions, setMood]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!needsCatalogRefresh(catalogWorks) && getExploreApiFeedCache()) {
        if (!cancelled) setFeedReady(true);
        return;
      }

      await loadExploreApiFeed();
      if (!cancelled) setFeedReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [catalogWorks.length]);

  const recommended = useMemo(() => {
    return recommendWorksByMood({
      mood,
      works: catalogWorks,
      limit: BUBBLE_POOL_LIMIT,
      seed: `${mood}:${seed}`,
    });
  }, [catalogWorks, mood, seed]);

  const bubbles = useMemo(() => {
    if (width <= 0) return [];
    return mapWorksToMoodBubbles({
      works: recommended,
      width,
      mood,
    });
  }, [recommended, width, mood]);

  const isLoading =
    !feedReady && catalogWorks.length === 0 && recommended.length === 0;

  return {
    bubbles,
    mood,
    isLoading,
    candidateCount: catalogWorks.length,
    reshuffle,
    setMood,
  };
}
