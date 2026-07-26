"use client";

import { useMemo } from "react";

import {
  buildRecommendationInputFromLibrary,
  type RecommendationInput,
} from "@/lib/ai/recommendation-engine";
import { useJournalEntries } from "@/lib/calendar/journal-store";
import { getContentByMediaKey } from "@/lib/content/bubble-content-bridge";
import { getUserContentById } from "@/lib/content/user-content-store";
import { useLibraryItems } from "@/lib/library/use-library-items";
import {
  buildRecommendationContext,
  useMoodPreferences,
} from "@/lib/preferences/mood-preference-store";
import {
  buildContentTagsMap,
  calculateTasteTags,
} from "@/lib/profile/profile-utils";

/**
 * Shared recommendation context for Muse AI picks + Surprise Muse.
 * Mood preference profile boosts tags/mood signals (API-ready shape).
 */
export function useRecommendationInput(): RecommendationInput {
  const { allItems } = useLibraryItems();
  const { entries: journalEntries } = useJournalEntries();
  const { recommendationContext } = useMoodPreferences();

  return useMemo(() => {
    const contentTagsByKey = buildContentTagsMap(allItems);

    for (const item of allItems) {
      const catalog = getContentByMediaKey(item.mediaKey);
      const userContent = getUserContentById(item.mediaKey);
      contentTagsByKey[item.mediaKey] = [
        ...(contentTagsByKey[item.mediaKey] ?? []),
        ...(catalog?.tags ?? []),
        ...(userContent?.tags ?? []),
      ];
    }

    const tasteTags = calculateTasteTags(
      allItems,
      journalEntries,
      contentTagsByKey,
    );

    const preference = recommendationContext ?? buildRecommendationContext();
    const derived = tasteTags.map((tag) => tag.label.toLowerCase());

    return buildRecommendationInputFromLibrary(
      allItems,
      journalEntries.map((entry) => ({
        title: entry.title,
        type: entry.type,
        note: entry.note,
        quote: entry.quote,
        tags: entry.tags,
        rating: entry.rating,
      })),
      Array.from(
        new Set([...preference.preferenceTags, ...derived]),
      ),
      Array.from(
        new Set([...preference.moodKeywords, ...derived]),
      ),
      contentTagsByKey,
    );
  }, [allItems, journalEntries, recommendationContext]);
}
