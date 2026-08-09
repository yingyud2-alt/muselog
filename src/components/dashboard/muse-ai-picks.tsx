"use client";

/**
 * @deprecated Prefer `@/components/ai/muse-ai-picks`.
 * Home wrapper kept for existing dashboard imports.
 */
import { MuseAiPicks as SharedMuseAiPicks } from "@/components/ai/muse-ai-picks";
import { useLanguage } from "@/components/i18n/language-provider";
import type { Recommendation } from "@/lib/ai/recommendation-engine";

type MuseAiPicksProps = {
  recommendations: Recommendation[];
  batchRecommendations?: Recommendation[];
  isHydrated?: boolean;
  likedTitle?: string;
};

export function MuseAiPicks({
  recommendations,
  batchRecommendations,
  isHydrated,
}: MuseAiPicksProps) {
  const { t } = useLanguage();

  return (
    <SharedMuseAiPicks
      recommendations={recommendations}
      batchRecommendations={batchRecommendations}
      isHydrated={isHydrated}
      title={t("page.museAiPicks")}
      description="Personal recommendations from your taste"
      variant="compact"
    />
  );
}
