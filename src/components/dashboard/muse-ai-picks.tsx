"use client";

/**
 * @deprecated Prefer `@/components/ai/muse-ai-picks`.
 * Home wrapper kept for existing dashboard imports.
 */
import { MuseAiPicks as SharedMuseAiPicks } from "@/components/ai/muse-ai-picks";
import type { Recommendation } from "@/lib/ai/recommendation-engine";

type MuseAiPicksProps = {
  recommendations: Recommendation[];
  batchRecommendations?: Recommendation[];
  likedTitle?: string;
};

export function MuseAiPicks({
  recommendations,
  batchRecommendations,
}: MuseAiPicksProps) {
  return (
    <SharedMuseAiPicks
      recommendations={recommendations}
      batchRecommendations={batchRecommendations}
      title="Muse AI Picks"
      description="Personal recommendations from your taste"
      variant="compact"
    />
  );
}
